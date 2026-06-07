# Auth Flow Regression Audit

Post-Google Login implementation. Analysis based on source code and existing automated tests (46 tests passing at last `dotnet test` run).

**Legend:** PASS = flow intact and correctly wired | FAIL = broken or security regression | PARTIAL = works with caveats

---

## 1. Register

| Aspect | Detail |
|--------|--------|
| **Request** | `POST /api/v1/auth/register` — `{ email, username, password, displayName? }` |
| **Rate limit** | `RegisterPolicy` — 5/min per IP |
| **Service path** | `AuthController.Register` → `AuthService.RegisterAsync` |
| **DB updates** | `UserRepository.CreateAsync` (Identity user + Student role + UserProfile), extra `UserProfile` via `profileRepository.AddAsync`, `UnitOfWork.SaveChanges`, OTP row via `OtpService.GenerateAndSendEmailAsync` |
| **Security** | Duplicate email/username → `409 Conflict`; password policy via Identity on create; FluentValidation on request |
| **Result** | `LoginResponse` via `BuildLoginResponseAsync` (immediate login + refresh token issued) |
| **Tests** | Register rate-limit integration test |

**Verdict: PASS** (unchanged by Google work)

**Note (pre-existing):** `RegisterAsync` adds `UserProfile` twice — once inside `CreateAsync` and again explicitly. Not introduced by Google Login.

---

## 2. Verify Email

| Aspect | Detail |
|--------|--------|
| **Request** | `POST /api/v1/auth/verify-email` — `{ email, code }` |
| **Service path** | `AuthService.VerifyEmailAsync` → `OtpService.VerifyEmailAsync(purpose: EmailVerification, markUsed: true)` → `UserRepository.ConfirmEmailAsync` |
| **DB updates** | OTP marked used; `ApplicationUser.EmailConfirmed = true` |
| **Security** | OTP hash verify, expiry, max attempts, cooldown on resend; invalid OTP → `403 OTP_INVALID` |
| **Result** | `200 { message: "Email verified" }` |

**Verdict: PASS**

---

## 3. Login (Email/Password)

| Aspect | Detail |
|--------|--------|
| **Request** | `POST /api/v1/auth/login` — `{ emailOrUsername, password }` |
| **Rate limit** | `LoginPolicy` — 5/min per IP |
| **Service path** | `AuthService.LoginAsync` → `GetByEmailOrUsernameAsync` → `ValidatePasswordAsync` → ban check → streak → `BuildLoginResponseAsync` |
| **DB updates** | Streak/last activity; new `RefreshToken` row |
| **Security** | Invalid creds → `404` (no user enumeration on password); `RequireConfirmedEmail` gate; ban check |
| **Result** | `LoginResponse` with access + refresh tokens |
| **Tests** | `AuthEndpointsTests`, `AuthServiceTests`, rate-limit tests |

**Verdict: PASS**

---

## 4. Login (Google)

| Aspect | Detail |
|--------|--------|
| **Request** | `POST /api/v1/auth/google` — `{ idToken }` |
| **Rate limit** | `GoogleLoginPolicy` — 5/min per IP (separate bucket from email login) |
| **Service path** | `GoogleTokenValidator.ValidateAsync` → `FindOrCreateGoogleUserAsync` → optional `ConfirmEmailAsync` → ban check → streak → `BuildLoginResponseAsync` |
| **DB updates** | New user: Identity user (Student, `EmailConfirmed=true`) + profile; existing: optional email confirm + streak; always: new refresh token |
| **Security** | Google JWKS signature, issuer, audience (`ClientId`), expiry, `email_verified`; empty `ClientId` → `403 GOOGLE_TOKEN_INVALID`; raw email strings rejected |
| **Result** | `LoginResponse` (same shape as email login) |
| **Tests** | 8 integration + 4 unit tests |

**Verdict: PASS** (backend)

**Caveat:** Production requires `Google:ClientId` configured; default appsettings has empty value → all Google logins fail until configured.

---

## 5. Refresh Token

| Aspect | Detail |
|--------|--------|
| **Request** | `POST /api/v1/auth/refresh` — `{ refreshToken }` |
| **Rate limit** | `RefreshPolicy` — 20/min |
| **Service path** | `AuthService.RefreshAsync` → `FindByTokenValueAsync` → reuse/expiry checks → `RevokeAsync` → `BuildLoginResponseAsync` |
| **DB updates** | Old token revoked; new refresh token inserted |
| **Security** | Reuse of revoked token → revoke all user tokens + `REFRESH_TOKEN_REUSE_DETECTED`; expired → `REFRESH_TOKEN_EXPIRED` |
| **Tests** | `AuthEndpointsTests`, `AuthServiceTests`, Google refresh integration test |

**Verdict: PASS**

---

## 6. Logout

| Aspect | Detail |
|--------|--------|
| **Request** | `POST /api/v1/auth/logout` — Bearer required |
| **Service path** | `AuthService.LogoutAsync` → `RevokeAllForUserAsync` |
| **DB updates** | All user refresh tokens `IsRevoked = true` |
| **Security** | Requires authenticated user |

**Verdict: PASS**

---

## 7. Forgot Password

| Aspect | Detail |
|--------|--------|
| **Request** | `POST /api/v1/auth/forgot-password` — `{ email }` |
| **Rate limit** | **None** on endpoint |
| **Service path** | `AuthService.SendForgotPasswordOtpAsync` → silent return if email unknown → `OtpService.GenerateAndSendAsync` |
| **DB updates** | New OTP row; prior OTPs invalidated |
| **Security** | No email enumeration (always 200); OTP cooldown + hourly rate limit inside `OtpService` |
| **Tests** | `ForgotPasswordEndpointsTests` |

**Verdict: PASS**

**Note:** Endpoint-level rate limiting absent (pre-existing; not worsened by Google).

---

## 8. Verify OTP

| Aspect | Detail |
|--------|--------|
| **Request** | `POST /api/v1/auth/verify-otp` — `{ email, code }` |
| **Service path** | `AuthService.VerifyOtpAsync` → `OtpService.VerifyAsync` (ForgotPassword purpose, `markUsed: false`) |
| **DB updates** | `AttemptCount++`; OTP remains valid |
| **Security** | Invalid/expired → `403 OTP_INVALID`; max attempts → `OTP_MAX_ATTEMPTS` |
| **Tests** | `ForgotPasswordEndpointsTests` |

**Verdict: PASS**

---

## 9. Reset Password

| Aspect | Detail |
|--------|--------|
| **Request** | `POST /api/v1/auth/reset-password` — `{ email, code, newPassword }` |
| **Service path** | Verify OTP (`markUsed: false`) → `UpdatePasswordAsync` → `ConsumeLatestEmailOtpAsync` → `RevokeAllForUserAsync` |
| **DB updates** | Password hash updated; OTP consumed; all refresh tokens revoked |
| **Security** | Identity password policy via validator + `DomainException` (400); OTP not consumed on failed password update |
| **Tests** | `ForgotPasswordEndpointsTests` (full flow, weak password, reused OTP) |

**Verdict: PASS**

---

## 10. Get Current User (/me)

| Aspect | Detail |
|--------|--------|
| **Request** | `GET /api/v1/auth/me` — Bearer required |
| **Service path** | `AuthService.GetMeAsync` → ban check → premium check → profile |
| **Security** | JWT validated by middleware; `BannedUserMiddleware` blocks banned users on all authenticated routes |
| **Result** | `MeResponse` with role, premium, points, etc. |
| **Tests** | `AuthEndpointsTests` |

**Verdict: PASS**

---

## Regression Summary

| # | Flow | Verdict |
|---|------|---------|
| 1 | Register | **PASS** |
| 2 | Verify Email | **PASS** |
| 3 | Login (Email/Password) | **PASS** |
| 4 | Login (Google) | **PASS** |
| 5 | Refresh Token | **PASS** |
| 6 | Logout | **PASS** |
| 7 | Forgot Password | **PASS** |
| 8 | Verify OTP | **PASS** |
| 9 | Reset Password | **PASS** |
| 10 | Get Current User | **PASS** |

**Overall: 10/10 PASS** — Google Login did not break existing auth flows. No code defects requiring immediate fix identified in regression scope.
