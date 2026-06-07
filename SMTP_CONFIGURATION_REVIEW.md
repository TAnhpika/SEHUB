# SEHub — SMTP Configuration Review

> **Date:** 2026-06-06  
> **Method:** CodeGraph + config source review  
> **Sources:** [EMAIL_SMTP_AUDIT.md](EMAIL_SMTP_AUDIT.md), [EMAIL_SMTP_SETUP_GUIDE.md](EMAIL_SMTP_SETUP_GUIDE.md)

---

## Required Configuration Keys

When `Email:Provider` = `Smtp`:

| Key | Required | Validated at startup | Used by `SmtpEmailService` |
|-----|----------|----------------------|----------------------------|
| `Email:Provider` | Yes | — | DI switch |
| `Email:Smtp:Host` | Yes | Warning if empty | `SmtpClient` host |
| `Email:Smtp:Port` | Yes | Warning if ≤ 0 | `SmtpClient` port |
| `Email:Smtp:Username` | Yes | Warning if empty | `NetworkCredential` |
| `Email:Smtp:Password` | Yes | Warning if empty | `NetworkCredential` |
| `Email:Smtp:From` | Recommended | — | `MailMessage.From` |
| `Email:Smtp:FromDisplayName` | Optional | — | Display name |
| `Email:Smtp:EnableSsl` | Recommended | — | `SmtpClient.EnableSsl` |

Environment variable equivalents: `Email__Smtp__Host`, `Email__Smtp__Password`, etc.

---

## Binding & Registration

### EmailSettings binding

```78:78:SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
```

Model: `SEHub.Backend/src/SEHub.Infrastructure/Email/EmailSettings.cs`

### IEmailService registration

```82:90:SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs
        if (emailProvider.Equals("Smtp", StringComparison.OrdinalIgnoreCase))
            services.AddScoped<IEmailService, SmtpEmailService>();
        else
            services.AddScoped<IEmailService, LoggingEmailService>();
```

### ISmsService (unchanged)

```92:92:SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs
        services.AddScoped<ISmsService, MockSmsService>();
```

---

## appsettings Loading Order

| # | Source | File / mechanism | Development effect |
|---|--------|------------------|-------------------|
| 1 | Base | `appsettings.json` | `Email:Provider = Logging` (overridden) |
| 2 | Environment | `appsettings.Development.json` | `Email:Provider = Smtp`, empty SMTP |
| 3 | Local override | `appsettings.Development.Local.json` | **Highest file priority** — placeholders or real creds |
| 4 | User secrets | `UserSecretsId: sehub-api-development` | Overrides file values |
| 5 | Environment vars | `Email__Smtp__*` | Overrides all above |

Loaded in `Program.cs`:

```10:13:SEHub.Backend/src/SEHub.API/Program.cs
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("appsettings.Development.Local.json", optional: true, reloadOnChange: true);
}
```

Startup validation (`EmailSmtpStartupValidator`) runs after build — warns if incomplete, **does not crash**.

---

## Local Config File

| File | Purpose | Git |
|------|---------|-----|
| `appsettings.Development.Local.json.example` | Template (empty/`REPLACE_ME`) | Committed |
| `appsettings.Development.Local.json` | Developer overrides | **Gitignored** |

Created with `REPLACE_ME` placeholders — replace before real email delivery.

---

## Example Values (do not commit real passwords)

### Mailtrap

```json
{
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "sandbox.smtp.mailtrap.io",
      "Port": 587,
      "Username": "<mailtrap-smtp-user>",
      "Password": "<mailtrap-smtp-password>",
      "From": "noreply@sehub.local",
      "FromDisplayName": "SEHub",
      "EnableSsl": true
    }
  }
}
```

### Gmail

```json
{
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "smtp.gmail.com",
      "Port": 587,
      "Username": "you@gmail.com",
      "Password": "<gmail-app-password>",
      "From": "you@gmail.com",
      "FromDisplayName": "SEHub",
      "EnableSsl": true
    }
  }
}
```

---

## OTP Email Path (CodeGraph)

```
OtpService.GenerateAndSendEmailAsync
  → IEmailService.SendOtpEmailAsync
    → SmtpEmailService.SendOtpEmailAsync
```

No architecture changes required for real delivery — configuration only.
