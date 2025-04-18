const express = require('express');
const router = express.Router(); // Initialize the router
const bcrypt = require('bcrypt'); 
const User = require('../models/user'); 
const { auth, adminOnly } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password, role, adminSecret } = req.body;

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
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            email,
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



router.get('/admin/data', adminOnly, async (req, res) => {
    try {
        const users = await User.find({}, 'firstName lastName email role');
        res.status(200).json(users); // Ensure response is sent only once
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ error: 'Failed to fetch admin data' });
    }
});




router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
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

        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const isValid = availability.every(item =>
            validDays.includes(item.day) && 
            Array.isArray(item.slots) &&
            item.slots.every(slot => typeof slot === 'string')
        );

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid availability format.' });
        }

        // Enforce rule: at least 3 consecutive slots twice a week
        const isValidSubmission = availability.filter(day => day.slots.length >= 3).length >= 2;

        if (!isValidSubmission) {
            return res.status(400).json({
                error: 'You must select at least 3 consecutive slots twice a week.'
            });
        }

        // Save or update user's availability
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { availability },
            { new: true }
        );

        res.status(200).json({ message: 'Availability updated successfully', availability: user.availability });
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

        // Update user details
        user.major = major;
        user.notes = notes || '';
        user.coopStatus = coopStatus;
        if (req.user.role === 'user') {
            user.userRole = userRole;
        }

        await user.save();

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

        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;

        await user.save();

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

// Export the router to be used in server.js
module.exports = router;