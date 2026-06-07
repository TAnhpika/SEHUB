# SEHub — Email SMTP Setup Guide

> **Service:** Existing `SmtpEmailService` only  
> **SMS:** `MockSmsService` (unchanged — console/logger)  
> **OTP:** Reuses `OtpService` + `OtpVerifications` — no architecture changes

---

## Prerequisites

- API project: `SEHub.Backend/src/SEHub.API`
- Development uses `Email:Provider = Smtp` (see `appsettings.Development.json`)
- Credentials via **one** of: local file, user secrets, environment variables

---

## Quick setup

```powershell
cd SEHub.Backend/src/SEHub.API
Copy-Item appsettings.Development.Local.json.example appsettings.Development.Local.json
# Edit appsettings.Development.Local.json — fill Host, Username, Password, From
dotnet run
```

On startup, if SMTP fields are missing you will see a **warning** in logs (app still starts). When configured, you will see:

```
SMTP email configuration present for host sandbox.smtp.mailtrap.io:587
```

---

## Configuration methods

### A. Local file (recommended)

File: `appsettings.Development.Local.json` (gitignored)

```json
{
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "sandbox.smtp.mailtrap.io",
      "Port": 587,
      "Username": "your-mailtrap-user",
      "Password": "your-mailtrap-password",
      "From": "noreply@sehub.local",
      "FromDisplayName": "SEHub",
      "EnableSsl": true
    }
  }
}
```

### B. User secrets

```powershell
dotnet user-secrets set "Email:Smtp:Host" "sandbox.smtp.mailtrap.io"
dotnet user-secrets set "Email:Smtp:Port" "587"
dotnet user-secrets set "Email:Smtp:Username" "your-user"
dotnet user-secrets set "Email:Smtp:Password" "your-password"
dotnet user-secrets set "Email:Smtp:From" "noreply@sehub.local"
```

### C. Environment variables

```powershell
$env:Email__Smtp__Host = "sandbox.smtp.mailtrap.io"
$env:Email__Smtp__Port = "587"
$env:Email__Smtp__Username = "your-user"
$env:Email__Smtp__Password = "your-password"
$env:Email__Smtp__From = "noreply@sehub.local"
```

---

## A. Mailtrap setup

### 1. Account creation

1. Go to [https://mailtrap.io](https://mailtrap.io) and sign up (free tier available).
2. Open **Email Testing** → **Inboxes**.
3. Select or create an inbox.

### 2. SMTP credentials

1. Inbox → **SMTP Settings**.
2. Note:
   - Host: `sandbox.smtp.mailtrap.io`
   - Port: `587` (or `2525`)
   - Username / Password: shown in SMTP Settings

### 3. Example configuration

```json
{
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "sandbox.smtp.mailtrap.io",
      "Port": 587,
      "Username": "<mailtrap-username>",
      "Password": "<mailtrap-password>",
      "From": "noreply@sehub.local",
      "FromDisplayName": "SEHub Dev",
      "EnableSsl": true
    }
  }
}
```

### 4. Test procedure

```http
POST http://localhost:5006/api/v1/auth/send-email-verification
Content-Type: application/json

{ "email": "test@example.com" }
```

1. Check Mailtrap inbox UI for email with subject `SEHub - Ma xac thuc OTP`.
2. Copy 6-digit code from email body.
3. Verify:

```http
POST http://localhost:5006/api/v1/auth/verify-email
{ "email": "test@example.com", "code": "123456" }
```

---

## B. Gmail setup

### 1. Enable 2-Step Verification

1. [Google Account](https://myaccount.google.com/) → **Security**.
2. Enable **2-Step Verification**.

### 2. Create App Password

1. Security → **App passwords** (under 2-Step Verification).
2. App: `Mail`, Device: `Other` → name `SEHub Dev`.
3. Copy the 16-character password (spaces optional).

**Never use your normal Gmail password for SMTP.**

### 3. SMTP configuration

| Setting | Value |
|---------|-------|
| Host | `smtp.gmail.com` |
| Port | `587` |
| SSL | `true` |
| Username | Your Gmail address |
| Password | App Password |
| From | Same Gmail address |

```json
{
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "smtp.gmail.com",
      "Port": 587,
      "Username": "you@gmail.com",
      "Password": "xxxx xxxx xxxx xxxx",
      "From": "you@gmail.com",
      "FromDisplayName": "SEHub",
      "EnableSsl": true
    }
  }
}
```

### 4. Test procedure

Same as Mailtrap test above. Check Gmail inbox (or Spam) for OTP email.

---

## C. Troubleshooting

### Authentication failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| `535 Authentication failed` (Gmail) | Using account password | Use App Password |
| `535` (Mailtrap) | Wrong username/password | Re-copy from SMTP Settings |
| `Email:Smtp:Host is required` | Host empty at send time | Fill `Email:Smtp:Host` |

### Timeout / connection issues

| Symptom | Fix |
|---------|-----|
| Connection timeout on port 587 | Try Mailtrap port `2525` |
| Firewall blocks outbound SMTP | Use Mailtrap (dev) or corporate relay |
| `EnableSsl` errors | Ensure `EnableSsl: true` for Gmail/Mailtrap |

### Email not visible

| Check | Action |
|-------|--------|
| Mailtrap | Open correct inbox in web UI |
| Gmail | Check Spam/Promotions |
| Wrong recipient | Use email of registered user for verify-email |
| Startup warning | Configure missing Host/Username/Password |

### Startup warning (expected without credentials)

```
SMTP email provider is enabled but configuration is incomplete. Missing: Email:Smtp:Host, ...
```

App **still runs**. OTP email fails until credentials are configured.

### Fallback to console logging

```json
{ "Email": { "Provider": "Logging" } }
```

OTP prints to API console — no SMTP needed.

### SMS (unchanged)

SMS OTP always uses `MockSmsService` — codes in API console:

```
[SMS OTP]
Phone: 0901234567
Code: 123456
```

---

## Production

`appsettings.Production.json` sets `Provider: Smtp`. Supply credentials via deployment secrets:

```
Email__Smtp__Host=smtp-relay.brevo.com
Email__Smtp__Username=...
Email__Smtp__Password=...
```

SMS remains `MockSmsService` in all environments.
