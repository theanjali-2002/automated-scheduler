const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, set: v => v.trim().toLowerCase() },
    password: { type: String, required: true }, // Will be hashed
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    availability: [
        {
            day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], required: true },
            slots: [{ type: String, required: true }] // Each slot will be a string like '10:00-10:30'
        }
    ],
    userRole: {
        type: String,
        enum: ['Peer Mentor', 'Team Lead & Peer Mentor'], // Dropdown options
        required: function() {
            return this.role === 'user' && this.userRole != null; // Required only if the general role is 'user'
        },
        default: null // Default to null during sign-up
    },
    major: { 
        type: String,
        default: null
    },
    coopStatus: {
        type: String,
        enum: ['Yes', 'No', 'Maybe'],
        default: null
    },
    notes: { type: String, maxlength: 500, default: '' }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
