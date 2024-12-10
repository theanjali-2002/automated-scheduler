require('dotenv').config(); // Load environment variables

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const userRoutes = require('./routes/userRoutes'); 

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
let server;
const PORT = process.env.PORT || 5000;
server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = { app, server };