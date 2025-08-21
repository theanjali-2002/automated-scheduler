const express = require('express');
const router = express.Router(); // Initialize the router
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');

router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password, role, adminSecret, signupCode } = req.body;

    if (signupCode !== process.env.SIGNUP_CODE) {
        return res.status(403).json({ error: 'Invalid signup code.' });
    }

    let finalRole = 'user'; // Default role

    // Only assign admin role if the correct secret is provided
    if (role === 'admin') {
        if (adminSecret && process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) {
            finalRole = 'admin';
        } else {
            return res.status(403).json({ error: 'Unauthorized to create admin.' });
        }
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            email: normalizedEmail,
            password: hashedPassword,
            role: finalRole
        });

        await newUser.save();

        res.status(201).json({
            message: 'User signed up successfully!',
            user: {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error.' });
    }
});



router.get('/admin/data', auth, adminOnly, async (req, res) => {
    try {
        const users = await User.find({}, 'firstName lastName email role userRole major coopStatus availability');

        const enrichedUsers = users.map(user => {
            const isComplete =
                user.role === 'admin'
                    ? !!user.firstName && !!user.lastName && !!user.email
                    : (
                        !!user.firstName &&
                        !!user.lastName &&
                        !!user.email &&
                        !!user.userRole &&
                        !!user.major &&
                        !!user.coopStatus &&
                        (
                            user.coopStatus === 'Yes' ||
                            (
                                Array.isArray(user.availability) &&
                                user.availability.reduce((count, day) => count + day.slots.length, 0) >= 9
                            )
                        )
                    );


            // debug log here
            if (!isComplete) {
                console.log(`Incomplete: ${user.email}`);
                console.log({
                    userRole: user.userRole,
                    major: user.major,
                    coopStatus: user.coopStatus,
                    slots: user.availability?.reduce((c, d) => c + d.slots.length, 0) || 0
                });
            }

            return {
                ...user.toObject(),
                isComplete
            };
        });

        res.status(200).json(enrichedUsers);
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ error: 'Failed to fetch admin data' });
    }
});




router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        // Generate a JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Payload
            process.env.JWT_SECRET,           // Secret key
            { expiresIn: '1h' }               // Token expiration
        );

        // Send response with the token
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// API allowing users for submitting or updating their availability
router.post('/availability', auth, async (req, res) => {
    try {
        const { availability } = req.body;

        // Validate availability format
        if (!availability || !Array.isArray(availability) || availability.length === 0) {
            return res.status(400).json({ error: 'Availability data is required and must be an array.' });
        }

        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const isValid = availability.every(item =>
            validDays.includes(item.day) &&
            Array.isArray(item.slots) &&
            item.slots.every(slot => typeof slot === 'string')
        );

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid availability format.' });
        }

        // Enforce rule: at least 3 consecutive slots thrice a week
        const isValidSubmission = availability.filter(day => day.slots.length >= 3).length >= 3;

        if (!isValidSubmission) {
            return res.status(400).json({
                error: 'You must select at least 3 consecutive slots thrice a week.'
            });
        }

        // Fetch current user
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Compare availability (basic stringify comparison)
        const oldString = JSON.stringify(user.availability || []);
        const newString = JSON.stringify(availability);

        // Update availability
        user.availability = availability;
        await user.save();

        res.status(200).json({ message: 'Availability updated successfully', availability: user.availability });

        // Log only if changed
        if (oldString !== newString) {
            await AuditLog.create({
                actionType: 'availability_update',
                performedBy: req.user.id,
                affectedUser: req.user.id,
                details: {
                    slotCount: user.availability.reduce((c, d) => c + d.slots.length, 0)
                }
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// This API will allow users to submit their additional details
router.post('/details', auth, async (req, res) => {
    const { userRole, major, coopStatus, notes } = req.body;

    // Validation: Ensure required fields are provided
    if (!major || (req.user.role === 'user' && !userRole) || !coopStatus) {
        return res.status(400).json({ error: 'Major, user role (for users), and co-op status are required.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const updatedFields = [];

        // Check each field and track if it changes
        if (user.major !== major) updatedFields.push('major');
        if (user.coopStatus !== coopStatus) updatedFields.push('coopStatus');
        if ((notes || '') !== (user.notes || '')) updatedFields.push('notes');
        if (req.user.role === 'user' && user.userRole !== userRole) {
            updatedFields.push('userRole');
        }

        // Perform the updates
        user.major = major;
        user.notes = notes || '';
        user.coopStatus = coopStatus;
        // If user is on co-op, clear availability
        if (coopStatus === 'Yes') {
            user.availability = [];
        }
        if (req.user.role === 'user') {
            user.userRole = userRole;
        }

        await user.save();

        // Log only if something actually changed
        if (updatedFields.length > 0) {
            await AuditLog.create({
                actionType: 'self_details_update',
                performedBy: req.user.id,
                affectedUser: req.user.id,
                details: { updatedFields }
            });
        }

        res.status(200).json({
            message: 'Details submitted successfully.',
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                major: user.major,
                userRole: user.userRole,
                coopStatus: user.coopStatus,
                notes: user.notes
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Helper function to check if slots are consecutive
function areConsecutiveSlots(slots) {
    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const slotMinutes = slots.map((slot) => {
        const [start, end] = slot.split('-');
        return timeToMinutes(start);
    });

    for (let i = 1; i < slotMinutes.length; i++) {
        if (slotMinutes[i] - slotMinutes[i - 1] !== 30) {
            return false; // Not consecutive
        }
    }

    return true; // All slots are consecutive
}

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile (firstName, lastName, email)
router.post('/profile', auth, async (req, res) => {
    let { firstName, lastName, email } = req.body;

    // Normalize email
    if (email) {
        email = email.trim().toLowerCase();
    }

    if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    try {
        console.log('REQ.USER DEBUG:', req.user);
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Only check for duplicates if email has actually changed
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email is already in use by another user.' });
            }
        }

        // Track what was actually changed
        const updatedFields = [];
        if (user.firstName !== firstName) updatedFields.push('firstName');
        if (user.lastName !== lastName) updatedFields.push('lastName');
        if (user.email !== email) updatedFields.push('email');

        // Apply the changes
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;

        await user.save();

        // Only log if something changed
        if (updatedFields.length > 0) {
            await AuditLog.create({
                actionType: 'self_profile_update',
                performedBy: req.user.id,
                affectedUser: req.user.id,
                details: { updatedFields }
            });
        }

        res.status(200).json({
            message: 'Profile updated successfully.',
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET a user's profile by ID (admin only)
router.get('/admin/profile/:id', auth, adminOnly, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

// POST to update any user’s data (admin only)
router.post('/admin/details/:id', auth, adminOnly, async (req, res) => {
    const { firstName, lastName, email, userRole, major, coopStatus, notes } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedFields = [];

    if (user.firstName !== firstName) updatedFields.push('firstName');
    if (user.lastName !== lastName) updatedFields.push('lastName');
    if (user.email !== email) updatedFields.push('email');
    if (user.userRole !== userRole) updatedFields.push('userRole');
    if (user.major !== major) updatedFields.push('major');
    if (user.coopStatus !== coopStatus) updatedFields.push('coopStatus');
    if ((user.notes || '') !== (notes || '')) updatedFields.push('notes');

    // Apply the changes regardless (admin can override), but log only if actual changes
    Object.assign(user, { firstName, lastName, email, userRole, major, coopStatus, notes });
    await user.save();

    if (updatedFields.length > 0) {
        await AuditLog.create({
            actionType: 'admin_profile_update',
            performedBy: req.user.id,
            affectedUser: user._id,
            details: { updatedFields }
        });
    }

    res.json({ message: 'User updated by admin successfully.' });
});

router.post('/admin/availability/:id', auth, adminOnly, async (req, res) => {
    const { availability } = req.body;

    if (!availability || !Array.isArray(availability) || availability.length === 0) {
        return res.status(400).json({ error: 'Availability must be a non-empty array.' });
    }

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const isValid = availability.every(item =>
        validDays.includes(item.day) &&
        Array.isArray(item.slots) &&
        item.slots.every(slot => typeof slot === 'string')
    );

    if (!isValid) {
        return res.status(400).json({ error: 'Invalid availability format.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oldAvailability = JSON.stringify(user.availability || []);
    const newAvailability = JSON.stringify(availability);

    // Only update and log if there's a change
    if (oldAvailability !== newAvailability) {
        user.availability = availability;
        await user.save();

        await AuditLog.create({
            actionType: 'admin_availability_update',
            performedBy: req.user.id,
            affectedUser: user._id,
            details: {
                slotCount: availability.reduce((sum, day) => sum + day.slots.length, 0)
            }
        });
    }

    res.status(200).json({
        message: 'Availability updated successfully by admin',
        availability: user.availability
    });

});

// Admin dashboard metrics
router.get('/admin/metrics', auth, adminOnly, async (req, res) => {
    try {
        const users = await User.find();

        const totalMentors = users.filter(u => u.role === 'user').length;
        const teamLeads = users.filter(u => u.userRole === 'Team Lead & Peer Mentor').length;
        const onCoop = users.filter(u => u.coopStatus === 'Yes').length;
        const incomplete = users.filter(u => {
            if (u.role !== 'user') return false; // Only count users with role 'user'
            if (u.coopStatus === 'Yes') return false; // Skip users on coop
            return !(u.firstName && u.lastName && u.email && u.userRole && u.major && u.coopStatus &&
                Array.isArray(u.availability) && u.availability.reduce((count, day) => count + day.slots.length, 0) >= 9);
        }).length;

        // Count majors
        const majorsMap = {};
        for (const u of users) {
            if (u.major) {
                majorsMap[u.major] = (majorsMap[u.major] || 0) + 1;
            }
        }

        res.json({
            totalMentors,
            teamLeads,
            onCoop,
            incompleteProfiles: incomplete,
            majorsDistribution: majorsMap
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// Export the router to be used in server.js
module.exports = router;