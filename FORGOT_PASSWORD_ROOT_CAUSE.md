# Forgot Password — Root Cause Analysis

## Issue 1: Reset Password Fails (System Error)

### Symptom

1. User requests forgot-password OTP → success
2. User verifies OTP → success
3. User enters new password → API returns **"Đã xảy ra lỗi hệ thống"** (HTTP 500)
4. Password is **not** updated

### Exact Root Cause

**Two compounding defects** in the reset-password path:

#### Primary: ASP.NET Identity password policy rejection mapped to HTTP 500

| Layer | Finding |
|-------|---------|
| **Identity policy** | `DependencyInjection.cs` requires digit, lowercase, uppercase, non-alphanumeric, min length 8 |
| **API validator** | `ResetPasswordRequestValidator` only enforced min length 8 |
| **Frontend** | `ForgotPasswordPage.jsx` `isValidResetPassword()` only required length ≥ 8 + letter + digit |
| **Repository** | `UserRepository.UpdatePasswordAsync()` throws `InvalidOperationException` when `ResetPasswordAsync` fails |
| **Middleware** | `ExceptionHandlingMiddleware` maps unhandled exceptions → **500** + `"Đã xảy ra lỗi hệ thống"` |

When a user enters a password like `password1` (passes FE/validator, fails Identity), the API returns a generic system error instead of a validation message.

**File locations:**

- `SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs` (lines 42–46) — Identity password rules
- `SEHub.Backend/src/SEHub.Application/Auth/Validators/ResetPasswordRequestValidator.cs` — insufficient rules
- `SEHub.Backend/src/SEHub.Infrastructure/Persistence/Repositories/UserRepository.cs` (lines 125–134) — `InvalidOperationException`
- `SEHub.Backend/src/SEHub.API/Middleware/ExceptionHandlingMiddleware.cs` (lines 92–95) — 500 mapping
- `fe/src/features/auth/ForgotPasswordPage/ForgotPasswordPage.jsx` — weak client validation

#### Secondary: OTP consumed before password update succeeds

`AuthService.ResetPasswordAsync()` called `VerifyEmailAsync(..., markUsed: true)` **before** `UpdatePasswordAsync()`.

Flow on password failure:

1. OTP verified and marked `IsUsed = true` (saved to DB)
2. `UpdatePasswordAsync` throws → password unchanged
3. User retries with same OTP → `GetLatestByEmailAsync` excludes used OTP → **OTP_INVALID**

This made OTP appear to "expire immediately" after a failed reset attempt.

**File location:**

- `SEHub.Backend/src/SEHub.Application/Auth/AuthService.cs` — `ResetPasswordAsync()` (OTP verify with `markUsed: true` before password update)

### Fix Strategy

1. **Verify OTP without consuming** (`markUsed: false`), update password, then **consume OTP only after success** via `ConsumeLatestEmailOtpAsync`.
2. **Map Identity failures** to `DomainException` (HTTP 400) instead of `InvalidOperationException` (HTTP 500).
3. **Align `ResetPasswordRequestValidator`** with Identity password policy.
4. **Align frontend** `isValidResetPassword()` with the same rules.

---

## Issue 2: OTP Expires Too Fast

### Symptom

OTP becomes invalid sooner than expected.

### Analysis

| Source | `ExpiryMinutes` value |
|--------|----------------------|
| `OtpSettings.cs` default | 10 |
| `appsettings.json` | 10 |
| `appsettings.Development.json` (before fix) | **missing** — inherited 10 from base |
| `OtpService.CreateEmailOtpAsync` | `UtcNow.AddMinutes(_settings.ExpiryMinutes)` |

Configuration was already **10 minutes** in code and base config. The perceived "fast expiry" was primarily caused by **Issue 1 secondary defect**: OTP burned on failed reset, so retry within the 10-minute window still failed.

### Fix Strategy

1. Add explicit `Otp:ExpiryMinutes: 10` to `appsettings.Development.json` for clarity.
2. Add explicit `Otp:ExpiryMinutes: 10` to integration test factory config.
3. Fix OTP consume order (Issue 1) so failed password attempts do not invalidate the OTP.

Cooldown (`ResendCooldownSeconds`), max attempts (`MaxAttempts`), and rate limiting (`MaxRequestsPerHour`) remain unchanged in production config.
