# SEHub — OTP Demo Guide (Development)

> **Prerequisites:** API running at `http://localhost:5006`, `Email:Provider = Logging`, `Auth:RequireConfirmedEmail = false`

Watch the **API terminal/console** for OTP codes. They are never returned in HTTP responses.

---

## Quick Reference

| Flow | Send endpoint | Verify endpoint | Console prefix |
|------|---------------|-----------------|----------------|
| Email verification | `POST /api/v1/auth/send-email-verification` | `POST /api/v1/auth/verify-email` | `[OTP]` |
| Forgot password | `POST /api/v1/auth/forgot-password` | `POST /api/v1/auth/verify-otp` | `[OTP]` |
| SMS | `POST /api/v1/auth/send-sms-otp` | `POST /api/v1/auth/verify-sms-otp` | `[SMS OTP]` |

**Swagger:** http://localhost:5006/swagger

---

## Flow 1 — Register → Verify Email

```
Register
   ↓
OTP auto-sent
   ↓
Check console [OTP]
   ↓
Verify email
   ↓
EmailConfirmed = true
```

### Step 1: Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "otp.demo@sehub.local",
  "username": "otpdemo",
  "password": "Demo@12345",
  "displayName": "OTP Demo"
}
```

### Step 2: Read OTP from console

```
[OTP]
Email: otp.demo@sehub.local
Code: 482910
```

### Step 3: Verify email

```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "email": "otp.demo@sehub.local",
  "code": "482910"
}
```

Expected: `{ "success": true, "data": { "message": "Email verified" } }`

### Step 4 (optional): Resend verification

Wait **60 seconds** between sends, then:

```http
POST /api/v1/auth/send-email-verification
Content-Type: application/json

{
  "email": "otp.demo@sehub.local"
}
```

---

## Flow 2 — Forgot Password → Reset

```
Forgot password
   ↓
OTP generated
   ↓
Check console [OTP]
   ↓
Verify OTP (optional step)
   ↓
Reset password (marks OTP used)
```

Uses existing demo account: `demo.student@sehub.local` / `Demo@12345`

### Step 1: Request OTP

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "demo.student@sehub.local"
}
```

### Step 2: Read OTP from console

```
[OTP]
Email: demo.student@sehub.local
Code: 137204
```

### Step 3: Verify OTP (optional)

```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "email": "demo.student@sehub.local",
  "code": "137204"
}
```

### Step 4: Reset password

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "email": "demo.student@sehub.local",
  "code": "137204",
  "newPassword": "Demo@12345"
}
```

**Note:** The same OTP code works for both verify and reset until reset succeeds. After reset, the OTP is consumed (`IsUsed = true`) and cannot be reused.

---

## Flow 3 — SMS OTP

```
Send SMS OTP
   ↓
Check console [SMS OTP]
   ↓
Verify SMS OTP
```

### Step 1: Send

```http
POST /api/v1/auth/send-sms-otp
Content-Type: application/json

{
  "phone": "0901234567"
}
```

### Step 2: Read OTP from console

```
[SMS OTP]
Phone: 0901234567
Code: 654321
```

### Step 3: Verify

```http
POST /api/v1/auth/verify-sms-otp
Content-Type: application/json

{
  "phone": "0901234567",
  "code": "654321"
}
```

If you are logged in (Bearer token), verifying also saves the phone number on your account.

---

## Flow 4 — Email Confirmation Login Gate (Production simulation)

To test `EMAIL_NOT_CONFIRMED` locally:

1. Set in `appsettings.Development.json`:
   ```json
   "Auth": { "RequireConfirmedEmail": true }
   ```
2. Register a new user (email unconfirmed).
3. Attempt login — expect HTTP 403 with code `EMAIL_NOT_CONFIRMED`.
4. Complete email verification flow, then login succeeds.

---

## Rate Limit Demo

| Action | Limit | Error code |
|--------|-------|------------|
| Resend within 60s | 1 per minute | `OTP_COOLDOWN` (429) |
| More than 5 sends/hour | per email/phone | `OTP_RATE_LIMIT_EXCEEDED` (429) |
| More than 5 wrong codes | per OTP row | `OTP_MAX_ATTEMPTS` (403) |

---

## cURL Examples

```bash
# Send email verification
curl -X POST http://localhost:5006/api/v1/auth/send-email-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"otp.demo@sehub.local"}'

# Verify email (replace CODE from console)
curl -X POST http://localhost:5006/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"otp.demo@sehub.local","code":"CODE"}'

# Send SMS OTP
curl -X POST http://localhost:5006/api/v1/auth/send-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"0901234567"}'
```

---

## Mailtrap (optional SMTP in Development)

Set `Email:Provider` to `Smtp` and configure Mailtrap credentials via environment variables or user secrets (never commit credentials):

```json
"Email": {
  "Provider": "Smtp",
  "Smtp": {
    "Host": "sandbox.smtp.mailtrap.io",
    "Port": 587,
    "Username": "${MAILTRAP_USER}",
    "Password": "${MAILTRAP_PASS}",
    "From": "noreply@sehub.local",
    "FromDisplayName": "SEHub",
    "EnableSsl": true
  }
}
```
