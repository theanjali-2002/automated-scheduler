const express = require('express');
const router = express.Router(); // Initialize the router
const bcrypt = require('bcrypt'); // Include this if used
const User = require('../models/User'); // Adjust the path based on your structure
const { adminOnly } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password, role, adminSecret } = req.body;

    // Only allow admin creation if the correct secret is provided
    if (role === 'admin' && (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET)) {
        return res.status(403).json({ error: 'Unauthorized to create admin' });
    }    

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user
        const newUser = new User({ firstName, lastName, email, password: hashedPassword, role: role || 'user' });
        await newUser.save();

        res.status(201).json({
            message: 'User signed up successfully!',
            user: { firstName, lastName, email, role: newUser.role },
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
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

// Export the router to be used in server.js
module.exports = router;