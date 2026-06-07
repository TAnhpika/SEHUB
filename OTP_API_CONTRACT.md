# SEHub — OTP API Contract

> **Base URL:** `http://localhost:5006/api/v1/auth`  
> **Envelope:** All successful responses are wrapped by `ApiResponseWrapperFilter`:

```json
{
  "success": true,
  "data": { },
  "message": null,
  "errors": []
}
```

Error responses from `ExceptionHandlingMiddleware` use the same envelope with `success: false`.

---

## Shared OTP Rules

| Rule | Value | Config key |
|------|-------|------------|
| OTP length | 6 digits | — |
| Expiry | 10 minutes | `Otp:ExpiryMinutes` |
| Resend cooldown | 60 seconds | `Otp:ResendCooldownSeconds` |
| Max verify attempts | 5 per OTP | `Otp:MaxAttempts` |
| Max send requests | 5 per hour per identifier | `Otp:MaxRequestsPerHour` |
| Storage | `OtpVerifications` table (hashed code) | — |
| Reuse after success | Blocked (`IsUsed = true`) | — |

---

## Error Codes

| Code | HTTP | Field | When |
|------|------|-------|------|
| `VALIDATION_FAILED` | 400 | property name | FluentValidation failure |
| `OTP_INVALID` | 400 | `otp` | Wrong/expired/used OTP |
| `OTP_COOLDOWN` | 429 | `otp` | Resend within 60s |
| `OTP_RATE_LIMIT_EXCEEDED` | 429 | `otp` | More than 5 sends/hour |
| `OTP_MAX_ATTEMPTS` | 403 | `otp` | More than 5 wrong attempts |
| `EMAIL_NOT_CONFIRMED` | 403 | `email` | Login blocked when `Auth:RequireConfirmedEmail` is true |
| `NOT_FOUND` | 404 | — | Invalid login credentials |
| `FORBIDDEN` | 403 | — | Generic forbidden |

---

## 1. Register (auto-sends email verification OTP)

**POST** `/register`

### Request

```json
{
  "email": "user@gmail.com",
  "username": "newuser",
  "password": "Secure@123",
  "displayName": "New User"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email, max 256 |
| `username` | Required, 3–50 chars |
| `password` | Required, min 8, digit + upper + lower + special |

### Success Response (`data`)

```json
{
  "accessToken": "eyJ...",
  "expiresIn": 3600,
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "username": "newuser",
    "email": "user@gmail.com",
    "displayName": "New User",
    "role": "Student",
    "isPremium": false,
    "avatarUrl": null,
    "points": 0,
    "levelName": "Beginner"
  }
}
```

**Side effect:** Email verification OTP is generated and sent (console/logger in Development).

---

## 2. Send Email Verification

**POST** `/send-email-verification`

### Request

```json
{
  "email": "user@gmail.com"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email, max 256 |

### Success Response (`data`)

```json
{
  "message": "Verification email sent"
}
```

**Notes:**
- Returns success even if email is unknown or already confirmed (no user enumeration).
- Subject to cooldown and hourly rate limits.

---

## 3. Verify Email

**POST** `/verify-email`

### Request

```json
{
  "email": "user@gmail.com",
  "code": "123456"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email |
| `code` | Required, exactly 6 digits |

### Success Response (`data`)

```json
{
  "message": "Email verified"
}
```

**Side effect:** Sets `EmailConfirmed = true` on the user. OTP marked `IsUsed = true`.

### Error Example

```json
{
  "success": false,
  "data": null,
  "message": "Mã OTP không hợp lệ hoặc đã hết hạn",
  "errors": [{ "field": "otp", "code": "OTP_INVALID" }]
}
```

---

## 4. Login (email confirmation gate)

**POST** `/login`

### Request

```json
{
  "emailOrUsername": "user@gmail.com",
  "password": "Secure@123"
}
```

### Error when email not confirmed (Production)

```json
{
  "success": false,
  "data": null,
  "message": "Email chưa được xác thực",
  "errors": [{ "field": "email", "code": "EMAIL_NOT_CONFIRMED" }]
}
```

**Config:** `Auth:RequireConfirmedEmail` — `false` in Development, `true` in Production.

---

## 5. Forgot Password (unchanged)

**POST** `/forgot-password`

### Request

```json
{
  "email": "user@gmail.com"
}
```

### Success Response (`data`)

```json
{
  "message": "OTP sent"
}
```

---

## 6. Verify OTP (forgot-password step, unchanged)

**POST** `/verify-otp`

### Request

```json
{
  "email": "user@gmail.com",
  "code": "123456"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email |
| `code` | Required, 6 digits |

### Success Response (`data`)

```json
{
  "message": "OTP verified"
}
```

**Note:** Does **not** mark OTP as used — allows subsequent `reset-password` call.

---

## 7. Reset Password (unchanged route, hardened verify)

**POST** `/reset-password`

### Request

```json
{
  "email": "user@gmail.com",
  "code": "123456",
  "newPassword": "NewSecure@456"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email |
| `code` | Required, 6 digits |
| `newPassword` | Required, same rules as register password |

### Success Response (`data`)

```json
{
  "message": "Password reset successful"
}
```

**Side effect:** OTP marked `IsUsed = true` on success. All refresh tokens revoked.

---

## 8. Send SMS OTP

**POST** `/send-sms-otp`

### Request

```json
{
  "phone": "0901234567"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `phone` | Required, 10 digits, starts with `0` (Vietnamese format) |

### Success Response (`data`)

```json
{
  "message": "SMS OTP sent"
}
```

**Development:** OTP logged to console and application logger as `[SMS OTP]`.

---

## 9. Verify SMS OTP

**POST** `/verify-sms-otp`

### Request

```json
{
  "phone": "0901234567",
  "code": "654321"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `phone` | Required, 10 digits, starts with `0` |
| `code` | Required, 6 digits |

### Success Response (`data`)

```json
{
  "message": "SMS OTP verified"
}
```

**Side effect:** OTP marked `IsUsed = true`. If caller is authenticated, `PhoneNumber` is saved on the user profile.

---

## Swagger Examples

Use these in Swagger UI (`http://localhost:5006/swagger`) under **Auth** endpoints:

| Endpoint | Example body |
|----------|--------------|
| `POST /auth/send-email-verification` | `{ "email": "demo.student@sehub.local" }` |
| `POST /auth/verify-email` | `{ "email": "demo.student@sehub.local", "code": "000000" }` |
| `POST /auth/forgot-password` | `{ "email": "demo.student@sehub.local" }` |
| `POST /auth/verify-otp` | `{ "email": "demo.student@sehub.local", "code": "000000" }` |
| `POST /auth/reset-password` | `{ "email": "demo.student@sehub.local", "code": "000000", "newPassword": "Demo@12345" }` |
| `POST /auth/send-sms-otp` | `{ "phone": "0901234567" }` |
| `POST /auth/verify-sms-otp` | `{ "phone": "0901234567", "code": "000000" }` |

Replace `000000` with the code printed in the API console after send.

---

## Configuration Reference

```json
{
  "Email": {
    "Provider": "Logging",
    "Smtp": {
      "Host": "sandbox.smtp.mailtrap.io",
      "Port": 587,
      "Username": "<from-env>",
      "Password": "<from-env>",
      "From": "noreply@sehub.app",
      "FromDisplayName": "SEHub",
      "EnableSsl": true
    }
  },
  "Otp": {
    "ResendCooldownSeconds": 60,
    "MaxAttempts": 5,
    "MaxRequestsPerHour": 5,
    "ExpiryMinutes": 10
  },
  "Auth": {
    "RequireConfirmedEmail": false
  }
}
```

| Environment | `Email:Provider` | `Auth:RequireConfirmedEmail` |
|-------------|-------------------|------------------------------|
| Development | `Logging` | `false` |
| Production | `Smtp` | `true` |
