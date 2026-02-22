# SolarEase - Spring Boot Backend Integration Guide

## Overview
This document outlines the API endpoints that the frontend expects from the Java Spring Boot backend.

## Authentication Endpoints

### 1. Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "rememberMe": "boolean"
}
```

**Success Response (200 OK):**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "username": "string"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

---

### 2. Registration
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Success Response (201 Created):**
```json
{
  "message": "Registration successful. Please check your email for verification code.",
  "userId": "string",
  "email": "string"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Email already exists" // or "Username already taken"
}
```

---

### 3. OTP Verification
**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "string",
  "otp": "string" // 6-digit code
}
```

**Success Response (200 OK):**
```json
{
  "message": "Account verified successfully",
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "username": "string",
    "verified": true
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid or expired OTP"
}
```

---

### 4. Resend OTP
**Endpoint:** `POST /api/auth/resend-otp`

**Request Body:**
```json
{
  "email": "string"
}
```

**Success Response (200 OK):**
```json
{
  "message": "New verification code sent to your email"
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "error": "Please wait before requesting a new code"
}
```

---

## Frontend Implementation Files

- **Login Page:** `/src/app/pages/LoginPage.tsx`
- **Registration Page:** `/src/app/pages/RegisterPage.tsx`
- **OTP Verification Page:** `/src/app/pages/OTPVerificationPage.tsx`

## Integration Instructions

1. Replace the mock `setTimeout` functions with actual API calls using `fetch` or `axios`
2. Store the JWT token in localStorage or sessionStorage after successful login/verification
3. Add error handling for network failures and API errors
4. Implement proper loading states during API calls

## Example API Call (Login)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch('https://your-api-url.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        rememberMe
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // Store token
    localStorage.setItem('token', data.token);
    
    // Navigate to dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    // Show error message to user
  } finally {
    setIsLoading(false);
  }
};
```

## Security Notes

- All passwords should be hashed using BCrypt on the backend
- OTP codes should expire after 10 minutes
- Implement rate limiting on all authentication endpoints
- Use HTTPS for all API communications
- Store JWT tokens securely and implement token refresh mechanism
