const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be hashed
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    availability: [
        {
            day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], required: true },
            slots: [{ type: String, required: true }] // Each slot will be a string like '10:00-10:30'
        }
    ],
});

const User = mongoose.model('User', userSchema);
module.exports = User;
