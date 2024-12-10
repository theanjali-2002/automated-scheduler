# API Manual Testing: Availability Submission

This document outlines test cases to validate the functionality of the `/api/users/availability` endpoint.

## **Test Cases**

### **1. Valid Availability Submission**
- **Test**: Submit a valid availability with at least 3 consecutive slots on 2 different days.
- **Request**:
  - **Endpoint**: `POST /api/users/availability`
  - **Headers**:
    - `Authorization`: `Bearer <valid_token>`
  - **Body**:
    ```json
    {
        "availability": [
            { "day": "Monday", "slots": ["10:00-10:30", "10:30-11:00", "11:00-11:30"] },
            { "day": "Wednesday", "slots": ["14:00-14:30", "14:30-15:00", "15:00-15:30"] }
        ]
    }
    ```
- **Expected Response**:
  - **Status**: `200 OK`
  - **Response Body**:
    ```json
    {
        "message": "Availability updated successfully",
        "availability": [
            { "day": "Monday", "slots": ["10:00-10:30", "10:30-11:00", "11:00-11:30"] },
            { "day": "Wednesday", "slots": ["14:00-14:30", "14:30-15:00", "15:00-15:30"] }
        ]
    }
    ```

---

### **2. Invalid Availability Submission (Fails Validation)**
- **Test**: Submit an availability that doesn’t meet the 3 consecutive slots, 2 days requirement.
- **Request**:
  - **Endpoint**: `POST /api/users/availability`
  - **Headers**:
    - `Authorization`: `Bearer <valid_token>`
  - **Body**:
    ```json
    {
        "availability": [
            { "day": "Monday", "slots": ["10:00-10:30", "10:30-11:00"] },
            { "day": "Wednesday", "slots": ["14:00-14:30"] }
        ]
    }
    ```
- **Expected Response**:
  - **Status**: `400 Bad Request`
  - **Response Body**:
    ```json
    {
        "error": "You must select at least 3 consecutive slots twice a week."
    }
    ```

---

### **3. Invalid Day Name**
- **Test**: Submit an invalid day in the request.
- **Request**:
  - **Body**:
    ```json
    {
        "availability": [
            { "day": "Sunday", "slots": ["10:00-10:30", "10:30-11:00", "11:00-11:30"] }
        ]
    }
    ```
- **Expected Response**:
  - **Status**: `400 Bad Request`
  - **Response Body**:
    ```json
    {
        "error": "Invalid availability format."
    }
    ```

---

### **4. Invalid Slot Format**
- **Test**: Submit availability with invalid slot formatting.
- **Request**:
  - **Body**:
    ```json
    {
        "availability": [
            { "day": "Monday", "slots": ["10:00-10:30", "10:30", "11:00-11:30"] }
        ]
    }
    ```
- **Expected Response**:
  - **Status**: `400 Bad Request`
  - **Response Body**:
    ```json
    {
        "error": "Invalid availability format."
    }
    ```

---

### **5. Missing Authorization Token**
- **Test**: Submit availability without a valid token.
- **Request**:
  - **Headers**:
    - No `Authorization` header.
  - **Body**:
    ```json
    {
        "availability": [
            { "day": "Monday", "slots": ["10:00-10:30", "10:30-11:00", "11:00-11:30"] }
        ]
    }
    ```
- **Expected Response**:
  - **Status**: `401 Unauthorized`
  - **Response Body**:
    ```json
    {
        "error": "Unauthorized. Token is required."
    }
    ```

---

### **6. Empty Availability Data**
- **Test**: Submit an empty `availability` array.
- **Request**:
  - **Body**:
    ```json
    {
        "availability": []
    }
    ```
- **Expected Response**:
  - **Status**: `400 Bad Request`
  - **Response Body**:
    ```json
    {
        "error": "Availability data is required and must be an array."
    }
    ```
