# Automated Scheduler

## Project Overview
The **Automated Scheduler** is designed to streamline the shift scheduling process for **SSSC (Science Student Success Centre) mentors**. This system allows mentors to submit their availability while ensuring compliance with predefined scheduling rules, such as requiring at least **three consecutive time slots twice a week**. The system also provides **role-based access control** for administrators to manage mentor schedules.

## Problem Statement
Manual scheduling of mentor shifts is often inefficient, leading to:
- **Scheduling conflicts** due to lack of centralized availability tracking.
- **Time-consuming coordination** between mentors and administrators.
- **Inconsistent enforcement of scheduling rules**.

## Solution
The Automated Scheduler solves these issues by:
- **Automating the shift scheduling process** based on mentor availability.
- **Enforcing scheduling rules** to ensure fair distribution of shifts.
- **Providing an authentication system** with admin-only access to sensitive data.
- **Implementing an intuitive API** that allows mentors to submit and update their availability easily.

## Tech Stack
This project is built using the following technologies:

### **Backend**
- **Node.js & Express.js** - REST API development
- **MongoDB & Mongoose** - Database & ODM
- **JSON Web Token (JWT)** - Authentication & authorization
- **Bcrypt.js** - Secure password hashing
- **dotenv** - Environment variable management
- **Jest & Supertest** - Automated testing

## Features Implemented
### **Authentication & Authorization**
- Secure user authentication with **JWT-based login system**
- Role-based authorization for **admin-only routes**

### **Mentor Availability Management**
- Mentors can **submit & update their availability**
- Validation ensures at least **three consecutive slots on two different days**
- Admins can **view mentor data**

### **Automated Testing**
- Unit & integration tests using **Jest & Supertest**
- Tests cover **user authentication, availability submission, and admin access**

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/signup` | POST | Register a new mentor or admin |
| `/api/users/login` | POST | Authenticate user and receive a JWT token |
| `/api/users/admin/data` | GET | Retrieve all user data (Admin-only) |
| `/api/users/availability` | POST | Submit or update mentor availability (Authenticated users) |

## Testing & Validation
Manual and automated tests are provided:
- **Manual Testing Guide** (`user_management_api_testing_guide.md` & `availability_api_testing.md`)
- **Automated Tests** using `Jest & Supertest`
  - Run tests with `npm test`

## Current Progress
✅ User authentication & authorization
✅ Mentor availability submission
✅ Admin access control
✅ Unit & integration tests
⬜ Scheduler algorithm implementation (in progress)

## Future Improvements
- Improve **automated scheduling algorithms** to assign shifts
- Implement **mentor notifications** for schedule updates
- Enhance **frontend dashboard** for easy schedule management

## Setup & Installation
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd automated-scheduler
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env` file:
   ```plaintext
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ADMIN_SECRET=your_admin_secret
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Run tests:
   ```bash
   npm test
   ```

## Author
**Anjali Patel**

---
This project is actively developed to improve the mentor shift scheduling experience and ensure fair and efficient time management.

