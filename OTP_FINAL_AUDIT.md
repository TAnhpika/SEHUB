# SEHub — OTP Final Audit

> **Date:** 2026-06-06  
> **Method:** CodeGraph (`codegraph sync` + call-chain queries) + source verification  
> **Index:** 448 files, 4,385+ nodes (post-sync: +38 changed files)  
> **Constraint:** Read-only audit — no code changes

---

## Executive Summary

| # | Requirement | Result |
|---|-------------|--------|
| 1 | Register auto-sends `EmailVerification` OTP | **PASS** |
| 2 | `EmailConfirmed` becomes `true` after `VerifyEmail` | **PASS** |
| 3 | Login blocked when `RequireConfirmedEmail=true` and unconfirmed | **PASS** |
| 4 | Forgot-password flow still works | **PASS** |
| 5 | `VerifyOtp` cannot verify expired OTP | **PASS** |
| 6 | `VerifyOtp` respects `MaxAttempts` | **PASS** |
| 7 | Resend OTP respects cooldown | **PASS** |
| 8 | SMS OTP uses same `OtpVerifications` table | **PASS** |
| 9 | OTP cannot be reused after successful verification | **PASS** |

**Overall: 9 / 9 PASS**

---

## CodeGraph Commands Used

```bash
codegraph sync
codegraph callees AuthService.RegisterAsync
codegraph callees AuthService.VerifyEmailAsync
codegraph callees AuthService.LoginAsync
codegraph callees AuthService.VerifyOtpAsync
codegraph callees AuthService.ResetPasswordAsync
codegraph callees AuthService.SendForgotPasswordOtpAsync
codegraph callees OtpService.VerifyAsync
codegraph callees OtpService.VerifyEmailAsync
codegraph callees OtpService.GenerateAndSendEmailAsync
codegraph callees OtpService.GenerateAndSendAsync
codegraph callees OtpService.GenerateAndSendSmsAsync
codegraph callees OtpService.CreatePhoneOtpAsync
codegraph callers AuthController.Register
codegraph callers AuthController.ForgotPassword
codegraph callers AuthController.VerifyOtp
codegraph callers AuthController.ResetPassword
codegraph callers AuthController.VerifyEmail
codegraph callers AuthController.SendSmsOtp
codegraph callers SendForgotPasswordOtpAsync
codegraph query EmailConfirmed
codegraph query IsUsed
codegraph query RequireConfirmedEmail
codegraph query OtpPurpose
```

---

## 1. Register automatically sends EmailVerification OTP

**Result: PASS**

### Evidence

| Layer | File | Method / Symbol |
|-------|------|-----------------|
| Route | `AuthController.cs` | `Register` → `POST /api/v1/auth/register` |
| Service | `AuthService.cs` | `RegisterAsync` |
| OTP | `IOtpService.cs` | `GenerateAndSendEmailAsync` |
| Purpose | `OtpPurpose.cs` | `EmailVerification` |

### Call chain (CodeGraph)

```
POST /api/v1/auth/register
  → AuthController.Register
    → AuthService.RegisterAsync
      → IUserRepository.CreateAsync
      → IUnitOfWork.SaveChangesAsync
      → IOtpService.GenerateAndSendEmailAsync   ← callee confirmed
        → OtpService.EnsureCanSendEmailAsync
        → OtpService.CreateEmailOtpAsync
        → IEmailService.SendOtpEmailAsync
```

### Source anchor

```159:159:SEHub.Backend/src/SEHub.Application/Auth/AuthService.cs
        await _otpService.GenerateAndSendEmailAsync(request.Email, OtpPurpose.EmailVerification, cancellationToken);
```

---

## 2. EmailConfirmed becomes true after VerifyEmail

**Result: PASS**

### Evidence

| Layer | File | Method |
|-------|------|--------|
| Route | `AuthController.cs` | `VerifyEmail` → `POST /api/v1/auth/verify-email` |
| Service | `AuthService.cs` | `VerifyEmailAsync` |
| OTP verify | `OtpService.cs` | `VerifyEmailAsync` (markUsed: true) |
| Persistence | `UserRepository.cs` | `ConfirmEmailAsync` |

### Call chain (CodeGraph)

```
POST /api/v1/auth/verify-email
  → AuthController.VerifyEmail
    → AuthService.VerifyEmailAsync
      → IOtpService.VerifyEmailAsync (OtpPurpose.EmailVerification, markUsed: true)
        → OtpService.VerifyInternalAsync
      → IUserRepository.GetByEmailAsync
      → IUserRepository.ConfirmEmailAsync
      → IUnitOfWork.SaveChangesAsync
```

### Source anchor

```45:50:SEHub.Backend/src/SEHub.Infrastructure/Persistence/Repositories/UserRepository.cs
    public async Task ConfirmEmailAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");
        user.EmailConfirmed = true;
        await _userManager.UpdateAsync(user);
```

```399:406:SEHub.Backend/src/SEHub.Application/Auth/AuthService.cs
        if (!user.EmailConfirmed)
        {
            await _userRepository.ConfirmEmailAsync(user.Id, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
```

---

## 3. Login blocked when RequireConfirmedEmail = true and EmailConfirmed = false

**Result: PASS**

### Evidence

| Layer | File | Symbol |
|-------|------|--------|
| Config | `AuthSettings.cs` | `RequireConfirmedEmail` |
| Config | `appsettings.Production.json` | `"RequireConfirmedEmail": true` |
| Service | `AuthService.cs` | `LoginAsync` gate |
| Error | `ErrorCodes.cs` | `EMAIL_NOT_CONFIRMED` |
| Middleware | `ExceptionHandlingMiddleware.cs` | Maps to HTTP 403 |

### Call chain

```
POST /api/v1/auth/login
  → AuthController.Login
    → AuthService.LoginAsync
      → IUserRepository.GetByEmailOrUsernameAsync
      → IUserRepository.ValidatePasswordAsync
      → [inline] _authSettings.RequireConfirmedEmail && !user.EmailConfirmed
          → throw ForbiddenException(EMAIL_NOT_CONFIRMED)
```

> CodeGraph `callees AuthService.LoginAsync` lists credential/ban checks but not inline guard branches — confirmed by source read.

### Source anchor

```189:194:SEHub.Backend/src/SEHub.Application/Auth/AuthService.cs
        if (_authSettings.RequireConfirmedEmail && !user.EmailConfirmed)
        {
            throw new ForbiddenException(ErrorCodes.EmailNotConfirmed);
        }
```

```14:16:SEHub.Backend/src/SEHub.API/appsettings.Production.json
  "Auth": {
    "RequireConfirmedEmail": true
  }
```

---

## 4. ForgotPassword flow still works

**Result: PASS**

### Evidence

All three original routes remain wired. `OtpPurpose.ForgotPassword` unchanged.

### Call chains (CodeGraph)

**Send OTP**
```
POST /api/v1/auth/forgot-password
  → AuthController.ForgotPassword
    → AuthService.SendForgotPasswordOtpAsync
      → IUserRepository.GetByEmailAsync
      → IOtpService.GenerateAndSendAsync
        → OtpService.GenerateAndSendEmailAsync (OtpPurpose.ForgotPassword)
          → IEmailService.SendOtpEmailAsync
```

**Verify OTP (pre-reset validation)**
```
POST /api/v1/auth/verify-otp
  → AuthController.VerifyOtp
    → AuthService.VerifyOtpAsync
      → IOtpService.VerifyAsync
        → OtpService.VerifyEmailAsync (ForgotPassword, markUsed: false)
```

**Reset password**
```
POST /api/v1/auth/reset-password
  → AuthController.ResetPassword
    → AuthService.ResetPasswordAsync
      → IOtpService.VerifyEmailAsync (ForgotPassword, markUsed: true)
      → IUserRepository.UpdatePasswordAsync
      → IRefreshTokenRepository.RevokeAllForUserAsync
```

### Source anchor

```69:71:SEHub.Backend/src/SEHub.Application/Auth/OtpService.cs
    public Task<string> GenerateAndSendAsync(string email, CancellationToken cancellationToken = default) =>
        GenerateAndSendEmailAsync(email, OtpPurpose.ForgotPassword, cancellationToken);
```

---

## 5. VerifyOtp cannot verify expired OTP

**Result: PASS**

Expiry enforced at **two layers**: repository query filter and verify logic.

### Call chain

```
AuthService.VerifyOtpAsync
  → OtpService.VerifyAsync
    → OtpService.VerifyEmailAsync (markUsed: false)
      → OtpService.VerifyInternalAsync
        → IOtpVerificationRepository.GetLatestByEmailAsync
```

### Repository filter (expired rows excluded)

```27:35:SEHub.Backend/src/SEHub.Infrastructure/Persistence/Repositories/OtpVerificationRepository.cs
    public Task<OtpVerification?> GetLatestByEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default) =>
        _context.OtpVerifications
            .Where(o => o.Email == email && o.Purpose == purpose && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
```

### Verify fallback (defense in depth)

```333:340:SEHub.Backend/src/SEHub.Application/Auth/OtpService.cs
        var otp = await getLatest();
        if (otp is null || otp.ExpiresAt < DateTime.UtcNow || otp.IsUsed)
        {
            return false;
        }
```

```285:292:SEHub.Backend/src/SEHub.Application/Auth/AuthService.cs
        var isValid = await _otpService.VerifyAsync(request.Email, request.Code, cancellationToken);
        if (!isValid)
        {
            throw new ForbiddenException(ErrorCodes.OtpInvalid);
        }
```

---

## 6. VerifyOtp respects MaxAttempts

**Result: PASS**

### Config

```7:8:SEHub.Backend/src/SEHub.Application/Auth/OtpSettings.cs
    public int ResendCooldownSeconds { get; set; } = 60;
    public int MaxAttempts { get; set; } = 5;
```

### Call chain

```
AuthService.VerifyOtpAsync
  → OtpService.VerifyAsync
    → OtpService.VerifyInternalAsync
      → otp.AttemptCount++
      → if (AttemptCount > MaxAttempts) → ForbiddenException(OTP_MAX_ATTEMPTS)
```

### Source anchor

```345:360:SEHub.Backend/src/SEHub.Application/Auth/OtpService.cs
        otp.AttemptCount++;
        if (otp.AttemptCount > _settings.MaxAttempts)
        {
            otp.IsUsed = true;
            otp.UpdatedAt = DateTime.UtcNow;
            await _otpRepository.UpdateAsync(otp, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw new ForbiddenException(ErrorCodes.OtpMaxAttempts);
        }
```

**Behavior:** Up to 5 failed attempts return `OTP_INVALID`; the 6th attempt throws `OTP_MAX_ATTEMPTS` and marks OTP `IsUsed`.

---

## 7. Resend OTP respects Cooldown

**Result: PASS**

Cooldown checked before every email/SMS send via `EnsureCanSendEmailAsync` / `EnsureCanSendPhoneAsync`.

### Call chain (email resend)

```
AuthService.SendEmailVerificationAsync / SendForgotPasswordOtpAsync / RegisterAsync
  → OtpService.GenerateAndSendEmailAsync
    → OtpService.EnsureCanSendEmailAsync
      → IOtpVerificationRepository.GetLatestCreatedAtByEmailAsync
      → if (latest + ResendCooldownSeconds > UtcNow) → ForbiddenException(OTP_COOLDOWN)
```

### Source anchor

```271:280:SEHub.Backend/src/SEHub.Application/Auth/OtpService.cs
        var latestCreatedAt = await _otpRepository.GetLatestCreatedAtByEmailAsync(email, purpose, cancellationToken);
        if (latestCreatedAt.HasValue &&
            latestCreatedAt.Value.AddSeconds(_settings.ResendCooldownSeconds) > DateTime.UtcNow)
        {
            throw new ForbiddenException(ErrorCodes.OtpCooldown);
        }
```

Default cooldown: **60 seconds** (`OtpSettings.ResendCooldownSeconds`).

---

## 8. SMS OTP uses same OtpVerification table

**Result: PASS**

No `SmsOtp` entity or table exists in codebase. SMS rows are `OtpVerification` records with `Phone` populated.

### Call chain (CodeGraph)

```
POST /api/v1/auth/send-sms-otp
  → AuthController.SendSmsOtp
    → AuthService.SendSmsOtpAsync
      → OtpService.GenerateAndSendSmsAsync (OtpPurpose.SmsVerification)
        → OtpService.CreatePhoneOtpAsync
          → IOtpVerificationRepository.AddAsync   ← same repository/table
          → IUnitOfWork.SaveChangesAsync
        → ISmsService.SendOtpSmsAsync
```

### Source anchor

```217:238:SEHub.Backend/src/SEHub.Application/Auth/OtpService.cs
        var otp = new OtpVerification
        {
            Id = Guid.NewGuid(),
            Email = string.Empty,
            Phone = phone,
            CodeHash = HashCode(code),
            ...
            Purpose = purpose,
        };
        await _otpRepository.AddAsync(otp, cancellationToken);
```

### Schema

Migration `20260606154936_AddOtpEnhancements` adds `Phone` column to `OtpVerifications` (not a new table).

---

## 9. OTP cannot be reused after successful verification

**Result: PASS**

### Mechanism

1. `IsUsed` property on `OtpVerification` (CodeGraph: `query IsUsed`)
2. Successful consuming flows pass `markUsed: true`
3. `GetLatestByEmailAsync` / `GetLatestByPhoneAsync` exclude `IsUsed` rows
4. `VerifyInternalAsync` rejects `otp.IsUsed`

### markUsed by flow

| Flow | markUsed | Consumes OTP? |
|------|----------|---------------|
| `verify-email` | `true` | Yes |
| `verify-sms-otp` | `true` | Yes |
| `reset-password` | `true` | Yes |
| `verify-otp` (forgot-password) | `false` | No — intentional; allows `reset-password` next |

### Call chain (consuming verify)

```
AuthService.VerifyEmailAsync / ResetPasswordAsync / VerifySmsOtpAsync
  → OtpService.VerifyEmailAsync / VerifySmsAsync (markUsed: true)
    → OtpService.VerifyInternalAsync
      → if (isValid && markUsed) otp.IsUsed = true
      → IOtpVerificationRepository.UpdateAsync
```

### Source anchor

```367:373:SEHub.Backend/src/SEHub.Application/Auth/OtpService.cs
        var isValid = otp.CodeHash == HashCode(code);
        if (isValid && markUsed)
        {
            otp.IsUsed = true;
        }
```

**Note:** Forgot-password `verify-otp` deliberately does **not** consume the OTP so the same code can be used in `reset-password`. After `reset-password` succeeds, the OTP is marked `IsUsed` and cannot be reused.

---

## Architecture Compliance

| Constraint | Status |
|------------|--------|
| Single `OtpService` | Confirmed — no parallel OTP service |
| Single `OtpVerifications` table | Confirmed — email + SMS + forgot-password |
| No `SmsOtp` table | Confirmed — grep finds no `SmsOtp` entity |
| Forgot-password routes preserved | Confirmed — 3 original endpoints intact |
| `NoOpEmailService` replaced in DI | `LoggingEmailService` / `SmtpEmailService` via `Email:Provider` |

---

## Gaps (Non-blocking)

| Item | Detail |
|------|--------|
| Automated tests | No dedicated unit/integration tests for OTP expiry, cooldown, or max-attempts (manual smoke only) |
| CodeGraph resolution | `UserRepository.ConfirmEmailAsync` callee resolved to wrong `UpdateAsync` symbol — source read used for confirmation |
| Frontend | `ForgotPasswordPage.jsx` still mock UI; backend flows verified only |

---

## Audit Conclusion

All nine verification criteria are **implemented and traceable** through CodeGraph call chains and source anchors. The OTP system extends the original architecture without duplication and preserves the forgot-password multi-step flow.
