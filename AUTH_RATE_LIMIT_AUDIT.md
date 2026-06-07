# Auth Rate Limit Audit

> **Date:** 2026-06-06  
> **Method:** CodeGraph trace of `AuthController`, middleware, filters, `OtpService`, and infrastructure  
> **Scope:** HTTP-level and application-level protections on auth endpoints

---

## Executive Finding

**No ASP.NET Core Rate Limiter** is configured. There is no `AddRateLimiter`, `UseRateLimiter`, `AspNetCoreRateLimit`, or `[EnableRateLimiting]` anywhere in the solution.

OTP-related endpoints have **application-level** limits inside `OtpService` (per-email/phone, per-purpose). Login, register, and refresh have **no rate limiting** at any layer.

---

## Infrastructure Inventory

### Middleware (`Program.cs` pipeline)

| Order | Middleware | Auth relevance |
|-------|------------|----------------|
| 1 | `ExceptionHandlingMiddleware` | Maps `OTP_*` error codes to 403 responses |
| 2 | `UseCors` | CORS only |
| 3 | `UseAuthentication` | JWT validation |
| 4 | `BannedUserMiddleware` | Blocks banned users on authenticated requests |
| 5 | `UseAuthorization` | Policy checks |

**No rate-limiting middleware exists.**

### Filters

| Filter | Type | Auth relevance |
|--------|------|----------------|
| `ApiResponseWrapperFilter` | `IResultFilter` | Wraps responses in `ApiResponse<T>` envelope |
| FluentValidation auto-validation | MVC integration | Request body validation (not rate limiting) |

**No action filters for throttling.**

### Caching

| Component | Technology | Auth relevance |
|-----------|------------|----------------|
| `PremiumStatusService` | `IMemoryCache` | Caches premium status (3 min TTL) |
| `AddMemoryCache()` | Infrastructure DI | General-purpose; **not used for auth rate limits** |

**No distributed cache (Redis). No auth throttle counters in cache.**

### Packages (`SEHub.API.csproj`)

No rate-limiting NuGet packages installed. Built-in `Microsoft.AspNetCore.RateLimiting` is available on .NET 8 but **not registered**.

---

## Endpoint-by-Endpoint Analysis

### POST `/api/v1/auth/login`

| Layer | Protection | Details |
|-------|------------|---------|
| HTTP rate limit | ❌ None | Unlimited requests per IP |
| FluentValidation | ✅ | `LoginRequestValidator` (credentials format) |
| Application | ✅ | Invalid credentials → generic 404; ban check |
| Brute-force mitigation | ❌ None | No lockout counter at API layer (Identity lockout exists on entity but not wired to this flow) |

**Verdict: UNPROTECTED against credential stuffing / brute force at HTTP level.**

---

### POST `/api/v1/auth/register`

| Layer | Protection | Details |
|-------|------------|---------|
| HTTP rate limit | ❌ None | Unlimited registrations per IP |
| FluentValidation | ✅ | `RegisterRequestValidator` |
| Application | ✅ | Duplicate email/username → 409 |
| Spam account creation | ❌ None | No IP or email creation throttle |

**Verdict: UNPROTECTED against mass registration abuse.**

---

### POST `/api/v1/auth/refresh`

| Layer | Protection | Details |
|-------|------------|---------|
| HTTP rate limit | ❌ None | Unlimited refresh attempts |
| FluentValidation | ✅ | `RefreshTokenRequestValidator` (not empty, max 256) |
| Application | ✅ | Invalid/expired/reused token → 403; reuse revokes all sessions |
| Token brute-force | ⚠️ Partial | 64-char opaque token makes guessing infeasible, but no request throttle |

**Verdict: UNPROTECTED at HTTP level. Cryptographic strength is the only defense against token guessing.**

---

### POST `/api/v1/auth/forgot-password`

| Layer | Protection | Details |
|-------|------------|---------|
| HTTP rate limit | ❌ None | — |
| Application (`OtpService`) | ✅ Partial | See OTP limits below |
| Enumeration | ✅ | Returns 200 even if email not found (silent) |

**OTP send limits** (`OtpSettings` → `appsettings.json`):

| Rule | Configured | Required (hardening plan) |
|------|------------|---------------------------|
| Max requests per hour per email per purpose | 5/hour | 3 per 10 minutes |
| Resend cooldown | 60 seconds | — |
| Window | Rolling 1 hour | Fixed 10 minutes |

**Verdict: PARTIALLY PROTECTED — limits exist but differ from target (5/hour vs 3/10min).**

---

### POST `/api/v1/auth/send-email-verification`

| Layer | Protection | Details |
|-------|------------|---------|
| HTTP rate limit | ❌ None | — |
| Application (`OtpService`) | ✅ Partial | Same `EnsureCanSendEmailAsync` as forgot-password |
| Silent skip | ✅ | No-op if user missing or already confirmed |

Uses `OtpPurpose.EmailVerification` — limits are **per-purpose**, so forgot-password and email-verification counters are independent.

**Verdict: PARTIALLY PROTECTED — same OTP hourly/cooldown limits (not 3/10min).**

---

### POST `/api/v1/auth/verify-email`

| Layer | Protection | Details |
|-------|------------|---------|
| HTTP rate limit | ❌ None | — |
| Application (`OtpService.VerifyInternalAsync`) | ✅ Partial | Per-OTP attempt counter only |

**Verify limits:**

| Rule | Configured | Required (hardening plan) |
|------|------------|---------------------------|
| Max attempts per OTP record | 5 (`MaxAttempts`) | 10 per 10 minutes per email |
| Time window across requests | ❌ None | 10-minute sliding window |
| OTP expiry | 10 minutes | — |

Each new OTP send resets the attempt counter (new row). An attacker can request new OTPs (subject to send limits) and get 5 attempts per OTP indefinitely within hourly send cap.

**Verdict: PARTIALLY PROTECTED — per-OTP attempts only, no per-email time-window limit on verify calls.**

---

### POST `/api/v1/auth/verify-otp`

Same as verify-email path — delegates to `OtpService.VerifyAsync` (ForgotPassword purpose, `markUsed: false`).

**Verdict: PARTIALLY PROTECTED — identical per-OTP attempt model.**

---

### POST `/api/v1/auth/reset-password`

| Layer | Protection | Details |
|-------|------------|---------|
| HTTP rate limit | ❌ None | — |
| Application | ✅ Partial | OTP verified inline via `VerifyEmailAsync(markUsed: true)` with same `MaxAttempts` (5) per OTP row |
| Post-reset | ✅ | `RevokeAllForUserAsync` on success |

**Verdict: PARTIALLY PROTECTED — OTP attempt limit only; no dedicated reset-password request throttle.**

---

## OTP Rate Limit Detail (Current)

**File:** `OtpService.cs` + `OtpSettings`

```
Send (forgot-password, send-email-verification):
  EnsureCanSendEmailAsync
    ├─ CountRequestsByEmailSinceAsync(email, purpose, last 1 hour) >= 5 → OTP_RATE_LIMIT_EXCEEDED
    └─ Latest OTP created < 60s ago → OTP_COOLDOWN

Verify (verify-email, verify-otp, reset-password):
  VerifyInternalAsync
    ├─ Increment AttemptCount on each call
    └─ AttemptCount > 5 → OTP_MAX_ATTEMPTS (marks OTP used)
```

**Error codes** (mapped in `ExceptionHandlingMiddleware`):

- `OTP_RATE_LIMIT_EXCEEDED` → 403
- `OTP_COOLDOWN` → 403
- `OTP_MAX_ATTEMPTS` → 403

---

## Summary Matrix

| Endpoint | HTTP Rate Limit | App-Level Protection | Gap vs Target |
|----------|-----------------|----------------------|---------------|
| `POST /auth/login` | ❌ | Validation + ban check | Needs 5/min/IP |
| `POST /auth/register` | ❌ | Validation + duplicate check | Needs 5/min/IP |
| `POST /auth/refresh` | ❌ | Token validation + reuse detection | Needs 20/min/user |
| `POST /auth/forgot-password` | ❌ | 5/hour + 60s cooldown per email | Needs 3/10min/email |
| `POST /auth/send-email-verification` | ❌ | 5/hour + 60s cooldown per email | Needs 3/10min/email |
| `POST /auth/verify-email` | ❌ | 5 attempts per OTP row | Needs 10/10min/email |
| `POST /auth/reset-password` | ❌ | 5 attempts per OTP row (inline verify) | Inherits verify limits |

---

## Current Protections (Complete List)

| Protection | Applies To |
|------------|------------|
| FluentValidation on request DTOs | All auth endpoints |
| JWT authentication | `logout`, `me` |
| `BannedUserMiddleware` | Authenticated routes |
| OTP send: 5 requests/hour/email/purpose | forgot-password, send-email-verification |
| OTP send: 60s cooldown | forgot-password, send-email-verification |
| OTP verify: 5 attempts per OTP record | verify-email, verify-otp, reset-password |
| Refresh reuse detection | refresh |
| Silent response on unknown email | forgot-password, send-email-verification |

---

## Missing Protections

| Gap | Risk |
|-----|------|
| No IP-based rate limit on login | Credential stuffing |
| No IP-based rate limit on register | Account spam |
| No per-user/IP rate limit on refresh | DoS, token probing |
| OTP send limits use 1-hour window, not 10-minute | Weaker than target |
| No per-email verify attempt window | OTP brute-force across regenerated OTPs |
| No global ASP.NET Rate Limiter middleware | No unified 429 responses |
| No Redis/distributed rate limit store | Single-instance only if added via memory |

---

## Related Files

| File | Role |
|------|------|
| `AuthController.cs` | All auth endpoints |
| `Program.cs` | Middleware pipeline (no rate limiter) |
| `ServiceCollectionExtensions.cs` | DI setup |
| `OtpService.cs` | OTP send/verify limits |
| `OtpSettings.cs` | Limit configuration |
| `ExceptionHandlingMiddleware.cs` | OTP error mapping |
| `BannedUserMiddleware.cs` | Ban enforcement |
| `ApiResponseWrapperFilter.cs` | Response envelope |
