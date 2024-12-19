# API Testing Guide: User Details Submission

This guide provides step-by-step instructions for testing the `/details` endpoint using Postman.

---

## **Endpoint Overview**

- **Endpoint**: `POST /api/users/details`
- **Purpose**: Allows authenticated users to submit their additional details required for scheduling.
- **Authorization**: Requires a valid JWT token in the `Authorization` header.
- **Content-Type**: `application/json`

---

## **Prerequisites**

1. A user account has been created via the `/signup` endpoint.
2. The user has logged in via the `/login` endpoint to obtain a valid token.

---

## **Test Cases**

### **1. Submit Valid Details**

- **Description**: Submit all required details in the correct format.
- **Request**:
  - **Method**: POST
  - **URL**: `http://localhost:<port>/api/users/details`
  - **Headers**:
    - `Authorization`: `Bearer <valid_token>`
    - `Content-Type`: `application/json`
  - **Body**:
    ```json
    {
        "userRole": "Peer Mentor",
        "major": "Computer Science",
        "availability": [
            {
                "day": "Monday",
                "slots": ["10:00-10:30", "10:30-11:00"]
            },
            {
                "day": "Wednesday",
                "slots": ["14:00-14:30", "14:30-15:00"]
            }
        ],
        "notes": "Unavailable on Fridays"
    }
    ```
- **Expected Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
        "message": "Details submitted successfully.",
        "user": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "johndoe@example.com",
            "role": "user",
            "userRole": "Peer Mentor",
            "major": "Computer Science",
            "availability": [
                {
                    "day": "Monday",
                    "slots": ["10:00-10:30", "10:30-11:00"]
                },
                {
                    "day": "Wednesday",
                    "slots": ["14:00-14:30", "14:30-15:00"]
                }
            ],
            "notes": "Unavailable on Fridays"
        }
    }
    ```

---

### **2. Submit Without Availability**

- **Description**: Omit the `availability` field in the request body.
- **Request Body**:
    ```json
    {
        "userRole": "Peer Mentor",
        "major": "Computer Science"
    }
    ```
- **Expected Response**:
  - **Status**: `400 Bad Request`
  - **Body**:
    ```json
    {
        "error": "Major, user role (for users), and availability are required."
    }
    ```

---

### **3. Submit With Invalid Day**

- **Description**: Use an invalid day in the `availability` array.
- **Request Body**:
    ```json
    {
        "userRole": "Peer Mentor",
        "major": "Computer Science",
        "availability": [
            {
                "day": "Sunday",
                "slots": ["10:00-10:30"]
            }
        ]
    }
    ```
- **Expected Response**:
  - **Status**: `400 Bad Request`
  - **Body**:
    ```json
    {
        "error": "Each day must include a valid day and at least one time slot."
    }
    ```

---

### **4. Submit With Missing Token**

- **Description**: Submit the request without an authorization token.
- **Request Headers**:
    ```json
    {
        "Content-Type": "application/json"
    }
    ```
- **Expected Response**:
  - **Status**: `401 Unauthorized`
  - **Body**:
    ```json
    {
        "error": "Unauthorized. Token is required."
    }
    ```

---

## **Additional Notes**

- Ensure the server is running and accessible on `http://localhost:<port>`.
- Replace `<valid_token>` in the `Authorization` header with the JWT token obtained from the `/login` endpoint.
- Validate all fields match the required structure before submitting the request.

---
