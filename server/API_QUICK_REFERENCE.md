# Quick API Reference - OTP Verification

## 🔐 Authentication Flow

### Step 1: Send OTP

```http
POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response**:

```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

---

### Step 2: Verify OTP

```http
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### Step 3: Complete Registration

```http
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

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

**Response**:

```json
{
  "success": true,
  "message": "Registration completed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "username": "johndoe",
    "email": "user@example.com",
    "primaryExam": "JEE",
    "attemptYear": 2026,
    "level": "Intermediate"
  }
}
```

---

### Step 4: Login (Existing)

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "username": "johndoe",
    "email": "user@example.com",
    "primaryExam": "JEE",
    "level": "Intermediate"
  }
}
```

---

## 🎯 Common Scenarios

### Scenario 1: User requests new OTP (email not verified yet)

- ✅ Sends new OTP
- ✅ Resets attempt counter
- ✅ Updates expiry time

### Scenario 2: User enters wrong OTP

- ❌ Increments attempt counter
- 📊 Shows remaining attempts (max 5)
- ⏰ OTP still valid if not expired

### Scenario 3: OTP expired

- ❌ Verification fails
- 💡 User must request new OTP

### Scenario 4: Email already verified

- ❌ Cannot send new OTP
- 💡 User should proceed to signup or login

---

## ⚠️ Error Messages

| Error                                        | Reason                                | Solution                     |
| -------------------------------------------- | ------------------------------------- | ---------------------------- |
| "Email is required"                          | Missing email in request              | Provide email field          |
| "Email already registered and verified"      | Email already in use                  | Use different email or login |
| "User not found. Please request OTP first."  | No OTP sent for this email            | Send OTP first               |
| "OTP has expired. Please request a new OTP." | OTP older than 2 minutes              | Request new OTP              |
| "Invalid OTP. X attempts remaining."         | Wrong OTP entered                     | Enter correct OTP            |
| "Maximum OTP attempts exceeded."             | More than 5 wrong attempts            | Request new OTP              |
| "Email not verified."                        | Trying to signup without verification | Verify email first           |

---

## 🔒 Security Features

- ✅ OTP hashed with bcrypt (never stored in plain text)
- ✅ 2-minute expiry window
- ✅ Maximum 5 verification attempts
- ✅ Automatic OTP cleanup after verification
- ✅ Protected against already verified emails
- ✅ Email normalization (lowercase, trimmed)

---

## 📧 Email Configuration

Add to `.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

**Get Gmail App Password**: https://myaccount.google.com/apppasswords

---

## 🧪 Testing Checklist

- [ ] Send OTP to new email
- [ ] Receive email with 6-digit OTP
- [ ] Verify with correct OTP
- [ ] Try wrong OTP (check attempt counter)
- [ ] Wait 2+ minutes and try expired OTP
- [ ] Request new OTP after expiry
- [ ] Complete signup with verified email
- [ ] Try signup without verification
- [ ] Try sending OTP to already verified email
- [ ] Login with completed account

---

**Created**: February 2026
**Status**: Production Ready ✅
