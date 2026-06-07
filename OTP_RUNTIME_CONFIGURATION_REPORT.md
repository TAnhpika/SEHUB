# SEHub — OTP Runtime Notification Configuration Report

> **Date:** 2026-06-06  
> **Method:** CodeGraph symbol audit + source/config read  
> **Scope:** `IEmailService` / `ISmsService` registration and runtime delivery behavior  
> **Constraint:** Read-only audit — no code changes

---

## Direct Answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Which `IEmailService` is registered in **Development**? | **`LoggingEmailService`** |
| 2 | Which `IEmailService` is registered in **Production**? | **`SmtpEmailService`** |
| 3 | Which `ISmsService` is registered in **Development**? | **`MockSmsService`** |
| 4 | Which `ISmsService` is registered in **Production**? | **`MockSmsService`** (same — no env switch) |
| 5 | Does Email OTP send **real emails**? | **Development: No.** **Production: Yes, when `Email:Smtp:Host` is configured** (committed prod config has empty `Host` → send would throw until overridden) |
| 6 | If yes — provider & SMTP source? | **`SmtpEmailService`** via `System.Net.Mail.SmtpClient`; settings from **`Email:Smtp`** bound to `IOptions<EmailSettings>` |
| 7 | Does SMS OTP send **real SMS**? | **No** |
| 8 | If no — mock service & log location? | **`MockSmsService`**; OTP logged to **`Console.WriteLine`** and **`ILogger.LogInformation`** |

---

## Registration Entry Point

`Program.cs` does not register notification services directly. It delegates to Infrastructure DI:

```7:11:SEHub.Backend/src/SEHub.API/Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiServices(builder.Configuration);
```

**Development launch profile** sets `ASPNETCORE_ENVIRONMENT=Development`:

```18:20:SEHub.Backend/src/SEHub.API/Properties/launchSettings.json
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
```

ASP.NET Core loads config in order: `appsettings.json` → `appsettings.{Environment}.json` → environment variables.

---

## IEmailService Registration Logic

**File:** `SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs`

```78:90:SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.Configure<OtpSettings>(configuration.GetSection(OtpSettings.SectionName));
        services.Configure<AuthSettings>(configuration.GetSection(AuthSettings.SectionName));

        var emailProvider = configuration.GetSection($"{EmailSettings.SectionName}:Provider").Get<string>() ?? "Logging";
        if (emailProvider.Equals("Smtp", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<IEmailService, SmtpEmailService>();
        }
        else
        {
            services.AddScoped<IEmailService, LoggingEmailService>();
        }
```

| Environment | Effective `Email:Provider` | Registered implementation |
|-------------|---------------------------|---------------------------|
| **Development** | `Logging` | `LoggingEmailService` (line 89) |
| **Production** | `Smtp` | `SmtpEmailService` (line 85) |
| Any other / missing key | defaults to `Logging` | `LoggingEmailService` |

**`NoOpEmailService` is NOT registered.** The class still exists on disk but has no DI binding (grep shows registration only in `DependencyInjection.cs` above).

---

## ISmsService Registration Logic

**File:** `SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs`

```92:92:SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs
        services.AddScoped<ISmsService, MockSmsService>();
```

| Environment | Registered implementation |
|-------------|---------------------------|
| **Development** | `MockSmsService` |
| **Production** | `MockSmsService` |
| **Testing** (integration tests) | `MockSmsService` (no override in `CustomWebApplicationFactory`) |

There is **no** `ISmsService` production implementation in the codebase (CodeGraph: only `MockSmsService`).

---

## Configuration Sources

### Base — `appsettings.json`

```29:31:SEHub.Backend/src/SEHub.API/appsettings.json
  "Email": {
    "Provider": "Logging"
  },
```

### Development — `appsettings.Development.json`

```26:28:SEHub.Backend/src/SEHub.API/appsettings.Development.json
  "Email": {
    "Provider": "Logging"
  },
```

**Effective Development config:** `Email:Provider = "Logging"` → **`LoggingEmailService`**

### Production — `appsettings.Production.json`

```2:12:SEHub.Backend/src/SEHub.API/appsettings.Production.json
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "",
      "Port": 587,
      "Username": "",
      "Password": "",
      "From": "noreply@sehub.app",
      "FromDisplayName": "SEHub",
      "EnableSsl": true
    }
  },
```

**Effective Production config:** `Email:Provider = "Smtp"` → **`SmtpEmailService`**

> **Runtime caveat:** Committed `Email:Smtp:Host` is empty. `SmtpEmailService` throws at send time unless `Host` (and credentials) are supplied via environment variables, user secrets, or deployment config.

### Settings model

```3:20:SEHub.Backend/src/SEHub.Infrastructure/Email/EmailSettings.cs
public sealed class EmailSettings
{
    public const string SectionName = "Email";
    public string Provider { get; set; } = "Logging";
    public SmtpSettings Smtp { get; set; } = new();
}

public sealed class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    ...
}
```

---

## Implementation Details

### 1. `LoggingEmailService` (Development email)

**File:** `SEHub.Backend/src/SEHub.Infrastructure/Email/LoggingEmailService.cs`

```12:22:SEHub.Backend/src/SEHub.Infrastructure/Email/LoggingEmailService.cs
    public Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default)
    {
        var message = $"""
            [OTP]
            Email: {email}
            Code: {otpCode}
            """;

        Console.WriteLine(message);
        _logger.LogInformation("[OTP] Email: {Email}, Code: {Code}", email, otpCode);
        return Task.CompletedTask;
    }
```

- **Real email:** No
- **OTP visibility:** API process **console** + **application logger**

---

### 2. `SmtpEmailService` (Production email)

**File:** `SEHub.Backend/src/SEHub.Infrastructure/Email/SmtpEmailService.cs`

```20:46:SEHub.Backend/src/SEHub.Infrastructure/Email/SmtpEmailService.cs
    public async Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default)
    {
        var smtp = _settings.Smtp;
        if (string.IsNullOrWhiteSpace(smtp.Host))
        {
            throw new InvalidOperationException("Email:Smtp:Host is required when Email:Provider is Smtp.");
        }

        using var client = new SmtpClient(smtp.Host, smtp.Port)
        {
            EnableSsl = smtp.EnableSsl,
            Credentials = string.IsNullOrWhiteSpace(smtp.Username)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(smtp.Username, smtp.Password)
        };
        ...
        await client.SendMailAsync(message, cancellationToken);
        _logger.LogInformation("OTP email sent to {Email} via SMTP host {Host}", email, smtp.Host);
    }
```

- **Real email:** Yes (when `Host` configured)
- **Provider:** `System.Net.Mail.SmtpClient` (generic SMTP — compatible with Mailtrap, SendGrid SMTP relay, etc.)
- **Config source:** `IOptions<EmailSettings>` ← `configuration.GetSection("Email")` (line 78 in `DependencyInjection.cs`)
- **Credentials:** `Email:Smtp:Username` / `Email:Smtp:Password` (not hardcoded in source)

---

### 3. `NoOpEmailService` (legacy, unregistered)

**File:** `SEHub.Backend/src/SEHub.Infrastructure/Email/NoOpEmailService.cs`

```7:8:SEHub.Backend/src/SEHub.Infrastructure/Email/NoOpEmailService.cs
    public Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
```

**Status:** Dead code from DI perspective — not used at runtime.

---

### 4. `MockSmsService` (all environments)

**File:** `SEHub.Backend/src/SEHub.Infrastructure/Sms/MockSmsService.cs`

```12:22:SEHub.Backend/src/SEHub.Infrastructure/Sms/MockSmsService.cs
    public Task SendOtpSmsAsync(string phone, string otpCode, CancellationToken cancellationToken = default)
    {
        var message = $"""
            [SMS OTP]
            Phone: {phone}
            Code: {otpCode}
            """;

        Console.WriteLine(message);
        _logger.LogInformation("[SMS OTP] Phone: {Phone}, Code: {Code}", phone, otpCode);
        return Task.CompletedTask;
    }
```

- **Real SMS:** No
- **OTP visibility:** API process **console** + **application logger**

---

## OTP Delivery Call Chains (CodeGraph)

### Email OTP

```
OtpService.GenerateAndSendEmailAsync
  → IEmailService.SendOtpEmailAsync
    → LoggingEmailService (Development)
    → SmtpEmailService     (Production, Provider=Smtp)
```

### SMS OTP

```
OtpService.GenerateAndSendSmsAsync
  → ISmsService.SendOtpSmsAsync
    → MockSmsService (all environments)
```

---

## Environment Matrix

| Setting | Development | Production |
|---------|-------------|------------|
| `ASPNETCORE_ENVIRONMENT` | `Development` (launchSettings) | `Production` (deployment) |
| `Email:Provider` | `Logging` | `Smtp` |
| `IEmailService` impl | `LoggingEmailService` | `SmtpEmailService` |
| Email OTP delivered to | Console + logger | SMTP inbox (if Host set) |
| `ISmsService` impl | `MockSmsService` | `MockSmsService` |
| SMS OTP delivered to | Console + logger | Console + logger |
| Real email sent | **No** | **Yes** (when SMTP configured) |
| Real SMS sent | **No** | **No** |

---

## Interface Contracts

**Email** — `SEHub.Backend/src/SEHub.Application/Abstractions/IEmailService.cs`

```3:6:SEHub.Backend/src/SEHub.Application/Abstractions/IEmailService.cs
public interface IEmailService
{
    Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default);
}
```

**SMS** — `SEHub.Backend/src/SEHub.Application/Abstractions/ISmsService.cs`

```3:6:SEHub.Backend/src/SEHub.Application/Abstractions/ISmsService.cs
public interface ISmsService
{
    Task SendOtpSmsAsync(string phone, string otpCode, CancellationToken cancellationToken = default);
}
```

Single consumer: `OtpService` (`_emailService`, `_smsService` fields).

---

## Operational Notes

1. **Local dev (`dotnet run`)** — OTP codes appear in the terminal running the API, not in HTTP responses.
2. **Production email** — Requires deploying valid `Email:Smtp:Host` + credentials; empty committed values are placeholders.
3. **SMS production gap** — No Twilio/Vonage/other provider; `MockSmsService` is the only `ISmsService` implementation.
4. **Switching dev to real email** — Set `Email:Provider` to `Smtp` and populate `Email:Smtp` in `appsettings.Development.json` or environment variables (no code change needed).

---

## Audit Conclusion

Notification wiring is **environment-aware for email only**. Development uses **`LoggingEmailService`** (console/logger). Production registers **`SmtpEmailService`** for real SMTP delivery when configured. SMS is **`MockSmsService` in all environments** with console/logger output only.
