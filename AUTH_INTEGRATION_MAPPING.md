# Auth Integration Mapping

FE → BE mapping for all 10 authentication flows.

---

## 1. Register

| Layer | Detail |
|-------|--------|
| **FE Page** | `RegisterPage.jsx` |
| **FE Hook** | `useAuth().register` |
| **FE Service** | `authApi.register` → `httpClient.apiRequest` |
| **BE Endpoint** | `POST /api/v1/auth/register` |
| **Request DTO** | `{ email, username, password, displayName? }` |
| **Response** | `LoginResponse` → `{ accessToken, expiresIn, refreshToken, refreshExpiresIn, user }` |
| **Status** | **PASS** |

FE derives `username` from email via `deriveUsernameFromEmail`. Stores access + refresh tokens after Phase 6.

---

## 2. Verify Email

| Layer | Detail |
|-------|--------|
| **FE Page** | None dedicated |
| **FE Hook** | None |
| **FE Service** | `authApi.sendEmailVerification`, `authApi.verifyEmail` (added Phase 6) |
| **BE Endpoint** | `POST /api/v1/auth/send-email-verification`, `POST /api/v1/auth/verify-email` |
| **Request DTO** | `{ email }`, `{ email, code }` |
| **Response** | `{ message }` |
| **Status** | **PARTIAL** — API functions exist; no UI flow |

---

## 3. Login (Email/Password)

| Layer | Detail |
|-------|--------|
| **FE Page** | `LoginPage.jsx` |
| **FE Hook** | `useAuth().login` |
| **FE Service** | `authApi.login` |
| **BE Endpoint** | `POST /api/v1/auth/login` |
| **Request DTO** | `{ emailOrUsername, password }` |
| **Response** | `LoginResponse` |
| **Status** | **PASS** |

---

## 4. Google Login

| Layer | Detail |
|-------|--------|
| **FE Page** | `LoginPage.jsx`, `RegisterPage.jsx` |
| **FE Hook** | `useAuth().googleLogin` |
| **FE Service** | `googleAuth.requestGoogleIdToken` → `authApi.googleLogin` |
| **BE Endpoint** | `POST /api/v1/auth/google` |
| **Request DTO** | `{ idToken }` |
| **Response** | `LoginResponse` |
| **Status** | **PARTIAL** — wired; requires `VITE_GOOGLE_CLIENT_ID` |

---

## 5. Refresh Token

| Layer | Detail |
|-------|--------|
| **FE Page** | N/A (automatic) |
| **FE Hook** | `httpClient.refreshSession` (interceptor) |
| **FE Service** | `authApi.refresh` + `httpClient` 401 retry |
| **BE Endpoint** | `POST /api/v1/auth/refresh` |
| **Request DTO** | `{ refreshToken }` |
| **Response** | `LoginResponse` |
| **Status** | **PASS** (Phase 6) |

---

## 6. Logout

| Layer | Detail |
|-------|--------|
| **FE Page** | Header/logout actions |
| **FE Hook** | `useAuth().logout` |
| **FE Service** | `authApi.logout` |
| **BE Endpoint** | `POST /api/v1/auth/logout` (Bearer required) |
| **Response** | `{ message: "Logged out" }` |
| **Status** | **PASS** |

---

## 7. Forgot Password

| Layer | Detail |
|-------|--------|
| **FE Page** | `ForgotPasswordPage.jsx` |
| **FE Hook** | Direct `authApi` calls |
| **FE Service** | `authApi.forgotPassword` |
| **BE Endpoint** | `POST /api/v1/auth/forgot-password` |
| **Request DTO** | `{ email }` |
| **Response** | `{ message: "OTP sent" }` |
| **Status** | **PASS** |

---

## 8. Verify OTP

| Layer | Detail |
|-------|--------|
| **FE Page** | `ForgotPasswordPage.jsx` (otp step) |
| **FE Service** | `authApi.verifyOtp` |
| **BE Endpoint** | `POST /api/v1/auth/verify-otp` |
| **Request DTO** | `{ email, code }` |
| **Response** | `{ message: "OTP verified" }` |
| **Status** | **PASS** |

---

## 9. Reset Password

| Layer | Detail |
|-------|--------|
| **FE Page** | `ForgotPasswordPage.jsx` (reset step) |
| **FE Service** | `authApi.resetPassword` |
| **BE Endpoint** | `POST /api/v1/auth/reset-password` |
| **Request DTO** | `{ email, code, newPassword }` |
| **Response** | `{ message: "Password reset successful" }` |
| **Status** | **PASS** |

---

## 10. Get Current User

| Layer | Detail |
|-------|--------|
| **FE Page** | N/A (bootstrap) |
| **FE Hook** | `AuthProvider` bootstrap `useEffect` |
| **FE Service** | `authApi.getMe` |
| **BE Endpoint** | `GET /api/v1/auth/me` |
| **Response** | `MeResponse` (flat user fields) |
| **Status** | **PASS** |

---

## Coverage Summary

| Flow | Status |
|------|--------|
| Register | PASS |
| Verify Email | PARTIAL |
| Login | PASS |
| Google Login | PARTIAL |
| Refresh Token | PASS |
| Logout | PASS |
| Forgot Password | PASS |
| Verify OTP | PASS |
| Reset Password | PASS |
| Get Current User | PASS |

**8 PASS · 2 PARTIAL · 0 FAIL**
