# SEHub — OTP Test Coverage Report

> **Date:** 2026-06-06  
> **Method:** CodeGraph symbol/query audit + test project inventory  
> **Scope:** Email verification, forgot-password, reset-password, expiration, cooldown, max attempts  
> **Constraint:** Read-only audit — no code changes

---

## Executive Summary

| Area | Status |
|------|--------|
| Email verification flow | **Missing** |
| Forgot password flow | **Missing** |
| Reset password flow | **Missing** |
| OTP expiration | **Missing** |
| OTP cooldown | **Missing** |
| OTP max attempts | **Missing** |

**OTP-specific automated tests: 0 / 6 areas covered**

Implementation is verified in [OTP_FINAL_AUDIT.md](OTP_FINAL_AUDIT.md) and manual smoke tests only. The test suite does not exercise OTP behavior.

---

## CodeGraph Findings

### Test symbols indexed

| Symbol | Location | OTP-related tests |
|--------|----------|-------------------|
| `AuthServiceTests` | `tests/SEHub.Application.UnitTests/Auth/AuthServiceTests.cs` | 2 tests — login only |
| `AuthEndpointsTests` | `tests/SEHub.API.IntegrationTests/Auth/AuthEndpointsTests.cs` | 1 test — login + me |
| `OtpServiceTests` | — | **Not found** |
| `OtpService` callers from tests | — | **No callers** |

### Production OTP symbols with zero test references

```
codegraph query OtpServiceTests     → No results
codegraph callers OtpService        → No callers (from test code)
codegraph query OtpCooldown         → ErrorCodes only (no tests)
codegraph query MaxAttempts         → OtpSettings property only (no tests)
```

### Existing auth test inventory

| File | Tests | OTP relevance |
|------|-------|---------------|
| `AuthServiceTests.cs` | `LoginAsync_WithInvalidPassword_ThrowsNotFoundException` | None |
| `AuthServiceTests.cs` | `LoginAsync_WhenUserIsBanned_ThrowsForbiddenException` | None |
| `AuthEndpointsTests.cs` | `Login_ThenGetMe_ReturnsAuthenticatedProfile` | None (seed user `EmailConfirmed=true`) |

### Partial infrastructure (not exercised)

| Asset | File | Notes |
|-------|------|-------|
| `Mock<IOtpService>` field | `AuthServiceTests.cs:21` | Declared; no `Setup` / `Verify` for OTP methods |
| `CustomWebApplicationFactory` | `CustomWebApplicationFactory.cs` | In-memory DB; seed user has `EmailConfirmed = true` (line 138) |
| FluentValidation validators | `*RequestValidator.cs` | Exist; **no validator unit tests** |

---

## Coverage Matrix

| # | Area | Covered | Partially Covered | Missing |
|---|------|---------|-------------------|---------|
| 1 | Email verification flow | — | Mock `IOtpService` exists | Register → send OTP, verify email, `EmailConfirmed` |
| 2 | Forgot password flow | — | — | `forgot-password`, `SendForgotPasswordOtpAsync` |
| 3 | Reset password flow | — | — | `verify-otp` → `reset-password`, password update |
| 4 | OTP expiration | — | — | Expired `ExpiresAt` rejection |
| 5 | OTP cooldown | — | — | `OTP_COOLDOWN` on resend within 60s |
| 6 | OTP max attempts | — | — | `OTP_MAX_ATTEMPTS` after 5 failures |

---

## Detailed Analysis

### 1. Email verification flow — **Missing**

**Production chain (CodeGraph):**
```
POST /api/v1/auth/register
  → AuthService.RegisterAsync
    → IOtpService.GenerateAndSendEmailAsync (OtpPurpose.EmailVerification)

POST /api/v1/auth/verify-email
  → AuthService.VerifyEmailAsync
    → IOtpService.VerifyEmailAsync (markUsed: true)
    → IUserRepository.ConfirmEmailAsync
```

**Tests found:** None.

**Partial:** `AuthServiceTests` injects `Mock<IOtpService>` but never asserts `GenerateAndSendEmailAsync` or `VerifyEmailAsync` calls.

**Gap:**
- No test that register triggers email OTP send
- No test that `VerifyEmailAsync` sets `EmailConfirmed = true`
- No test for `send-email-verification` endpoint
- No test for `EMAIL_NOT_CONFIRMED` login gate (`RequireConfirmedEmail = true`)

---

### 2. Forgot password flow — **Missing**

**Production chain (CodeGraph):**
```
POST /api/v1/auth/forgot-password
  → AuthService.SendForgotPasswordOtpAsync
    → IOtpService.GenerateAndSendAsync
      → OtpService.GenerateAndSendEmailAsync (OtpPurpose.ForgotPassword)
```

**Tests found:** None.

**Gap:**
- No test that existing user triggers OTP generation
- No test that unknown email returns 200 without sending (no enumeration)
- No integration test hitting `/api/v1/auth/forgot-password`

---

### 3. Reset password flow — **Missing**

**Production chain (CodeGraph):**
```
POST /api/v1/auth/verify-otp
  → AuthService.VerifyOtpAsync
    → IOtpService.VerifyAsync (markUsed: false)

POST /api/v1/auth/reset-password
  → AuthService.ResetPasswordAsync
    → IOtpService.VerifyEmailAsync (ForgotPassword, markUsed: true)
    → IUserRepository.UpdatePasswordAsync
    → IRefreshTokenRepository.RevokeAllForUserAsync
```

**Tests found:** None.

**Gap:**
- No test for valid verify-then-reset sequence
- No test that `reset-password` revokes refresh tokens
- No test that OTP is consumed (`IsUsed`) after reset

---

### 4. OTP expiration — **Missing**

**Production logic:**
- `OtpVerificationRepository.GetLatestByEmailAsync` — filters `ExpiresAt > UtcNow`
- `OtpService.VerifyInternalAsync` — returns `false` when `otp.ExpiresAt < DateTime.UtcNow`

**Tests found:** None. No `OtpServiceTests` class exists.

**Gap:** No unit test with a pre-seeded expired `OtpVerification` row; no integration test posting an expired code.

---

### 5. OTP cooldown — **Missing**

**Production logic:**
- `OtpService.EnsureCanSendEmailAsync` — compares `GetLatestCreatedAtByEmailAsync` + `ResendCooldownSeconds` (default 60)
- Throws `ForbiddenException(ErrorCodes.OtpCooldown)`

**Tests found:** None.

**Gap:** No test that second send within 60s throws/maps to HTTP 429.

---

### 6. OTP max attempts — **Missing**

**Production logic:**
- `OtpService.VerifyInternalAsync` — increments `AttemptCount`; when `> MaxAttempts` (5), sets `IsUsed = true` and throws `OTP_MAX_ATTEMPTS`

**Tests found:** None.

**Gap:** No test simulating 5 failed verify attempts then asserting 6th throws `OTP_MAX_ATTEMPTS`.

---

## Recommended Tests to Add

Priority order: **unit tests for `OtpService`** (isolated logic) → **unit tests for `AuthService`** (orchestration) → **integration tests** (end-to-end HTTP).

---

### A. New file: `tests/SEHub.Application.UnitTests/Auth/OtpServiceTests.cs`

Use in-memory `IOtpVerificationRepository` mock or fake; real `OtpService` with `IOptions<OtpSettings>`.

| # | Test name | Arrange | Assert |
|---|-----------|---------|--------|
| A1 | `VerifyAsync_WithExpiredOtp_ReturnsFalse` | Seed `OtpVerification` with `ExpiresAt = UtcNow - 1min`, `Purpose = ForgotPassword` | `VerifyAsync(email, code)` → `false` |
| A2 | `VerifyAsync_WithWrongCode_IncrementsAttemptCount` | Seed valid unexpired OTP | Wrong code → `false`; repository `UpdateAsync` called with `AttemptCount == 1` |
| A3 | `VerifyAsync_WhenAttemptCountExceedsMaxAttempts_ThrowsOtpMaxAttempts` | Seed OTP with `AttemptCount = 5` | Next verify → `ForbiddenException(OTP_MAX_ATTEMPTS)`; `IsUsed = true` |
| A4 | `VerifyEmailAsync_WithMarkUsedTrue_SetsIsUsedOnSuccess` | Seed valid OTP | Correct code + `markUsed: true` → `true`; entity `IsUsed = true` |
| A5 | `VerifyEmailAsync_AfterMarkedUsed_ReturnsFalse` | Seed OTP with `IsUsed = true` | Any code → `false` |
| A6 | `GenerateAndSendEmailAsync_WithinCooldown_ThrowsOtpCooldown` | `GetLatestCreatedAtByEmailAsync` returns `UtcNow - 30s`; `ResendCooldownSeconds = 60` | `ForbiddenException(OTP_COOLDOWN)` |
| A7 | `GenerateAndSendEmailAsync_AfterCooldown_Succeeds` | Latest created `UtcNow - 61s` | No exception; `AddAsync` called |
| A8 | `GenerateAndSendEmailAsync_WhenHourlyLimitExceeded_ThrowsOtpRateLimitExceeded` | `CountRequestsByEmailSinceAsync` returns `5` | `ForbiddenException(OTP_RATE_LIMIT_EXCEEDED)` |

---

### B. Extend: `tests/SEHub.Application.UnitTests/Auth/AuthServiceTests.cs`

| # | Test name | Setup | Assert |
|---|-----------|-------|--------|
| B1 | `RegisterAsync_CallsGenerateAndSendEmailAsync_WithEmailVerificationPurpose` | Mock repos for successful register | `_otpService.Verify(s => s.GenerateAndSendEmailAsync(email, OtpPurpose.EmailVerification, ct), Times.Once)` |
| B2 | `VerifyEmailAsync_WhenOtpValid_CallsConfirmEmailAsync` | `_otpService.VerifyEmailAsync` → `true`; user `EmailConfirmed = false` | `ConfirmEmailAsync(userId)` called once |
| B3 | `VerifyEmailAsync_WhenOtpInvalid_ThrowsOtpInvalid` | `_otpService.VerifyEmailAsync` → `false` | `ForbiddenException(OTP_INVALID)` |
| B4 | `SendForgotPasswordOtpAsync_WhenUserExists_CallsGenerateAndSendAsync` | `GetByEmailAsync` returns user | `GenerateAndSendAsync(email)` once |
| B5 | `SendForgotPasswordOtpAsync_WhenUserMissing_DoesNotSendOtp` | `GetByEmailAsync` → null | `GenerateAndSendAsync` never called |
| B6 | `VerifyOtpAsync_WhenOtpInvalid_ThrowsOtpInvalid` | `_otpService.VerifyAsync` → `false` | `ForbiddenException(OTP_INVALID)` |
| B7 | `ResetPasswordAsync_WhenOtpValid_UpdatesPasswordAndRevokesTokens` | `_otpService.VerifyEmailAsync` → `true` | `UpdatePasswordAsync` + `RevokeAllForUserAsync` called |
| B8 | `ResetPasswordAsync_WhenOtpInvalid_ThrowsOtpInvalid` | `_otpService.VerifyEmailAsync` → `false` | `ForbiddenException(OTP_INVALID)` |
| B9 | `LoginAsync_WhenRequireConfirmedEmailAndUnconfirmed_ThrowsEmailNotConfirmed` | `AuthSettings { RequireConfirmedEmail = true }`; user `EmailConfirmed = false` | `ForbiddenException(EMAIL_NOT_CONFIRMED)` |

---

### C. New file: `tests/SEHub.API.IntegrationTests/Auth/AuthOtpEndpointsTests.cs`

**Prerequisite:** Register a test `ICapturingEmailService` (or override `IEmailService`) in `CustomWebApplicationFactory` that stores the last OTP code in memory for assertions.

| # | Test name | Flow | Assert |
|---|-----------|------|--------|
| C1 | `Register_ThenVerifyEmail_SetsEmailConfirmed` | POST register → read captured OTP → POST verify-email | 200; DB user `EmailConfirmed == true` |
| C2 | `SendEmailVerification_ForUnconfirmedUser_Returns200` | Register (unconfirmed) → POST send-email-verification | 200; new OTP captured |
| C3 | `ForgotPassword_ThenVerifyOtp_ThenResetPassword_Succeeds` | Seed user → forgot-password → verify-otp → reset-password | 200 on each step; login with new password works |
| C4 | `VerifyOtp_WithExpiredCode_Returns400OtpInvalid` | Seed `OtpVerification` with past `ExpiresAt` → POST verify-otp | 400; `errors[0].code == OTP_INVALID` |
| C5 | `SendEmailVerification_WithinCooldown_Returns429OtpCooldown` | Two send requests within 60s | Second → 429; `OTP_COOLDOWN` |
| C6 | `VerifyOtp_AfterMaxAttempts_Returns403OtpMaxAttempts` | Seed OTP with `AttemptCount = 5` → POST verify-otp | 403; `OTP_MAX_ATTEMPTS` |
| C7 | `ResetPassword_AfterSuccess_CannotReuseOtp` | Complete reset flow → retry reset with same code | Second reset → 400 `OTP_INVALID` |

---

### D. Optional: `tests/SEHub.Application.UnitTests/Auth/OtpValidatorTests.cs`

| # | Test name | Target |
|---|-----------|--------|
| D1 | `VerifyEmailRequestValidator_RejectsNonSixDigitCode` | `VerifyEmailRequestValidator` |
| D2 | `SendSmsOtpRequestValidator_RejectsInvalidPhone` | `SendSmsOtpRequestValidator` |

---

## Suggested Implementation Order

```
1. OtpServiceTests (A1–A8)     ← highest ROI; covers expiration, cooldown, max attempts
2. AuthServiceTests (B1–B9)    ← orchestration without HTTP
3. Test email capture helper   ← enable integration OTP reads
4. AuthOtpEndpointsTests (C1–C7) ← full HTTP flows
5. Validator tests (D1–D2)   ← low priority; FluentValidation auto-runs on API
```

**Estimated new tests:** 8 unit (`OtpService`) + 9 unit (`AuthService`) + 7 integration + 2 validator = **26 tests**

---

## Test Project Gaps Summary

| Layer | Current | Needed for OTP |
|-------|---------|--------------|
| `OtpService` unit | 0 tests | 8 tests |
| `AuthService` OTP unit | 0 tests (mock unused) | 9 tests |
| Auth integration OTP | 0 tests | 7 tests |
| Validator unit | 0 tests | 2 tests (optional) |
| Test doubles | None for OTP capture | `ICapturingEmailService` or similar |

---

## Conclusion

OTP behavior is **fully implemented** but **entirely untested** in the automated suite. CodeGraph confirms no test class references `OtpService`, `VerifyEmail`, `ForgotPassword`, or OTP guard/error symbols. Existing auth tests cover only generic login paths with a pre-confirmed seed user.

Adding the 26 recommended tests above would bring all six audited areas from **Missing** to **Covered**.
