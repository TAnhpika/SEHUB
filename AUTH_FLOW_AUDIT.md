# Auth Flow Audit

> **Date:** 2026-06-06  
> **Method:** Source-code trace (`AuthController` → `AuthService` → repositories/services)  
> **Build/Test:** `dotnet build` PASS · `dotnet test` 24/24 PASS

---

## Summary

| # | Flow | Result |
|---|------|--------|
| 1 | Register | **PASS** |
| 2 | Email Verification | **PASS** |
| 3 | Login | **PASS** |
| 4 | Refresh Token | **PASS** |
| 5 | Logout | **PASS** |
| 6 | Forgot Password | **PASS** |
| 7 | Verify OTP | **PASS** |
| 8 | Reset Password | **PASS** |
| 9 | Google Login | **FAIL** (stub) |
| 10 | Get Current User (`/me`) | **PASS** |

---

## 1. Register — PASS

| Item | Detail |
|------|--------|
| **Request** | `POST /api/v1/auth/register` · `RegisterRequest` |
| **Service chain** | `AuthController` → `AuthService.RegisterAsync` → `RegisterRequestValidator` |
| **Steps** | Duplicate email/username check → `CreateAsync` → `UserProfile.AddAsync` → `SaveChanges` → `OtpService.GenerateAndSendEmailAsync(EmailVerification)` → `BuildLoginResponseAsync` |
| **DB updates** | `AspNetUsers`, `UserProfiles`, `OtpVerifications`, `RefreshTokens` |
| **Security** | Conflict on duplicate; FluentValidation; `[EnableRateLimiting(RegisterPolicy)]` 5/min/IP |
| **Result** | `LoginResponse` with access + refresh tokens + user (even if email unconfirmed; `RequireConfirmedEmail=false`) |

---

## 2. Email Verification — PASS

| Item | Detail |
|------|--------|
| **Send** | `POST /api/v1/auth/send-email-verification` |
| **Verify** | `POST /api/v1/auth/verify-email` |
| **Service chain** | `SendEmailVerificationAsync` / `VerifyEmailAsync` → `OtpService` |
| **DB updates** | Send: new `OtpVerifications` row; Verify: `IsUsed=true`, `EmailConfirmed=true` on user |
| **Security** | Silent no-op if user missing/already confirmed; OTP hash compare; cooldown + hourly cap |
| **Result** | 200 `{ message }` |

---

## 3. Login — PASS

| Item | Detail |
|------|--------|
| **Request** | `POST /api/v1/auth/login` · `LoginRequest` |
| **Service chain** | `LoginAsync` → credential lookup → `ValidatePasswordAsync` → optional `EmailNotConfirmed` → `EnsureNotBannedAsync` → streak update → `BuildLoginResponseAsync` |
| **DB updates** | Streak fields; new `RefreshTokens` row |
| **Security** | Generic 404 for bad credentials; ban check; rate limit 5/min/IP |
| **Result** | `LoginResponse` |

---

## 4. Refresh Token — PASS

| Item | Detail |
|------|--------|
| **Request** | `POST /api/v1/auth/refresh` · `RefreshTokenRequest` |
| **Service chain** | `RefreshAsync` → `FindByTokenValueAsync` → reuse/expiry/ban checks → `RevokeAsync` → `BuildLoginResponseAsync` |
| **DB updates** | Old token `IsRevoked=true`; new `RefreshTokens` row |
| **Security** | Reuse detection revokes all user tokens; rotation every refresh; rate limit 20/min/user |
| **Result** | New `LoginResponse` pair |

---

## 5. Logout — PASS

| Item | Detail |
|------|--------|
| **Request** | `POST /api/v1/auth/logout` · Bearer required |
| **Service chain** | `LogoutAsync` → `RevokeAllForUserAsync` |
| **DB updates** | All active refresh tokens `IsRevoked=true` |
| **Security** | `[Authorize(RequireAuthenticated)]`; access JWT **not** blacklisted |
| **Result** | 200 `{ message: "Logged out" }` |

---

## 6. Forgot Password — PASS

| Item | Detail |
|------|--------|
| **Request** | `POST /api/v1/auth/forgot-password` |
| **Service chain** | `SendForgotPasswordOtpAsync` → `OtpService.GenerateAndSendAsync` |
| **DB updates** | New `OtpVerifications` (ForgotPassword purpose) |
| **Security** | Silent 200 if email not found (no enumeration); OTP send limits |
| **Result** | 200 `{ message: "OTP sent" }` |

---

## 7. Verify OTP — PASS

| Item | Detail |
|------|--------|
| **Request** | `POST /api/v1/auth/verify-otp` |
| **Service chain** | `VerifyOtpAsync` → `OtpService.VerifyAsync` (ForgotPassword, `markUsed: false`) |
| **DB updates** | `AttemptCount++`; does not mark used |
| **Security** | Max 5 attempts per OTP row |
| **Result** | 200 or 403 `OTP_INVALID` |

---

## 8. Reset Password — PASS

| Item | Detail |
|------|--------|
| **Request** | `POST /api/v1/auth/reset-password` |
| **Service chain** | `ResetPasswordAsync` → `VerifyEmailAsync(markUsed: true)` → `UpdatePasswordAsync` → `RevokeAllForUserAsync` |
| **DB updates** | Password hash; OTP used; all refresh tokens revoked |
| **Security** | OTP must be valid; invalidates all sessions |
| **Result** | 200 `{ message: "Password reset successful" }` |

---

## 9. Google Login — FAIL

| Item | Detail |
|------|--------|
| **Request** | `POST /api/v1/auth/google` · `GoogleAuthRequest` |
| **Service chain** | `GoogleAuthAsync` → `FindOrCreateGoogleUserAsync` |
| **Issue** | **No Google token validation** — treats `IdToken` as email stub or `google_{id}@stub.sehub.local` |
| **DB updates** | User create/find; refresh token issued |
| **Security** | No OAuth verification; no rate limit |
| **Result** | Works in dev stub only — **not production-ready** |

---

## 10. Get Current User (`/me`) — PASS

| Item | Detail |
|------|--------|
| **Request** | `GET /api/v1/auth/me` · Bearer required |
| **Service chain** | JWT auth → `BannedUserMiddleware` → `GetMeAsync` → `EnsureNotBannedAsync` |
| **DB updates** | Read-only |
| **Security** | `RequireAuthenticated` policy; live ban check |
| **Result** | `MeResponse` |

---

## Middleware Pipeline (auth-relevant)

```
ExceptionHandlingMiddleware
→ CORS
→ Authentication (JWT Bearer)
→ BannedUserMiddleware
→ Authorization
→ RateLimiter
→ Controllers
```
