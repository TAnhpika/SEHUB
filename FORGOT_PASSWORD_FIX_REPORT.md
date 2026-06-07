# Forgot Password — Fix Report

## Root Cause Summary

| # | Cause | Impact |
|---|-------|--------|
| 1 | Identity password policy failure thrown as `InvalidOperationException` → HTTP 500 | User sees system error; password not updated |
| 2 | OTP marked used before password update | Retry fails with OTP invalid; feels like fast expiry |
| 3 | Validator/FE weaker than Identity policy | Users pass client checks but fail server reset |

## Files Modified

### Backend

| File | Change |
|------|--------|
| `SEHub.Application/Auth/AuthService.cs` | Reset flow: verify OTP (`markUsed: false`) → update password → consume OTP |
| `SEHub.Application/Auth/IOtpService.cs` | Added `ConsumeLatestEmailOtpAsync` |
| `SEHub.Application/Auth/OtpService.cs` | Implemented `ConsumeLatestEmailOtpAsync` |
| `SEHub.Application/Auth/Validators/ResetPasswordRequestValidator.cs` | Identity-aligned password rules |
| `SEHub.Infrastructure/Persistence/Repositories/UserRepository.cs` | `DomainException` on password reset failure |
| `SEHub.API/appsettings.Development.json` | Explicit `Otp:ExpiryMinutes: 10` |

### Frontend

| File | Change |
|------|--------|
| `fe/src/features/auth/ForgotPasswordPage/ForgotPasswordPage.jsx` | Password validation matches Identity policy |

### Tests

| File | Change |
|------|--------|
| `tests/SEHub.API.IntegrationTests/Auth/ForgotPasswordEndpointsTests.cs` | **New** — 8 integration tests |
| `tests/SEHub.API.IntegrationTests/Auth/CapturingEmailService.cs` | **New** — captures OTP in tests |
| `tests/SEHub.API.IntegrationTests/CustomWebApplicationFactory.cs` | Email capture + OTP config |
| `tests/SEHub.Application.UnitTests/Auth/AuthServiceTests.cs` | 2 unit tests for `ResetPasswordAsync` |

## OTP Expiration

| Setting | Before | After |
|---------|--------|-------|
| `OtpSettings.ExpiryMinutes` default | 10 min | 10 min (unchanged) |
| `appsettings.json` | 10 min | 10 min (unchanged) |
| `appsettings.Development.json` | inherited | **10 min (explicit)** |
| Forgot Password OTP | 10 min | 10 min |
| Email Verification OTP | 10 min | 10 min |

Both OTP purposes use `OtpService.CreateEmailOtpAsync` → `ExpiresAt = UtcNow.AddMinutes(_settings.ExpiryMinutes)`.

**Unchanged:** `ResendCooldownSeconds: 60`, `MaxAttempts: 5`, `MaxRequestsPerHour: 5`

## Test Results

### `dotnet build`

```
Build succeeded.
    0 Error(s)
```

### `dotnet test`

| Project | Result |
|---------|--------|
| `SEHub.Application.UnitTests` | **PASS** — 17/17 |
| `SEHub.API.IntegrationTests` | **PASS** — 17/17 |

### Forgot Password Test Coverage

| Test | Result |
|------|--------|
| Full flow: forgot → verify → reset → login | PASS |
| Verify OTP (valid) | PASS |
| Reset password (valid OTP) | PASS |
| Expired OTP | PASS |
| Invalid OTP | PASS |
| Reused OTP | PASS |
| Weak password → 400 (not 500) | PASS |
| Weak password does not consume OTP | PASS |

## Swagger Manual Test Steps

Base URL: `http://localhost:5006` (or your API port)

### 1. Request OTP

```
POST /api/v1/auth/forgot-password
{
  "email": "demo.student@sehub.local"
}
```

Expected: `200` — `{ "message": "OTP sent" }`  
Check console/logs for `[OTP] Code: XXXXXX` (Logging email provider).

### 2. Verify OTP

```
POST /api/v1/auth/verify-otp
{
  "email": "demo.student@sehub.local",
  "code": "123456"
}
```

Expected: `200` — `{ "message": "OTP verified" }`

### 3. Reset Password

```
POST /api/v1/auth/reset-password
{
  "email": "demo.student@sehub.local",
  "code": "123456",
  "newPassword": "NewPass1!"
}
```

Expected: `200` — `{ "message": "Password reset successful" }`  
Password must include: uppercase, lowercase, digit, special character, min 8 chars.

### 4. Login with New Password

```
POST /api/v1/auth/login
{
  "emailOrUsername": "demo.student@sehub.local",
  "password": "NewPass1!"
}
```

Expected: `200` with `accessToken` and `refreshToken`.

### Negative Cases

| Case | Endpoint | Expected |
|------|----------|----------|
| Weak password `password1` | reset-password | `400` validation error (not 500) |
| Wrong OTP | verify-otp | `400` OTP invalid |
| Expired OTP (>10 min) | reset-password | `400` OTP invalid |
| Reused OTP | reset-password (2nd time) | `400` OTP invalid |
