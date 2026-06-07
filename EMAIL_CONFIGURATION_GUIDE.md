# SEHub — Email SMTP Configuration Guide

> **Scope:** Real OTP email delivery in Development and Production  
> **Service:** Existing `SmtpEmailService` (no new email implementations)  
> **SMS:** Unchanged — `MockSmsService` (console/logger only)

---

## Quick start

1. Set `Email:Provider` to `Smtp` (already default in `appsettings.Development.json`).
2. Fill SMTP credentials using **one** method below.
3. Restart the API.
4. Trigger OTP via register, `send-email-verification`, or `forgot-password`.
5. Check inbox (or Mailtrap sandbox).

---

## Configuration methods (pick one)

### Method A — Local file (recommended for dev)

```powershell
cd SEHub.Backend/src/SEHub.API
Copy-Item appsettings.Development.Local.json.example appsettings.Development.Local.json
# Edit appsettings.Development.Local.json with your credentials
```

`appsettings.Development.Local.json` is **gitignored**.

### Method B — User secrets

```powershell
cd SEHub.Backend/src/SEHub.API
dotnet user-secrets set "Email:Smtp:Host" "sandbox.smtp.mailtrap.io"
dotnet user-secrets set "Email:Smtp:Port" "587"
dotnet user-secrets set "Email:Smtp:Username" "your-mailtrap-user"
dotnet user-secrets set "Email:Smtp:Password" "your-mailtrap-pass"
dotnet user-secrets set "Email:Smtp:From" "noreply@sehub.local"
dotnet user-secrets set "Email:Smtp:FromDisplayName" "SEHub Dev"
dotnet user-secrets set "Email:Smtp:EnableSsl" "true"
```

### Method C — Environment variables

```powershell
$env:Email__Smtp__Host = "sandbox.smtp.mailtrap.io"
$env:Email__Smtp__Port = "587"
$env:Email__Smtp__Username = "your-mailtrap-user"
$env:Email__Smtp__Password = "your-mailtrap-pass"
$env:Email__Smtp__From = "noreply@sehub.local"
$env:Email__Smtp__EnableSsl = "true"
```

---

## 1. Mailtrap setup (safest for development)

1. Create account at [mailtrap.io](https://mailtrap.io).
2. Open **Email Testing** → **Inboxes** → your inbox.
3. Go to **SMTP Settings** → copy host, port, username, password.

### `appsettings.Development.Local.json`

```json
{
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "sandbox.smtp.mailtrap.io",
      "Port": 587,
      "Username": "YOUR_MAILTRAP_USERNAME",
      "Password": "YOUR_MAILTRAP_PASSWORD",
      "From": "noreply@sehub.local",
      "FromDisplayName": "SEHub Dev",
      "EnableSsl": true
    }
  }
}
```

**Alternative port:** Mailtrap also supports port `2525` — set `"Port": 2525` if 587 is blocked.

OTP appears in the Mailtrap inbox UI (not a real external mailbox).

---

## 2. Gmail SMTP setup

### Prerequisites

- Google account with 2-Step Verification enabled
- App Password (see section 3)

### SMTP settings

| Setting | Value |
|---------|-------|
| Host | `smtp.gmail.com` |
| Port | `587` |
| SSL | `true` |
| Username | Your Gmail address |
| Password | **App Password** (16 characters) |

### `appsettings.Development.Local.json`

```json
{
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "smtp.gmail.com",
      "Port": 587,
      "Username": "yourname@gmail.com",
      "Password": "YOUR_GMAIL_APP_PASSWORD",
      "From": "yourname@gmail.com",
      "FromDisplayName": "SEHub",
      "EnableSsl": true
    }
  }
}
```

**Note:** `From` should match the Gmail account (or a configured alias). Daily sending limits apply on free Gmail.

---

## 3. Gmail App Password setup

1. Go to [Google Account](https://myaccount.google.com/) → **Security**.
2. Enable **2-Step Verification** if not already on.
3. Search **App passwords** (or: Security → 2-Step Verification → App passwords).
4. Create app: name `SEHub Dev`, device `Other`.
5. Copy the 16-character password (no spaces).
6. Set as `Email:Smtp:Password` — **never** use your normal Gmail password.

### User secrets example

```powershell
dotnet user-secrets set "Email:Smtp:Host" "smtp.gmail.com"
dotnet user-secrets set "Email:Smtp:Username" "yourname@gmail.com"
dotnet user-secrets set "Email:Smtp:Password" "abcd efgh ijkl mnop"
dotnet user-secrets set "Email:Smtp:From" "yourname@gmail.com"
```

---

## 4. Brevo SMTP setup

1. Create account at [brevo.com](https://www.brevo.com).
2. Go to **SMTP & API** → **SMTP**.
3. Copy SMTP server, login, and generate SMTP key (password).

### SMTP settings

| Setting | Value |
|---------|-------|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| SSL | `true` |
| Username | Your Brevo account email |
| Password | Brevo SMTP key |

### `appsettings.Development.Local.json`

```json
{
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "smtp-relay.brevo.com",
      "Port": 587,
      "Username": "your-brevo-login@example.com",
      "Password": "YOUR_BREVO_SMTP_KEY",
      "From": "noreply@your-verified-domain.com",
      "FromDisplayName": "SEHub",
      "EnableSsl": true
    }
  }
}
```

**Note:** Brevo requires a verified sender domain for production volumes. Use a verified `From` address.

---

## Production configuration

`appsettings.Production.json` already sets `Email:Provider = Smtp`. Supply credentials via deployment secrets:

```powershell
# Azure App Service / container env vars
Email__Smtp__Host=smtp-relay.brevo.com
Email__Smtp__Username=...
Email__Smtp__Password=...
Email__Smtp__From=noreply@sehub.app
```

---

## Fallback to console logging

To disable real email and log OTP to the API console instead:

```json
{
  "Email": {
    "Provider": "Logging"
  }
}
```

No code changes required — DI switches implementation in `DependencyInjection.cs`.

---

## SMS (unchanged)

SMS OTP always uses `MockSmsService`. Codes appear in the API console:

```
[SMS OTP]
Phone: 0901234567
Code: 123456
```

No SMTP or Twilio configuration affects SMS.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Email:Smtp:Host is required` | `Host` empty | Set Host in local file / secrets / env |
| SMTP auth failed | Wrong password | Gmail: use App Password; Brevo: use SMTP key |
| Connection timeout | Firewall blocks 587 | Try Mailtrap port 2525 |
| Email not received | Wrong inbox / spam | Mailtrap: check sandbox inbox; Gmail: check Spam |

---

## Configuration reference

Bound to `EmailSettings` in `Infrastructure/Email/EmailSettings.cs`:

| Key | Type | Required when Smtp |
|-----|------|------------------|
| `Email:Provider` | `Logging` \| `Smtp` | Yes |
| `Email:Smtp:Host` | string | Yes |
| `Email:Smtp:Port` | int | Yes (default 587) |
| `Email:Smtp:Username` | string | Usually yes |
| `Email:Smtp:Password` | string | Usually yes |
| `Email:Smtp:From` | string | Recommended |
| `Email:Smtp:FromDisplayName` | string | Optional |
| `Email:Smtp:EnableSsl` | bool | true for all providers above |
