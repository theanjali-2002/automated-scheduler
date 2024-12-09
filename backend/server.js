const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json()); // Parses incoming JSON requests
app.use(cors()); // Allows frontend to communicate with the backend

// Basic Test Route
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});

const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
