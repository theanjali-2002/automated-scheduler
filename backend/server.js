require('dotenv').config(); // Load environment variables

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const userRoutes = require('./routes/userRoutes'); 

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Use the user routes
app.use('/api/users', require('./routes/userRoutes'));

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Catch-all route to handle client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI; // Fetch from .env

mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Start Server
let server;
const PORT = process.env.PORT || 5000;
server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Frontend available at http://localhost:${PORT}/index.html`);
});

module.exports = { app, server };