
# API Testing Guide

This document outlines how to manually test the API endpoints using Postman.

---

## **Endpoints**

### **1. User Sign-Up**
- **URL:** `POST /api/users/signup`
- **Headers:**
  - `Content-Type: application/json`
- **Request Body Examples:**
  - **Admin:**
    ```json
    {
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com",
        "password": "securepassword",
        "role": "admin",
        "adminSecret": "supersecurekey"
    }
    ```
  - **Regular User:**
    ```json
    {
        "firstName": "Regular",
        "lastName": "User",
        "email": "user@example.com",
        "password": "password123",
        "role": "user"
    }
    ```
- **Expected Response:**
  ```json
  {
      "message": "User signed up successfully!",
      "user": {
          "firstName": "Admin",
          "lastName": "User",
          "email": "admin@example.com",
          "role": "admin"
      }
  }
  ```

---

### **2. User Login**
- **URL:** `POST /api/users/login`
- **Headers:**
  - `Content-Type: application/json`

#### **Steps for Testing Login API**
1. Open Postman.
2. Create a new `POST` request.
3. Set the request URL to:
   ```
   http://localhost:5000/api/users/login
   ```
4. Add the following header:
   - Key: `Content-Type`
   - Value: `application/json`
5. In the **Body** tab, select `raw` and enter the following JSON:

   - **For Admin:**
     ```json
     {
         "email": "admin@example.com",
         "password": "securepassword"
     }
     ```
   - **For Regular User:**
     ```json
     {
         "email": "user@example.com",
         "password": "password123"
     }
     ```

6. Click **Send**.

#### **Expected Response (Successful Login):**
- For Admin:
  ```json
  {
      "message": "Login successful",
      "token": "<JWT_TOKEN>",
      "user": {
          "firstName": "Admin",
          "lastName": "User",
          "email": "admin@example.com",
          "role": "admin"
      }
  }
  ```
- For Regular User:
  ```json
  {
      "message": "Login successful",
      "token": "<JWT_TOKEN>",
      "user": {
          "firstName": "Regular",
          "lastName": "User",
          "email": "user@example.com",
          "role": "user"
      }
  }
  ```

---

### **3. Test Login with Incorrect Credentials**
1. Use the same steps as above but provide invalid email or password.
2. Example Request Body:
   ```json
   {
       "email": "invalid@example.com",
       "password": "wrongpassword"
   }
   ```

#### **Expected Response:**
- If the email does not exist:
  ```json
  {
      "error": "User not found"
  }
  ```
- If the email exists but the password is incorrect:
  ```json
  {
      "error": "Invalid credentials"
  }
  ```

---

### **4. Admin-Only Data**
- **URL:** `GET /api/users/admin/data`
- **Headers:**
  - Key: `Authorization`
  - Value: `Bearer <JWT_TOKEN>`

#### **Steps for Testing Admin Route**
1. Create a new `GET` request.
2. Set the request URL to:
   ```
   http://localhost:5000/api/users/admin/data
   ```
3. Add the `Authorization` header with a valid admin token.
4. Click **Send**.

#### **Expected Response:**
- **For Valid Admin Token:**
  ```json
  [
      {
          "firstName": "Admin",
          "lastName": "User",
          "email": "admin@example.com",
          "role": "admin"
      },
      {
          "firstName": "Regular",
          "lastName": "User",
          "email": "user@example.com",
          "role": "user"
      }
  ]
  ```
- **For Missing Token:**
  ```json
  {
      "error": "Unauthorized. Token is required."
  }
  ```
- **For Non-Admin Token:**
  ```json
  {
      "error": "Access denied. Admins only."
  }
  ```

---

### **5. MongoDB Verification**
1. Open MongoDB Compass or Atlas.
2. Check the `users` collection for the following fields:
   - `firstName`, `lastName`, `email`, `password` (hashed), `role`.

#### **Example Document:**
```json
{
    "_id": "64f93c29e85b5a45f803f0b9",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "password": "$2b$10$...",
    "role": "admin"
}
```

---

### **Notes**
- The `token` field in the login response is a JWT. It is required for accessing protected routes like the admin data API.
- Ensure your server is running on `http://localhost:5000` before testing.

---

## **Troubleshooting**
1. If `Cannot POST /api/users/login`:
   - Ensure the route `/api/users/login` is correctly set up.
   - Verify the server is running.
2. If `Unauthorized` or `Forbidden` errors occur:
   - Double-check the `Authorization` header and token validity.
