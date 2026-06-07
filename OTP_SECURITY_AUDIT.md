# OTP Security Audit

> **Date:** 2026-06-06  
> **Source:** `OtpService`, `OtpSettings`, `OtpVerification` entity

---

## Configuration (`appsettings.json`)

| Setting | Default | Purpose |
|---------|---------|---------|
| `ResendCooldownSeconds` | 60 | Min gap between sends |
| `MaxAttempts` | 5 | Verify attempts per OTP row |
| `MaxRequestsPerHour` | 5 | Send cap per email/phone per purpose |
| `ExpiryMinutes` | 10 | OTP lifetime |

---

## Send Flows

### Email OTP (Forgot Password)

| Item | Detail |
|------|--------|
| Endpoint | `POST /api/v1/auth/forgot-password` |
| Service | `GenerateAndSendAsync` → `OtpPurpose.ForgotPassword` |
| Pre-checks | `EnsureCanSendEmailAsync` (hourly cap + cooldown) |
| Storage | `CodeHash = SHA256(code)` — **plain code never stored** |
| Prior OTPs | `InvalidateAllByEmailAsync` before new code |
| Email | `IEmailService.SendOtpEmailAsync` (SMTP or Logging) |
| **Result** | **PASS** |

### Email Verification OTP

| Item | Detail |
|------|--------|
| Send endpoint | `POST /api/v1/auth/send-email-verification` |
| Also on register | `RegisterAsync` auto-sends |
| Purpose | `OtpPurpose.EmailVerification` |
| Limits | Per-purpose (independent from forgot-password counter) |
| **Result** | **PASS** |

### SMS OTP (out of scope for matrix but present)

| Item | Detail |
|------|--------|
| Endpoints | `send-sms-otp`, `verify-sms-otp` |
| Service | `MockSmsService` in dev |
| Same limits | Phone-based cooldown + hourly cap |
| **Result** | **PASS** (logic); SMS provider is mock |

---

## Verify Flows

| Flow | Endpoint | markUsed | On success |
|------|----------|----------|------------|
| Verify OTP (pre-check) | `POST /verify-otp` | `false` | 200; OTP still usable for reset |
| Verify Email | `POST /verify-email` | `true` | `ConfirmEmailAsync` |
| Reset Password | `POST /reset-password` | `true` | Password update + revoke tokens |

### `VerifyInternalAsync` Logic

1. Load latest OTP for email/phone + purpose
2. Fail if null, expired, or `IsUsed`
3. Increment `AttemptCount`
4. If `AttemptCount > MaxAttempts` → mark used + `OTP_MAX_ATTEMPTS`
5. Compare `CodeHash == SHA256(incoming)`
6. If valid and `markUsed` → `IsUsed = true`
7. Persist via `UpdateAsync`

---

## Security Controls

| Control | Status | Notes |
|---------|--------|-------|
| Expiration | **PASS** | 10-minute window |
| Cooldown | **PASS** | 60s between sends |
| Hourly send cap | **PASS** | 5/hour per purpose |
| Max verify attempts | **PASS** | 5 per OTP row |
| Reuse prevention | **PASS** | `IsUsed` flag + invalidation on resend |
| Hash at rest | **PASS** | SHA256 hex |
| Enumeration (forgot) | **PASS** | Silent 200 if user missing |
| HTTP rate limit | **PARTIAL** | App-level only; no `[EnableRateLimiting]` on OTP endpoints |

---

## Error Codes

| Code | HTTP | When |
|------|------|------|
| `OTP_INVALID` | 403 | Wrong/expired/used code |
| `OTP_COOLDOWN` | 403 | Resend too soon |
| `OTP_RATE_LIMIT_EXCEEDED` | 403 | >5 sends/hour |
| `OTP_MAX_ATTEMPTS` | 403 | >5 verify attempts |

Mapped in `ExceptionHandlingMiddleware.MapForbidden`.

---

## Test Coverage

| Scenario | Unit Test | Integration Test |
|----------|-----------|------------------|
| OTP send | — | — |
| OTP verify | — | — |
| OTP expired | — | — |
| OTP reuse | — | — |

**OTP logic: PASS · OTP automated tests: FAIL (gaps)**
