/**
 * Remove All Users Script
 * ------------------------
 * This script deletes all user data from the MongoDB database's `users` collection.
 * Use this script with caution as it will remove all user records.
 *
 * Functionality:
 * - Connects to MongoDB using MONGO_URI from the `.env` file.
 * - Deletes all records in the `users` collection.
 * - Closes the database connection after the operation.
 *
 * How to Run:
 * 1. Save this file in your project directory (e.g., `backend/removeUsers.js`).
 * 2. Make sure you have a `.env` file with a valid `MONGO_URI`.
 * 3. Run the script using the command:
 *    node removeUsers.js
 * 4. Verify that all users have been removed by checking the `users` collection in MongoDB.
 */


require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path based on your project structure

async function deleteAllUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Delete all users
        const result = await User.deleteMany({});
        console.log(`${result.deletedCount} users removed from the database.`);

        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed.');
    } catch (error) {
        console.error('Error deleting users:', error);
    }
}

deleteAllUsers();
