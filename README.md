# Automated Scheduler

## Project Overview
The **Automated Scheduler** is designed to streamline the shift scheduling process for **SSSC (Science Student Success Centre) mentors**. This system allows mentors to submit their availability while ensuring compliance with predefined scheduling rules, such as requiring at least **three consecutive time slots twice a week**. The system provides both a **web interface** for easy access and a **role-based access control** system for administrators to manage mentor schedules.

## Problem Statement
Manual scheduling of mentor shifts is often inefficient, leading to:
- **Scheduling conflicts** due to lack of centralized availability tracking.
- **Time-consuming coordination** between mentors and administrators.
- **Inconsistent enforcement of scheduling rules**.

## Solution
The Automated Scheduler solves these issues by:
- **Providing a user-friendly web interface** for mentors to manage their availability.
- **Automating the shift scheduling process** based on mentor availability.
- **Enforcing scheduling rules** to ensure fair distribution of shifts.
- **Providing an authentication system** with admin-only access to sensitive data.
- **Implementing an intuitive API** that allows mentors to submit and update their availability easily.

## Tech Stack
This project is built using the following technologies:

### **Frontend**
- **HTML5 & CSS3** - User interface and styling
- **JavaScript** - Client-side functionality
- **Tailwind CSS** - Utility-first CSS framework

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
- User-friendly signup and login interface

### **Mentor Availability Management**
- Mentors can **submit & update their availability** through a web interface
- Validation ensures at least **three consecutive slots on two different days**
- Admins can **view mentor data** and manage schedules
- Interactive calendar interface for availability selection

### **Scheduling System**
- Automated scheduling algorithm for fair shift distribution
- Scripts for generating and managing schedules
- Tools for seeding and managing mentor/admin accounts

### **Automated Testing**
- Unit & integration tests using **Jest & Supertest**
- Tests cover **user authentication, availability submission, and admin access**

## Project Structure
```
automated-scheduler/
├── frontend/           # Frontend implementation
│   ├── index.html     # Main entry point
│   ├── signup.html    # User registration
│   ├── user_board.html # User dashboard
│   └── app.js         # Frontend logic
├── backend/           # Backend implementation
│   ├── controllers/   # Route controllers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── middleware/    # Custom middleware
│   ├── test/         # Test files
│   └── server.js     # Main server file
└── docs/             # Documentation
```

## API Endpoints
| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/users/signup` | POST | Register a new mentor or admin | No |
| `/api/users/login` | POST | Authenticate user and receive a JWT token | No |
| `/api/users/admin/data` | GET | Retrieve all user data | Yes (Admin only) |
| `/api/users/availability` | POST | Submit or update mentor availability | Yes |
| `/api/users/details` | POST | Submit or update user details (major, co-op status, etc.) | Yes |
| `/api/users/profile` | GET | Get current user's profile information | Yes |

All authenticated endpoints require a valid JWT token in the Authorization header.

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
✅ Frontend implementation
✅ Scheduler algorithm implementation (needs refinement)
⬜ Mentor notifications system
⬜ Enhanced admin dashboard

## Setup & Installation
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd automated-scheduler
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables in `.env` file:
   ```plaintext
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ADMIN_SECRET=your_admin_secret
   ```

5. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

6. Open the frontend in your browser:
   ```bash
   cd frontend
   open index.html
   ```

7. Run tests:
   ```bash
   cd backend
   npm test
   ```

## Author
**Anjali Patel**

---
This project is actively developed to improve the mentor shift scheduling experience and ensure fair and efficient time management.

