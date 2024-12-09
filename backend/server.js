require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes'); // Adjust the path based on your structure

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Use the user routes
app.use('/api/users', userRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI; // Fetch from .env

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
