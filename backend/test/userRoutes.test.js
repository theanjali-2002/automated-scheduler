/**
 * Automated Tests for User Routes
 * --------------------------------
 * This test suite validates the functionality of user-related APIs, including:
 * - User Sign-Up API
 * - User Login API
 * - Admin Data API (with role-based access control)
 * 
 * Test Instructions:
 * 1. Ensure the MongoDB server is running locally or accessible via the configured URI.
 * 2. Run the tests using the following command from the root directory:
 *    npm test -- --detectOpenHandles backend/test/userRoutes.test.js
 * 3. The database is automatically cleared before and after the tests.
 * 4. Ensure the following environment variables are correctly set in a `.env` file:
 *    - MONGO_URI: The MongoDB connection URI.
 *    - JWT_SECRET: The secret key for generating JSON Web Tokens.
 *    - ADMIN_SECRET: The secret key for admin role validation.
 * 
 * Notes:
 * - The Express server is started and closed automatically during the test run.
 * - All asynchronous operations are resolved to avoid lingering processes.
 */


const request = require('supertest');
const { app, server } = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user'); 

// Cleanup users before all tests
beforeAll(async () => {
    await User.deleteMany({});
});

afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
});


//test for user registration
describe('User Sign-Up API', () => {
    it('should sign up a new admin user', async () => {
        const res = await request(app)
            .post('/api/users/signup')
            .send({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'securepassword',
                role: 'admin',
                adminSecret: 'supersecurekey'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.user.role).toBe('admin');
    });

    it('should sign up a new regular user', async () => {
        const res = await request(app)
            .post('/api/users/signup')
            .send({
                firstName: 'Regular',
                lastName: 'User',
                email: 'user@example.com',
                password: 'password123',
                role: 'user'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.user.role).toBe('user');
    });
});


//test for user login
describe('User Login API', () => {
    it('should log in an admin user', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'admin@example.com',
                password: 'securepassword'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.user.role).toBe('admin');
        expect(res.body).toHaveProperty('token');
    });

    it('should log in a regular user', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'user@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.user.role).toBe('user');
        expect(res.body).toHaveProperty('token');
    });

    it('should not log in with incorrect credentials', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'user@example.com',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });
});

//test admin-only data access
describe('Admin Data API', () => {
    let adminToken;

    beforeAll(async () => {
        // Log in as admin to get the token
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'admin@example.com',
                password: 'securepassword'
            });
        adminToken = res.body.token;
    });

    it('should allow admin to fetch all user data', async () => {
        const res = await request(app)
            .get('/api/users/admin/data')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ email: 'admin@example.com', role: 'admin' }),
                expect.objectContaining({ email: 'user@example.com', role: 'user' })
            ])
        );
        console.log(res.body);
    });

    it('should deny access for non-admin users', async () => {
        // Log in as a regular user to get a valid non-admin token
        const loginRes = await request(app)
            .post('/api/users/login')
            .send({
                email: 'user@example.com',
                password: 'password123',
            });
    
        const res = await request(app)
            .get('/api/users/admin/data')
            .set('Authorization', `Bearer ${loginRes.body.token}`); // Use a valid user token
    
        console.log(res.body); // Debug response
        expect(res.statusCode).toBe(403); // Expect Forbidden
        expect(res.body.error).toBe('Access denied. Admins only.');
    });
    
});
