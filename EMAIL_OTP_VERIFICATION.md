# SEHub — Email OTP Verification Report

> **Date:** 2026-06-06  
> **Change:** Development `Email:Provider` switched to `Smtp`; credentials via local file / user secrets / env  
> **Architecture:** Unchanged — `OtpService`, `OtpVerification`, `AuthService`, existing APIs

---

## Verification Matrix

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | Send Email Verification OTP | **PASS** (config) / **MANUAL** (inbox) | `Email:Provider=Smtp` in Development; `SmtpEmailService` registered when Provider=Smtp |
| 2 | Receive OTP in inbox | **MANUAL** | Requires developer SMTP credentials (Mailtrap/Gmail/Brevo) — see [EMAIL_CONFIGURATION_GUIDE.md](EMAIL_CONFIGURATION_GUIDE.md) |
| 3 | Verify OTP | **PASS** | `AuthService.VerifyEmailAsync` unchanged; prior smoke test succeeded |
| 4 | Forgot Password OTP | **PASS** (config) / **MANUAL** (inbox) | Same `SmtpEmailService` path via `GenerateAndSendAsync` |
| 5 | Existing OTP flow unchanged | **PASS** | No changes to `OtpService`, `AuthController`, or OTP APIs |
| 6 | Existing database unchanged | **PASS** | No migrations; `OtpVerifications` schema untouched |

---

## 1. Send Email Verification OTP

**Result: PASS (configuration wiring)**

Development now registers `SmtpEmailService`:

```26:36:SEHub.Backend/src/SEHub.API/appsettings.Development.json
  "Email": {
    "Provider": "Smtp",
    "Smtp": {
      "Host": "",
      "Port": 587,
      ...
    }
  },
```

DI switch (unchanged logic):

```82:90:SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs
        if (emailProvider.Equals("Smtp", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<IEmailService, SmtpEmailService>();
        }
```

**Manual step:** Set `Email:Smtp:Host` + credentials before send succeeds.

---

## 2. Receive OTP in inbox

**Result: MANUAL — pending developer credentials**

Automated CI cannot send real email without secrets. After configuring Mailtrap (recommended):

```powershell
Copy-Item appsettings.Development.Local.json.example appsettings.Development.Local.json
# Fill Mailtrap username/password
dotnet run --project src/SEHub.API
```

```http
POST /api/v1/auth/send-email-verification
{ "email": "your-test@example.com" }
```

Expected: OTP email in Mailtrap inbox with subject `SEHub - Ma xac thuc OTP`.

---

## 3. Verify OTP

**Result: PASS**

Verification flow unchanged:

```
POST /api/v1/auth/verify-email
{ "email": "...", "code": "123456" }
  → AuthService.VerifyEmailAsync
    → OtpService.VerifyEmailAsync (markUsed: true)
    → UserRepository.ConfirmEmailAsync
```

Prior session smoke test: verify-email returned `success: true`.

---

## 4. Forgot Password OTP

**Result: PASS (configuration) / MANUAL (inbox)**

Chain unchanged:

```
POST /api/v1/auth/forgot-password
  → OtpService.GenerateAndSendAsync
    → SmtpEmailService.SendOtpEmailAsync (when Provider=Smtp)
```

Same SMTP config as email verification.

---

## 5. Existing OTP flow unchanged

**Result: PASS**

| Area | Changed? |
|------|----------|
| `OtpService.cs` | No |
| `OtpVerification` entity | No |
| `AuthController` routes | No |
| `AuthService` OTP methods | No |
| `IOtpService` interface | No |
| SMS `MockSmsService` | No — still line 92 in DI |
| OTP rate limits / `IsUsed` | No |

Only configuration and dev bootstrap files changed.

---

## 6. Existing database unchanged

**Result: PASS**

- No new EF migrations
- `OtpVerifications` table schema identical
- No new tables

---

## SMS verification (out of scope, confirmed unchanged)

```powershell
POST /api/v1/auth/send-sms-otp
```

Still logs to console via `MockSmsService` — not affected by email SMTP change.

---

## Build verification

See [EMAIL_OTP_BUILD_REPORT.md](EMAIL_OTP_BUILD_REPORT.md).

---

## Manual inbox test checklist

After configuring SMTP per [EMAIL_CONFIGURATION_GUIDE.md](EMAIL_CONFIGURATION_GUIDE.md):

- [ ] `POST /api/v1/auth/register` → email received
- [ ] `POST /api/v1/auth/verify-email` → `EmailConfirmed = true`
- [ ] `POST /api/v1/auth/forgot-password` → email received
- [ ] `POST /api/v1/auth/verify-otp` → 200
- [ ] `POST /api/v1/auth/reset-password` → 200
- [ ] `POST /api/v1/auth/send-sms-otp` → code in console only (not email)

---

## Rollback verification

Set `"Provider": "Logging"` in local config → OTP returns to console/logger without code deploy.
