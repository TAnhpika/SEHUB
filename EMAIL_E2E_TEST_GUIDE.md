# SEHub — Email OTP End-to-End Test Guide

> **Base URL:** `http://localhost:5006/api/v1/auth`  
> **Swagger:** http://localhost:5006/swagger  
> **Service:** `SmtpEmailService` (existing) — no new implementations

---

## APIs used

| Flow | Endpoint | Method |
|------|----------|--------|
| Send email verification OTP | `/send-email-verification` | POST |
| Verify email OTP | `/verify-email` | POST |
| Send forgot-password OTP | `/forgot-password` | POST |
| Verify forgot-password OTP | `/verify-otp` | POST |
| Reset password | `/reset-password` | POST |

Defined in `AuthController.cs` — unchanged.

---

## Step 1 — Run API

```powershell
cd SEHub.Backend/src/SEHub.API
# Ensure appsettings.Development.Local.json has real SMTP credentials
dotnet run
```

Expected: `Now listening on: http://localhost:5006`

---

## Step 2 — Verify startup logs

**Success (credentials configured):**

```
SMTP email configuration present for host sandbox.smtp.mailtrap.io:587. OTP emails will be sent via SmtpEmailService.
```

**Incomplete (REPLACE_ME still set):**

```
SMTP email provider is enabled but configuration is incomplete. Missing: Email:Smtp:Host, ...
```

Fix credentials before continuing — see [SMTP_TEST_CHECKLIST.md](SMTP_TEST_CHECKLIST.md).

---

## Step 3 — Send Email Verification OTP

Use an email belonging to an **existing unconfirmed** user, or register first.

```http
POST http://localhost:5006/api/v1/auth/send-email-verification
Content-Type: application/json

{
  "email": "demo.student@sehub.local"
}
```

**Expected response:**

```json
{
  "success": true,
  "data": { "message": "Verification email sent" }
}
```

**cURL:**

```bash
curl -X POST http://localhost:5006/api/v1/auth/send-email-verification \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"demo.student@sehub.local\"}"
```

---

## Step 4 — Check inbox

| Provider | Where to look |
|----------|---------------|
| Mailtrap | Inbox UI at mailtrap.io |
| Gmail | Inbox or Spam — subject `SEHub - Ma xac thuc OTP` |

Email body: `Ma OTP cua ban la: 123456. Ma co hieu luc trong 10 phut.`

---

## Step 5 — Verify OTP

```http
POST http://localhost:5006/api/v1/auth/verify-email
Content-Type: application/json

{
  "email": "demo.student@sehub.local",
  "code": "123456"
}
```

Replace `123456` with code from inbox.

**Expected:** HTTP 200, `"message": "Email verified"`

**Invalid code:** HTTP 400, `"code": "OTP_INVALID"`

---

## Step 6 — Confirm EmailConfirmed updated

**Option A — Login** (if `RequireConfirmedEmail` is true in your environment)

```http
POST http://localhost:5006/api/v1/auth/login
{
  "emailOrUsername": "demo.student@sehub.local",
  "password": "Demo@12345"
}
```

Should succeed (not `EMAIL_NOT_CONFIRMED`).

**Option B — Database**

```sql
SELECT Email, EmailConfirmed FROM AspNetUsers WHERE Email = 'demo.student@sehub.local';
-- EmailConfirmed = 1
```

---

## Step 7 — Test Forgot Password flow

### 7a. Request OTP

```http
POST http://localhost:5006/api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "demo.student@sehub.local"
}
```

Check inbox for new OTP email.

### 7b. Verify OTP (optional step)

```http
POST http://localhost:5006/api/v1/auth/verify-otp
{
  "email": "demo.student@sehub.local",
  "code": "654321"
}
```

### 7c. Reset password

```http
POST http://localhost:5006/api/v1/auth/reset-password
{
  "email": "demo.student@sehub.local",
  "code": "654321",
  "newPassword": "Demo@12345"
}
```

**Expected:** HTTP 200 — `"Password reset successful"`

### 7d. Confirm login with new password

```http
POST http://localhost:5006/api/v1/auth/login
```

---

## Register → verify flow (alternative path)

```http
POST /api/v1/auth/register
{
  "email": "e2e.test@example.com",
  "username": "e2etest",
  "password": "Demo@12345",
  "displayName": "E2E Test"
}
```

Register auto-sends verification OTP → check inbox → `POST /verify-email`.

---

## SMS (out of scope — sanity check)

```http
POST /api/v1/auth/send-sms-otp
{ "phone": "0901234567" }
```

OTP appears in **API terminal** only (`[SMS OTP]`), not email.
