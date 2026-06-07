# SEHub — SMTP Test Checklist

> **Prerequisite:** Replace `REPLACE_ME` in `appsettings.Development.Local.json` with real credentials  
> **API:** http://localhost:5006

---

## Required Credentials (all providers)

| Field | Config key | Example (Mailtrap) | Example (Gmail) |
|-------|------------|--------------------|-----------------|
| Host | `Email:Smtp:Host` | `sandbox.smtp.mailtrap.io` | `smtp.gmail.com` |
| Port | `Email:Smtp:Port` | `587` | `587` |
| Username | `Email:Smtp:Username` | Mailtrap SMTP user | `you@gmail.com` |
| Password | `Email:Smtp:Password` | Mailtrap SMTP pass | Gmail App Password |
| From | `Email:Smtp:From` | `noreply@sehub.local` | `you@gmail.com` |

---

## Pre-flight

- [ ] `appsettings.Development.Local.json` exists with real credentials (not `REPLACE_ME`)
- [ ] `Email:Provider` = `Smtp` in Development
- [ ] API restarted after config change
- [ ] Startup log shows: `SMTP email configuration present for host ...` (not incomplete warning)

---

## A. Mailtrap Test

### Setup

1. [ ] Create Mailtrap account → Email Testing → Inbox
2. [ ] Copy SMTP credentials from inbox **SMTP Settings**
3. [ ] Paste into `appsettings.Development.Local.json`:

```json
"Host": "sandbox.smtp.mailtrap.io",
"Port": 587,
"Username": "<from-mailtrap>",
"Password": "<from-mailtrap>",
"From": "noreply@sehub.local"
```

### Send test

4. [ ] `POST /api/v1/auth/send-email-verification` with registered user email
5. [ ] Mailtrap inbox shows email — subject `SEHub - Ma xac thuc OTP`
6. [ ] Body contains 6-digit code

### Verify test

7. [ ] `POST /api/v1/auth/verify-email` with email + code → HTTP 200
8. [ ] User `EmailConfirmed` = true in database

### Forgot password test

9. [ ] `POST /api/v1/auth/forgot-password` with same email
10. [ ] New OTP email in Mailtrap inbox
11. [ ] `POST /api/v1/auth/verify-otp` → 200
12. [ ] `POST /api/v1/auth/reset-password` with code + new password → 200

---

## B. Gmail SMTP Test

### Setup

1. [ ] Enable Google 2-Step Verification
2. [ ] Create App Password (Security → App passwords)
3. [ ] Configure local file:

```json
"Host": "smtp.gmail.com",
"Port": 587,
"Username": "you@gmail.com",
"Password": "<16-char-app-password>",
"From": "you@gmail.com",
"EnableSsl": true
```

### Send test

4. [ ] Restart API — confirm startup SMTP success log
5. [ ] `POST /api/v1/auth/send-email-verification`
6. [ ] Check Gmail inbox (and Spam folder)

### Verify test

7. [ ] `POST /api/v1/auth/verify-email` → 200
8. [ ] Login works (if `RequireConfirmedEmail` enabled)

### Forgot password test

9. [ ] `POST /api/v1/auth/forgot-password`
10. [ ] OTP email received in Gmail
11. [ ] Complete verify-otp → reset-password flow

---

## Failure indicators

| Symptom | Likely cause |
|---------|--------------|
| Startup warning about missing Host/Username/Password | `REPLACE_ME` not replaced |
| `Email:Smtp:Host is required` on send | Host still empty |
| 535 Authentication failed (Gmail) | Using account password instead of App Password |
| 535 (Mailtrap) | Wrong SMTP username/password |
| Email not in inbox | Wrong provider inbox; check Spam |
| `OTP_COOLDOWN` (429) | Wait 60s between resends |

---

## SMS sanity check (unchanged)

- [ ] `POST /api/v1/auth/send-sms-otp` → OTP in **API console only** (`[SMS OTP]`)
- [ ] No SMS provider credentials required
