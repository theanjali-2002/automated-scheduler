/**
 * Add Mentors and Admins Script
 * -----------------------------
 * This script adds 50 mentors and 2 admin users to the MongoDB database with predefined details for admins
 * and randomized user roles, majors, and availability for mentors.
 * It clears existing user data in the `users` collection before adding the new records.
 *
 * Functionality:
 * - Connects to MongoDB using MONGO_URI from the `.env` file.
 * - Deletes all records in the `users` collection to avoid duplicates.
 * - Creates:
 *   - 50 mentors with:
 *     - Randomly assigned `userRole` (Peer Mentor or Team Lead, with 10 team leads).
 *     - Randomly assigned `major` from a predefined list.
 *     - Availability:
 *       - 1 or 2 days (99% of the time, it will be 2 days).
 *       - 3 consecutive slots per day (99% of the time).
 *     - Optional notes for ~30% of mentors.
 *   - 2 admin users with predefined details.
 * - Hashes passwords for mentors and admins to ensure security.
 * - Inserts all records into the database.
 * - Closes the database connection after the operation.
 *
 * How to Run:
 * 1. Save this file in your project directory (e.g., `backend/addMentorsAndAdmins.js`).
 * 2. Make sure you have a `.env` file with a valid `MONGO_URI`.
 * 3. Run the script using the command:
 *    node seedMentorsAndAdmins.js
 * 4. Verify that mentors and admins have been added by checking the `users` collection in MongoDB.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');

const majorOptions = [
    'Computer Science',
    'Biology',
    'Chemistry',
    'Physics',
    'Mathematics and Statistics',
    'Environmental and Earth Science',
    'Health Science',
    'Neuroscience and Mental Health',
    'Psychology',
    'Other'
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
    '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
    '12:00-12:30', '12:30-13:00', '13:00-13:30', '13:30-14:00',
    '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00'
];

async function seedMentorsAndAdmins() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        console.log('Clearing existing users...');
        await User.deleteMany({});
        console.log('Existing users cleared');

        const mentors = [];

        for (let i = 0; i < 50; i++) {
            const userRole = i < 10 ? 'Team Lead & Peer Mentor' : 'Peer Mentor'; // Ensure only 10 team leads

            const major = majorOptions[Math.floor(Math.random() * majorOptions.length)];

            const availability = [];
            const daysCount = Math.random() < 0.99 ? 2 : 1; // 99% chance for 2 days

            const selectedDays = [...daysOfWeek].sort(() => 0.5 - Math.random()).slice(0, daysCount);

            selectedDays.forEach(day => {
                const slotsCount = Math.random() < 0.99 ? 3 : 6; // 99% chance for 3 slots
                const startSlotIndex = Math.floor(Math.random() * (timeSlots.length - slotsCount + 1));
                const selectedSlots = timeSlots.slice(startSlotIndex, startSlotIndex + slotsCount);

                availability.push({ day, slots: selectedSlots });
            });

            const notes = Math.random() < 0.3 ? 'Some optional note for this mentor.' : ''; // 30% chance for notes

            const hashedPassword = await bcrypt.hash('securepassword', 10);

            mentors.push({
                firstName: `Mentor${i + 1}`,
                lastName: `User${i + 1}`,
                email: `mentor${i + 1}@example.com`,
                password: hashedPassword,
                role: 'user',
                userRole,
                major,
                availability,
                notes
            });
        }

        console.log('Inserting mentors into the database...');
        await User.insertMany(mentors);
        console.log('Mentors inserted successfully');

        const admins = [
            {
                firstName: 'Admin1',
                lastName: 'User',
                email: 'admin1@example.com',
                password: await bcrypt.hash('securepassword1', 10),
                role: 'admin'
            },
            {
                firstName: 'Admin2',
                lastName: 'User',
                email: 'admin2@example.com',
                password: await bcrypt.hash('securepassword2', 10),
                role: 'admin'
            }
        ];

        console.log('Inserting admins into the database...');
        await User.insertMany(admins);
        console.log('Admins inserted successfully');

        console.log('Closing database connection...');
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding mentors and admins:', error);
        process.exit(1);
    }
}

seedMentorsAndAdmins();
