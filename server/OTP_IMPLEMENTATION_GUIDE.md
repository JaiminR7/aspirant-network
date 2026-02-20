# Email OTP Verification - Setup Guide

## Overview

This implementation adds secure email OTP verification to your MERN authentication flow.

## Features Implemented

✅ Secure 6-digit numeric OTP generation
✅ OTP hashing with bcrypt before storage
✅ 2-minute OTP expiry
✅ Maximum 5 OTP verification attempts
✅ Protection against already verified emails
✅ Clean email templates
✅ MVC architecture maintained
✅ Production-ready error handling

## Files Modified/Created

### 1. Models

- **`models/User.js`** - Added OTP fields:
  - `otpHash` - Hashed OTP (never store plain OTP)
  - `otpExpiry` - Expiration timestamp
  - `otpAttempts` - Failed verification counter
  - `isVerified` - Email verification status

### 2. Controllers

- **`controllers/authController.js`** - Added/Updated:
  - `sendOtp()` - Generate and send OTP via email
  - `verifyOtp()` - Verify OTP and mark email as verified
  - `signup()` - Updated to require email verification

### 3. Routes

- **`routes/auth.js`** - Added new endpoints:
  - `POST /api/auth/send-otp`
  - `POST /api/auth/verify-otp`

### 4. Utils

- **`utils/sendEmail.js`** - Email sending utility using Nodemailer

## Environment Variables Required

Add these to your `.env` file in the `server` directory:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Existing variables
JWT_SECRET=your-jwt-secret
MONGODB_URI=your-mongodb-uri
PORT=5000
```

## Gmail App Password Setup

**⚠️ IMPORTANT**: Don't use your regular Gmail password!

### Steps to get Gmail App Password:

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Enable **2-Step Verification** (if not already enabled)
4. After enabling 2FA, go back to Security
5. Under "Signing in to Google", select **App passwords**
6. Select app: **Mail**
7. Select device: **Other (Custom name)** → Enter "Aspirant Network"
8. Click **Generate**
9. Copy the 16-character password (remove spaces)
10. Use this password in `EMAIL_PASS` environment variable

## API Endpoints

### 1. Send OTP

**Endpoint**: `POST /api/auth/send-otp`

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Response** (Success):

```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

**Response** (Email Already Verified):

```json
{
  "success": false,
  "message": "Email already registered and verified"
}
```

---

### 2. Verify OTP

**Endpoint**: `POST /api/auth/verify-otp`

**Request Body**:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response** (Success):

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Response** (Invalid OTP):

```json
{
  "success": false,
  "message": "Invalid OTP. 3 attempts remaining."
}
```

**Response** (Expired):

```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}
```

---

### 3. Complete Signup

**Endpoint**: `POST /api/auth/signup`

**Request Body**:

```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "user@example.com",
  "password": "securePassword123",
  "primaryExam": "JEE",
  "attemptYear": 2026,
  "level": "Intermediate"
}
```

**Response** (Success):

```json
{
  "success": true,
  "message": "Registration completed successfully",
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "username": "johndoe",
    "email": "user@example.com",
    "primaryExam": "JEE",
    "attemptYear": 2026,
    "level": "Intermediate"
  }
}
```

**Response** (Email Not Verified):

```json
{
  "success": false,
  "message": "Email not verified. Please verify your email with OTP first."
}
```

## Authentication Flow

```
1. User enters email
   ↓
2. POST /api/auth/send-otp
   → OTP generated, hashed, stored
   → Email sent with OTP
   ↓
3. User receives email with 6-digit OTP
   ↓
4. User enters OTP
   ↓
5. POST /api/auth/verify-otp
   → OTP validated
   → Email marked as verified
   → OTP fields cleared
   ↓
6. User completes signup form
   ↓
7. POST /api/auth/signup
   → Profile completed
   → JWT token issued
   → User logged in
```

## Security Features

| Feature               | Implementation                          |
| --------------------- | --------------------------------------- |
| **OTP Storage**       | Hashed with bcrypt (salt rounds: 10)    |
| **Expiry**            | 2 minutes from generation               |
| **Attempts Limit**    | Maximum 5 wrong attempts                |
| **Replay Protection** | OTP cleared after verification          |
| **Email Uniqueness**  | Verified emails cannot receive new OTPs |
| **Rate Limiting**     | User must request new OTP after expiry  |

## Testing the Implementation

### Using Postman/Thunder Client:

1. **Send OTP**:

   ```
   POST http://localhost:5000/api/auth/send-otp
   Body: { "email": "test@example.com" }
   ```

2. **Check your email** for the 6-digit OTP

3. **Verify OTP**:

   ```
   POST http://localhost:5000/api/auth/verify-otp
   Body: { "email": "test@example.com", "otp": "123456" }
   ```

4. **Complete Signup**:
   ```
   POST http://localhost:5000/api/auth/signup
   Body: {
     "name": "Test User",
     "username": "testuser",
     "email": "test@example.com",
     "password": "password123",
     "primaryExam": "JEE",
     "attemptYear": 2026,
     "level": "Beginner"
   }
   ```

## Error Handling

All errors return consistent JSON format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

Common error scenarios:

- Missing required fields → 400 Bad Request
- User not found → 404 Not Found
- Invalid credentials → 401 Unauthorized
- Server errors → 500 Internal Server Error

## Production Considerations

Before deploying to production:

1. **Email Service**: Consider using dedicated email services:
   - SendGrid
   - AWS SES
   - Mailgun
   - More reliable than Gmail for high volume

2. **Rate Limiting**: Add rate limiting to prevent abuse:

   ```javascript
   // Example: Max 3 OTP requests per email per hour
   ```

3. **Monitoring**: Track:
   - OTP delivery success rate
   - Verification failure rate
   - Time between send and verify

4. **Environment Variables**: Use proper secret management in production

## Troubleshooting

### OTP Email Not Received?

1. Check spam/junk folder
2. Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
3. Ensure Gmail App Password is correct (16 characters)
4. Check server console for email sending errors

### "Invalid OTP" Error?

1. OTP is case-sensitive (though numeric only)
2. Check if OTP expired (2 minutes)
3. Verify not exceeding 5 attempts
4. Request new OTP if needed

### "Email already registered and verified"?

- This email already completed signup
- User should use `/api/auth/login` instead

## Next Steps (Optional Enhancements)

- [ ] Add resend OTP endpoint with cooldown
- [ ] SMS OTP as backup verification method
- [ ] Email templates customization
- [ ] OTP length configuration via environment variable
- [ ] Audit logging for security events

---

**Implementation Complete!** 🎉

Your MERN backend now has production-ready email OTP verification.
