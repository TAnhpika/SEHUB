# SEHub — Email SMTP Configuration Audit

> **Date:** 2026-06-06  
> **Method:** CodeGraph + source/config review  
> **Sources:** [EMAIL_CONFIGURATION_GUIDE.md](EMAIL_CONFIGURATION_GUIDE.md), [EMAIL_OTP_VERIFICATION.md](EMAIL_OTP_VERIFICATION.md), [OTP_RUNTIME_CONFIGURATION_REPORT.md](OTP_RUNTIME_CONFIGURATION_REPORT.md)

---

## CodeGraph Summary

| Query | Finding |
|-------|---------|
| `OtpService.GenerateAndSendEmailAsync` | → `IEmailService.SendOtpEmailAsync` |
| `SmtpEmailService` | Implements `SendOtpEmailAsync` via `SmtpClient` |
| `MockSmsService` | Only `ISmsService` implementation |
| `EmailSettings` | Bound in `DependencyInjection.cs:78` |
| `DependencyInjection.AddInfrastructure` | Provider switch lines 82–90 |

---

## Current Configuration Source

### Registration (`Infrastructure/DependencyInjection.cs`)

```82:92:SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs
        var emailProvider = configuration.GetSection($"{EmailSettings.SectionName}:Provider").Get<string>() ?? "Logging";
        if (emailProvider.Equals("Smtp", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<IEmailService, SmtpEmailService>();
        }
        else
        {
            services.AddScoped<IEmailService, LoggingEmailService>();
        }

        services.AddScoped<ISmsService, MockSmsService>();
```

| Service | Development | Production |
|---------|-------------|------------|
| `IEmailService` | `SmtpEmailService` | `SmtpEmailService` |
| `ISmsService` | `MockSmsService` | `MockSmsService` |

### Settings binding

```78:80:SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.Configure<OtpSettings>(configuration.GetSection(OtpSettings.SectionName));
        services.Configure<AuthSettings>(configuration.GetSection(AuthSettings.SectionName));
```

Model: `Infrastructure/Email/EmailSettings.cs` — `Provider`, `Smtp` (Host, Port, Username, Password, From, EnableSsl).

### appsettings hierarchy

| Order | File | Email section |
|-------|------|---------------|
| 1 | `appsettings.json` | `Provider: Logging` (base fallback) |
| 2 | `appsettings.Development.json` | `Provider: Smtp`, empty SMTP fields |
| 3 | `appsettings.Production.json` | `Provider: Smtp`, empty SMTP fields |
| 4 | `appsettings.Development.Local.json` | Optional, gitignored (dev secrets) |
| 5 | User secrets (`UserSecretsId`) | Development override |
| 6 | Environment variables | `Email__Smtp__*` |

Loaded in `Program.cs`:

```9:12:SEHub.Backend/src/SEHub.API/Program.cs
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("appsettings.Development.Local.json", optional: true, reloadOnChange: true);
}
```

---

## OTP Email Flow (unchanged)

```
AuthService → OtpService.GenerateAndSendEmailAsync
  → CreateEmailOtpAsync (OtpVerifications table)
  → IEmailService.SendOtpEmailAsync
    → SmtpEmailService (Provider=Smtp)
```

No changes to `OtpService`, `OtpVerification`, or Auth APIs required.

---

## Required Changes (this task)

| # | Change | Status |
|---|--------|--------|
| 1 | Development `Email:Provider = Smtp` | Already done |
| 2 | `appsettings.Development.Local.json.example` (placeholders) | Updated |
| 3 | Gitignore local credentials file | Already done |
| 4 | `UserSecretsId` in csproj | Already done |
| 5 | Startup SMTP validation (warn only) | **Added** — `EmailSmtpStartupValidator` |
| 6 | Setup documentation | `EMAIL_SMTP_SETUP_GUIDE.md` |

**Not required:** New email services, OTP schema changes, Auth API changes, SMS providers.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Empty SMTP credentials at startup | Medium | Startup validator logs warning; app still runs |
| OTP send fails at runtime | Medium | `SmtpEmailService` throws if Host empty on send — configure before testing |
| Credentials committed to git | High | `.gitignore` on `*.Local.json`; example uses empty placeholders |
| Gmail daily limits / blocking | Low | Document App Password requirement |
| SMS accidentally switched to real provider | None | `MockSmsService` hard-registered; no env switch |
| OTP logic regression | Low | No `OtpService` / schema / API changes |

---

## Rollback

Set `Email:Provider` to `Logging` in local config → instant fallback to console OTP without code deploy.
