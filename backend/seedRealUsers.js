/**
 * Seed Users from Excel Script
 * ----------------------------
 * This script reads user data from an Excel file (./seedrealdata.xlsx) and seeds it into MongoDB.
 * It expects the Excel file to contain columns like: firstName, lastName, email, password, role,
 * userRole, major, coopStatus, notes, and availabilityJSON.
 *
 * The `availabilityJSON` field should be a pipe-separated string of day-slot pairs like:
 * "Monday: 10:00-10:30, 10:30-11:00 | Wednesday: 12:00-12:30, 12:30-13:00"
 * This is automatically converted into a JSON array format:
 * [{ day: "Monday", slots: [...] }, { day: "Wednesday", slots: [...] }]
 *
 * Prerequisites:
 * - A working `.env` file with `MONGO_URI` defined.
 * - MongoDB instance running and reachable.
 * - Valid Excel file at the path `./seedrealdata.xlsx`.
 *
 * Usage:
 * Run this script with Node to clear the existing user collection and seed it fresh:
 *    node seedRealUsers.js
 *
 * WARNING: This will delete all existing users in the database.
 */


require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const User = require('./models/User'); 

async function seedFromExcel() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    const workbook = xlsx.readFile('./seedrealdata.xlsx'); // Adjust path as needed
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const users = await Promise.all(rows.map(async (row, index) => {
      const hashedPassword = await bcrypt.hash(row.password || 'defaultPassword', 10);


      const availability = row.availabilityJSON
        ? row.availabilityJSON
          .split('|')
          .map(block => block.trim())
          .filter(Boolean)
          .map(dayBlock => {
            const colonIndex = dayBlock.indexOf(':');
            if (colonIndex === -1) return null;
            const day = dayBlock.slice(0, colonIndex).trim();
            const slots = dayBlock.slice(colonIndex + 1).split(',').map(s => s.trim());
            return { day, slots };
          })
          .filter(Boolean)
        : [];

      return {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        password: hashedPassword,
        role: row.role || 'user',
        userRole: row.userRole || '',
        major: row.major || '',
        coopStatus: row.coopStatus || '',
        notes: row.notes || '',
        availability


      };
    }));

    await User.deleteMany({});
    await User.insertMany(users);

    console.log('Users seeded successfully');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedFromExcel();
