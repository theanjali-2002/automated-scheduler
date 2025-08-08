# API Reference (Minimal)

This is a **minimal overview of all available API endpoints** for the Automated Scheduler project.

### Notes
- All endpoints are prefixed with `/api`.
- Authentication uses **JWT tokens** in the `Authorization` header: 
Authorization: Bearer `<token>`

### **Auth Levels:**
- **No Auth:** Open to anyone.
- **User:** Requires a valid JWT for logged-in mentors.
- **Admin:** Requires a valid JWT with `role = admin`.
- Admin endpoints provide access to **user management, scheduling, exports, and audit logs**.




| Endpoint                                | Method | Auth Required | Description                           |
|-----------------------------------------|--------|---------------|---------------------------------------|
| `/api/users/signup`                      | POST   | No            | Register a new mentor or admin         |
| `/api/users/login`                       | POST   | No            | Authenticate and get JWT               |
| `/api/users/availability`                | POST   | User          | Submit/update mentor availability      |
| `/api/users/details`                     | POST   | User          | Submit/update user details             |
| `/api/users/profile`                     | GET    | User          | Get current user profile               |
| `/api/users/profile`                     | POST   | User          | Update current user profile            |
| `/api/users/admin/data`                  | GET    | Admin         | Fetch all user data                    |
| `/api/users/admin/profile/:id`           | GET    | Admin         | Fetch specific user profile            |
| `/api/users/admin/details/:id`           | POST   | Admin         | Update any user details                |
| `/api/users/admin/availability/:id`      | POST   | Admin         | Update user availability               |
| `/api/users/admin/metrics`               | GET    | Admin         | Fetch dashboard metrics                |
| `/api/schedule/generate`                 | POST   | Admin         | Generate schedule Excel file           |
| `/api/schedule/mentors-export`           | GET    | Admin         | Export mentor list Excel file          |
| `/api/schedule/availability-export`      | GET    | Admin         | Export availability Excel file         |
| `/api/audit-logs`                        | GET    | Admin         | Get paginated audit logs               |
