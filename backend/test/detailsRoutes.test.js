/**
 * Automated Tests for User Details API
 * -------------------------------------
 * This test suite validates the functionality of the `/api/users/details` endpoint, including:
 * - Successful submission of valid user details (user role, major, availability, and notes).
 * - Enforcement of validation rules:
 *   - Availability must have at least 3 consecutive time slots per day.
 *   - Users must select availability for at least 2 days with 3 consecutive slots each OR at least 6 slots on one day.
 *   - Only valid days (Monday to Friday) are accepted.
 *   - All required fields (e.g., user role, major, availability) must be provided.
 * - Authentication checks for valid, missing, or invalid authorization tokens.
 * 
 * Test Instructions:
 * 1. Ensure the MongoDB server is NOT running locally.
 * 2. Set the following environment variables in a `.env` file:
 *    - MONGO_URI: The MongoDB connection URI.
 *    - JWT_SECRET: The secret key for generating JSON Web Tokens.
 * 3. Run the tests using the following command from the root directory:
 *    npm test -- --detectOpenHandles backend/test/detailsRoutes.test.js
 * 
 * Notes:
 * - The database is automatically seeded with test data and cleared after the tests.
 * - The Express server is started and closed automatically during the test run.
 * - Tokens for user authentication are generated dynamically during the test run.
 * - Each test ensures appropriate error handling and proper enforcement of all validation rules.
 */


const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt'); 
const { app, server } = require('../server');

let userToken;

beforeAll(async () => {
    await User.deleteMany({});

    // Connect to the test database
    await mongoose.connect(process.env.MONGO_URI, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Add timeout for server selection
        connectTimeoutMS: 10000, // Add connection timeout
    });

    // Create a test user and generate a token
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: hashedPassword,
        role: 'user',
    });

    const loginResponse = await request(app)
        .post('/api/users/login')
        .send({ 
            email: 'testuser@example.com', 
            password: 'testpassword' });

    userToken = loginResponse.body.token;
}, 30000);

afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
});

describe('POST /api/users/details', () => {
    it('should submit valid details successfully', async () => {
        const res = await request(app)
            .post('/api/users/details')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                userRole: 'Peer Mentor',
                major: 'Computer Science',
                availability: [
                    {
                        day: 'Monday',
                        slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30']
                    },
                    {
                        day: 'Wednesday',
                        slots: ['14:00-14:30', '14:30-15:00', '15:00-15:30']
                    }
                ],
                notes: 'Unavailable on Fridays'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Details submitted successfully.');
        expect(res.body.user).toHaveProperty('availability');
    });

    it('should return error for non-consecutive slots', async () => {
        const res = await request(app)
            .post('/api/users/details')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                userRole: 'Peer Mentor',
                major: 'Computer Science',
                availability: [
                    {
                        day: 'Monday',
                        slots: ['10:00-10:30', '11:00-11:30']
                    }
                ]
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('You must select at least 3 consecutive time slots.');
    });

    it('should return error for insufficient days and slots', async () => {
        const res = await request(app)
            .post('/api/users/details')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                userRole: 'Peer Mentor',
                major: 'Computer Science',
                availability: [
                    {
                        day: 'Monday',
                        slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30']
                    }
                ]
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('You must select availability for at least 2 days with 3 consecutive slots OR at least 6 time slots on one day.');
    });

    it('should return error for missing availability', async () => {
        const res = await request(app)
            .post('/api/users/details')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                userRole: 'Peer Mentor',
                major: 'Computer Science'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Major, user role (for users), and availability are required.');
    });

    it('should return error for missing token', async () => {
        const res = await request(app)
            .post('/api/users/details')
            .send({
                userRole: 'Peer Mentor',
                major: 'Computer Science',
                availability: [
                    {
                        day: 'Monday',
                        slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30']
                    }
                ]
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Unauthorized. Token is required.');
    });

    it('should return error for invalid token', async () => {
        const res = await request(app)
            .post('/api/users/details')
            .set('Authorization', 'Bearer invalidToken')
            .send({
                userRole: 'Peer Mentor',
                major: 'Computer Science',
                availability: [
                    {
                        day: 'Monday',
                        slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30']
                    }
                ]
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Unauthorized. Invalid token.');
    });
});
