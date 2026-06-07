# Gmail SMTP Verification Report

**Date:** 2026-06-06  
**Environment:** Development (`ASPNETCORE_ENVIRONMENT=Development`)  
**Scope:** Local SMTP configuration only — no OTP/Auth API/schema changes

---

## 1. Active SMTP Configuration

**File:** `SEHub.Backend/src/SEHub.API/appsettings.Development.Local.json` (gitignored)

| Setting | Value |
|---------|-------|
| `Email:Provider` | `Smtp` |
| `Email:Smtp:Host` | `smtp.gmail.com` |
| `Email:Smtp:Port` | `587` |
| `Email:Smtp:Username` | `sehub.noreply@gmail.com` |
| `Email:Smtp:Password` | `********` |
| `Email:Smtp:From` | `sehub.noreply@gmail.com` |
| `Email:Smtp:FromDisplayName` | `SEHub` |
| `Email:Smtp:EnableSsl` | `true` |

**Overlay source:** `appsettings.Development.json` (base) + `appsettings.Development.Local.json` (credentials).

---

## 2. Configuration Loading

| Check | Result | Evidence |
|-------|--------|----------|
| `appsettings.Development.Local.json` loaded in Development | **PASS** | `Program.cs` lines 11–14: `AddJsonFile(..., optional: true)` |
| `Email:Provider = Smtp` | **PASS** | Local + Development JSON |
| No incomplete-config startup warning | **PASS** | Startup log (see §4) |

---

## 3. Service Registration Chain (CodeGraph)

```
Program.cs
  └─ AddInfrastructure(configuration)
       └─ DependencyInjection.cs
            ├─ Configure<EmailSettings>(configuration.GetSection("Email"))
            └─ if Provider == "Smtp" → AddScoped<IEmailService, SmtpEmailService>()
                 └─ SmtpEmailService.SendOtpEmailAsync()
                      ↑
OtpService.GenerateAndSendEmailAsync()  [caller via CodeGraph]
  ↑
AuthService paths (unchanged):
  ├─ SendForgotPasswordOtpAsync() → OtpService.GenerateAndSendAsync()
  ├─ SendEmailVerificationAsync() → OtpService.GenerateAndSendEmailAsync()
  └─ RegisterAsync() → OtpService.GenerateAndSendEmailAsync()
```

| Check | Result |
|-------|--------|
| `IEmailService` resolves to `SmtpEmailService` when `Provider=Smtp` | **PASS** |
| `OtpService` unchanged, calls `IEmailService.SendOtpEmailAsync` | **PASS** |
| Auth API controllers unchanged | **PASS** |
| Database schema unchanged | **PASS** |

**CodeGraph queries used:**
- `codegraph query IEmailService`
- `codegraph query SmtpEmailService`
- `codegraph callers SendOtpEmailAsync`
- `codegraph callers GenerateAndSendEmailAsync`

---

## 4. Startup Logs

```
info: Email.Smtp[0]
      SMTP email configuration present for host smtp.gmail.com:587.
      OTP emails will be sent via SmtpEmailService.
```

| Check | Result |
|-------|--------|
| SMTP startup validation passes | **PASS** |
| No "configuration is incomplete" warning | **PASS** |
| API listening on `http://localhost:5006` | **PASS** |

---

## 5. API Test Results

### `POST /api/v1/auth/forgot-password`

**Request:**
```json
{ "email": "demo.student@sehub.local" }
```

| Metric | Result |
|--------|--------|
| HTTP status | `500` |
| Latency | ~5776 ms |
| SMTP TLS/connect | **PASS** (MailKit connected to `smtp.gmail.com:587`) |
| SMTP authenticate | **FAIL** |
| Error | `535: 5.7.8 Username and Password not accepted (BadCredentials)` |

**Log excerpt (masked):**
```
fail: SMTP authentication failed for sehub.noreply@gmail.com on smtp.gmail.com
MailKit.Security.AuthenticationException: 535: 5.7.8 Username and Password not accepted
```

### `POST /api/v1/auth/send-email-verification`

**Request:**
```json
{ "email": "tuhaumac2003@gmail.com" }
```

| Metric | Result |
|--------|--------|
| HTTP status | `200` |
| Latency | ~73 ms |
| SMTP invoked | **No** (early return: user not found or `EmailConfirmed=true`) |
| Response | `{ "message": "Verification email sent" }` |

> Note: This endpoint returns `200` silently when the user is missing or already verified (by design). SMTP was not exercised for this recipient.

---

## 6. Summary

| Area | Status |
|------|--------|
| Local dev config (`appsettings.Development.Local.json`) | **PASS** |
| Config loaded by `Program.cs` | **PASS** |
| `Email:Provider = Smtp` | **PASS** |
| `IEmailService` → `SmtpEmailService` | **PASS** |
| Startup SMTP validation (no warnings) | **PASS** |
| SMTP TLS connection (`smtp.gmail.com:587`) | **PASS** |
| SMTP authentication (Gmail App Password) | **FAIL** |
| `POST /api/v1/auth/forgot-password` end-to-end | **FAIL** |
| `POST /api/v1/auth/send-email-verification` (HTTP) | **PASS** (SMTP not triggered for test email) |

### Overall: **FAIL** (blocked on Gmail credentials)

Configuration and service wiring are correct. Gmail rejects the App Password (`BadCredentials`). To complete verification:

1. Enable **2-Step Verification** on `sehub.noreply@gmail.com`
2. Generate a new **App Password** at https://myaccount.google.com/apppasswords
3. Update `Password` in `appsettings.Development.Local.json` only
4. Restart API and re-run both test endpoints

---

## 7. Security Notes

- Credentials stored only in `appsettings.Development.Local.json` (gitignored)
- This report masks `Password` as `********`
- Do not commit App Passwords to `appsettings.Production.json` in source control; prefer environment variables or secret store for production
