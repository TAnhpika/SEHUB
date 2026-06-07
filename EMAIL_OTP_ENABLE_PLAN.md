# SEHub — Email OTP Enable Plan

> **Date:** 2026-06-06  
> **Sources:** [OTP_RUNTIME_CONFIGURATION_REPORT.md](OTP_RUNTIME_CONFIGURATION_REPORT.md), [OTP_FINAL_AUDIT.md](OTP_FINAL_AUDIT.md)  
> **Method:** CodeGraph call-chain audit + config review  
> **Goal:** Enable real email OTP in Development via existing `SmtpEmailService`  
> **Constraint:** No OTP architecture changes; SMS stays `MockSmsService`

---

## CodeGraph Audit (Phase 1)

### Email OTP delivery chain

```
AuthService (Register / SendEmailVerification / SendForgotPasswordOtp)
  → IOtpService.GenerateAndSendEmailAsync | GenerateAndSendAsync
    → OtpService.CreateEmailOtpAsync → OtpVerifications table
    → IEmailService.SendOtpEmailAsync
      → LoggingEmailService  (when Email:Provider ≠ Smtp)
      → SmtpEmailService     (when Email:Provider = Smtp)
```

CodeGraph: `callees OtpService.GenerateAndSendEmailAsync` → `SendOtpEmailAsync` on `IEmailService`.

### Components verified

| Component | Path | Status | Change needed |
|-----------|------|--------|---------------|
| `OtpService` | `Application/Auth/OtpService.cs` | Complete | None |
| `OtpVerification` | `Domain/Entities/OtpVerification.cs` | Complete | None |
| `AuthService` | `Application/Auth/AuthService.cs` | Complete | None |
| Auth APIs | `API/Controllers/AuthController.cs` | Complete | None |
| `IEmailService` | `Application/Abstractions/IEmailService.cs` | Single method | None |
| `SmtpEmailService` | `Infrastructure/Email/SmtpEmailService.cs` | SMTP via `SmtpClient` | None |
| `LoggingEmailService` | `Infrastructure/Email/LoggingEmailService.cs` | Fallback | Keep for `Provider=Logging` |
| `EmailSettings` | `Infrastructure/Email/EmailSettings.cs` | `Provider` + `Smtp` | None |
| DI registration | `Infrastructure/DependencyInjection.cs:82-90` | Provider switch | None |
| `MockSmsService` | `Infrastructure/Sms/MockSmsService.cs` | Always registered | None |

### Current Development gap

| Setting | Before | After (this change) |
|---------|--------|---------------------|
| `Email:Provider` | `Logging` | `Smtp` |
| `Email:Smtp` | Missing in Development | Full structure; credentials via env / user secrets / local file |
| Real inbox delivery | No | Yes (when SMTP credentials configured) |
| SMS | `MockSmsService` | Unchanged |

---

## What changes (config only)

| File | Change |
|------|--------|
| `appsettings.Development.json` | `Email:Provider = Smtp`; add `Email:Smtp` block (no secrets) |
| `appsettings.Development.Local.json.example` | Copy-paste template for Gmail / Brevo / Mailtrap |
| `Program.cs` | Optional load `appsettings.Development.Local.json` |
| `SEHub.API.csproj` | `UserSecretsId` for `dotnet user-secrets` |
| `.gitignore` | Ignore `appsettings.Development.Local.json` |

**No changes to:** `OtpService`, `OtpVerification`, EF migrations, `AuthController`, `ISmsService` registration.

---

## Provider support (configuration matrix)

| Provider | SMTP Host | Port | SSL | Username |
|----------|-----------|------|-----|----------|
| Gmail | `smtp.gmail.com` | 587 | true | Gmail address |
| Gmail password | — | — | — | App Password (not account password) |
| Brevo | `smtp-relay.brevo.com` | 587 | true | Brevo SMTP login |
| Mailtrap | `sandbox.smtp.mailtrap.io` | 587 or 2525 | true | Mailtrap inbox user |

All values bound via `Email:Smtp` → `IOptions<EmailSettings>` → `SmtpEmailService`.

---

## Credential injection (no hardcoding)

Priority order (ASP.NET Core configuration):

1. Environment variables — `Email__Smtp__Host`, `Email__Smtp__Password`, etc.
2. User secrets — `dotnet user-secrets set "Email:Smtp:Password" "..."`  
3. `appsettings.Development.Local.json` (gitignored, optional)

---

## Rollback

Set `Email:Provider` to `Logging` in `appsettings.Development.json` (or local override) — no code deploy required.

---

## Deliverables

| # | Deliverable |
|---|-------------|
| 1 | `EMAIL_OTP_ENABLE_PLAN.md` (this file) |
| 2 | Config changes (Development SMTP + local secrets support) |
| 3 | `EMAIL_CONFIGURATION_GUIDE.md` |
| 4 | `EMAIL_OTP_VERIFICATION.md` |
| 5 | Build verification report |
