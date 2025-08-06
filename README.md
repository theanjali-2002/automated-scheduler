# Automated Scheduler

A web-based system to **automate mentor shift scheduling** for the Science Student Success Centre (SSSC).

- Mentors submit availability (≥ 3 consecutive slots, thrice a week)
- Admins manage schedules with **role-based access** and exports
- Includes automated schedule generation, exporting user availabilities & details, audit logs, and testing

---

## Tech Stack
**Frontend:** HTML, Tailwind CSS, JavaScript  
**Backend:** Node.js, Express, MongoDB (Mongoose)  
**Auth & Security:** JWT, Bcrypt  
**Testing:** Jest, Supertest, Playwright

---

## Key Features
- **Mentor Dashboard:** Add required details, submit & update availability  
- **Admin Dashboard:** View/Edit mentors, export data, generate schedules  
- **Automated Scheduling:** Fair shift distribution  
- **Audit Logs:** Tracks profile updates & exports  
- **Testing:** Unit, integration, and end-to-end coverage

---
## Live Demo
- **Main (Production):** https://sssc-automated-scheduler.onrender.com  
- **Staging:** https://automated-scheduler-staging.onrender.com

> Access is restricted to SSSC internal users.  
> Public signup/login is disabled for security.

### Watch the Demo: [Full video](./docs/automated_schedular_demo.mp4)
### Hosting
This project is fully hosted on **Render**:
- Backend & Frontend: Both served via Render for simplicity.  
- Staging Environment: Exists so admins can test new features safely before going live.  
- Environments: Separate staging and production deployments.  
- **Note:** No automated CI/CD since this is a small, single-developer project; deployments are triggered manually.

---

## Quick Setup
```bash
# Clone repo
git clone <repo_url>
cd automated-scheduler

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Create `.env` in `backend/`
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
ADMIN_SECRET=your_admin_secret
SIGNUP_CODE=your_signup_code

# Run
cd backend
npm start
```

## Testing
```bash
# Install Playwright dependencies
cd frontend
npx playwright install

# Run frontend tests
npm test                                      # Run all tests in headless mode (default)
npm run test:headed                           # Run tests with browser UI visible
npm run test:debug                            # Run tests in debug mode
npx playwright test tests/userBoard.test.js   # Run specific test file
npx playwright test --project=chromium        # Run tests in specific browser

# Run backend tests
cd backend
npm test
```

## Project Structure
```
automated-scheduler/
├── backend/       # middleware, models, routes, tests, .env, scripts, utils
├── frontend/      # User & admin dashboard pages, scripts
├── docs/          # API & testing guides
└── README.md
```

## Author
Designed & Developed with ❤️ by [Anjali Patel](https://www.linkedin.com/in/anjali-patel).  
Contact: theanjali27@gmail.com

> Feel free to reach out for technical support, questions, or collaboration.

---

## License

This project is licensed under the [MIT License](LICENSE.md).  
All rights reserved (c) 2025 Anjali Patel.
