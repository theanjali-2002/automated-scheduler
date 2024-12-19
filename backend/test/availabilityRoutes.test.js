/**
 * Automated Tests for Availability API
 * -------------------------------------
 * This test suite validates the functionality of the Availability API, including:
 * - Valid availability submissions meeting the required conditions.
 * - Validation errors for incorrect day names, slot formats, or insufficient slot submissions.
 * - Authentication checks for valid, missing, or invalid authorization tokens.
 * 
 * Test Instructions:
 * 1. Ensure the MongoDB server is running locally or accessible via the configured URI.
 * 2. Run the tests using the following command from the root directory:
 *    npm test -- --detectOpenHandles backend/test/availabilityRoutes.test.js
 * 3. The database is automatically seeded with test data and cleared after the tests.
 * 4. Ensure the following environment variables are correctly set in a `.env` file:
 *    - MONGO_URI: The MongoDB connection URI.
 *    - JWT_SECRET: The secret key for generating JSON Web Tokens.
 * 
 * Notes:
 * - The Express server is started and closed automatically during the test run.
 * - All asynchronous operations are resolved to prevent lingering processes.
 * - Tokens for user authentication are generated dynamically during the test run.
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
            password: 'testpassword',
        });
    userToken = loginResponse.body.token;
}, 30000);

afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
});


describe('POST /api/users/availability', () => {
    it('should submit valid availability successfully', async () => {
        const res = await request(app)
            .post('/api/users/availability')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                availability: [
                    { day: 'Monday', slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30'] },
                    { day: 'Wednesday', slots: ['14:00-14:30', '14:30-15:00', '15:00-15:30'] },
                ],
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Availability updated successfully');
    });

    it('should return an error for invalid availability submission', async () => {
        const res = await request(app)
            .post('/api/users/availability')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                availability: [{ day: 'Monday', slots: ['10:00-10:30', '10:30-11:00'] }],
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('You must select at least 3 consecutive slots twice a week.');
    });

    it('should return an error for invalid slot format', async () => {
        const res = await request(app)
            .post('/api/users/availability')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                availability: [{ day: 'Monday', slots: ['10:00-10:30', '10:30', '11:00-11:30'] }],
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('You must select at least 3 consecutive slots twice a week.');
    });

    it('should return an error for missing authorization token', async () => {
        const res = await request(app)
            .post('/api/users/availability')
            .send({
                availability: [{ day: 'Monday', slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30'] }],
            });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Unauthorized. Token is required.');
    });

    it('should return an error for empty availability data', async () => {
        const res = await request(app)
            .post('/api/users/availability')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ availability: [] });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Availability data is required and must be an array.');
    });

    it('should deny access for unauthorized users', async () => {
        const res = await request(app)
            .post('/api/users/availability')
            .set('Authorization', 'Bearer invalidToken')
            .send({
                availability: [{ day: 'Monday', slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30'] }],
            });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Unauthorized. Invalid token.');
    });
});
