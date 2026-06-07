# FE ↔ BE Alignment Audit — Guest & Authentication

> **Date:** 2026-06-06  
> **Scope:** Guest routes/permissions + Auth flows only  
> **Method:** Source inspection (`fe/src` vs `SEHub.Backend` AuthController)  
> **Code modified:** None

---

## Executive Summary

| Area | Alignment | Score |
|------|-----------|-------|
| **Auth API wiring** (login/register/logout/me) | Khớp DTO + envelope | **PASS** (4/4 core) |
| **Auth API gaps** (refresh, forgot-password, verify-email) | Chưa wire | **FAIL** (0/3) |
| **Guest route vs BE policy** | Cấu trúc đúng; dữ liệu vẫn mock | **PARTIAL** |
| **Authenticated route guard** | `PrivateRoute` khớp `RequireAuthenticated` | **PASS** |
| **Premium guard** | FE dùng JWT `isPremium`; BE đọc DB | **PARTIAL** |

**Overall Guest + Auth alignment: 62/100 — PARTIAL**

---

## 1. Actor Mapping (BA → FE Route → BE Policy)

| Actor | FE Detection | FE Routes | BE Policy | Aligned? |
|-------|--------------|-----------|-----------|----------|
| **Guest** | `!isAuthenticated` | `/`, `/support`, `/community/*`, `/login`, `/register` | `AllowAnonymous` on read feed/exams/pricing | **PARTIAL** *(UI mock, chưa gọi API)* |
| **Student (Free)** | `isAuthenticated && !isPremium` | `/home/*` via `PrivateRoute` | `RequireAuthenticated` | **PASS** |
| **Student (Premium)** | `isPremium` (from login/me) | `/community/.../do` via `PremiumRoute` | `RequirePremium` (DB) | **PARTIAL** |
| **Moderator** | `role === "moderator"` | `/moderator/*` via `ModeratorRoute` | `RequireModerator` | **PASS** *(route guard only)* |
| **Admin** | `role === "admin"` | `/admin/*` via `AdminRoute` | `RequireAdmin` | **PASS** *(route guard only)* |

---

## 2. Guest — FE Route vs BE Endpoint

### 2.1 Routes không yêu cầu đăng nhập (FE)

| FE Route | Layout | PrivateRoute? | BA Guest Permission |
|----------|--------|---------------|---------------------|
| `/` | `GuestLayout` | No | Landing — OK |
| `/support` | `GuestLayout` | No | Support — OK |
| `/community` | `CommunityLayout` | No | Xem feed — OK |
| `/community/final-exam/*` | `CommunityLayout` | No | Xem đề thi metadata — OK |
| `/community/documents/*` | `CommunityLayout` | No | **Lệch BE** — BE yêu cầu auth |
| `/login`, `/register`, `/forgot-password` | `AuthLayout` | No | Auth pages — OK |

### 2.2 Guest — BE Anonymous Endpoints (đúng BA)

| BE Endpoint | Guest allowed? | FE gọi API? | Status |
|-------------|----------------|-------------|--------|
| `GET /api/v1/posts` | ✅ | ❌ `MOCK_POSTS` | **FAIL** |
| `GET /api/v1/posts/featured` | ✅ | ❌ mock sidebar | **FAIL** |
| `GET /api/v1/exams` | ✅ | ❌ mock exam data | **FAIL** |
| `GET /api/v1/premium/plans` | ✅ | ❌ mock pricing | **FAIL** |
| `GET /api/v1/documents` | ❌ 401 | ❌ route mở cho guest | **FAIL** |

### 2.3 Guest UX — Interaction gating

| Feature | FE Behavior | BE Requirement | Status |
|---------|-------------|----------------|--------|
| Like / comment trên `/community` | `useRequireAuth` → toast → `/login` | `RequireAuthenticated` | **PASS** *(UX đúng, data mock)* |
| Community feed header | `GuestHeader` khi chưa login | — | **PASS** |
| Đã login nhưng ở `/community` index | Vẫn `GuestHeader` (`showStudentShell=false`) | — | **PARTIAL** *(UX; login redirect về `/home` đã fix)* |

**File:** `fe/src/common/Layout/CommunityLayout.jsx` — `showStudentShell = isAuthenticated && !isFeedHome`

---

## 3. Authentication — Endpoint Mapping

### 3.1 Wired & Aligned (PASS)

| Flow | FE | BE | Request DTO | Response | Status |
|------|----|----|-------------|----------|--------|
| **Login** | `authApi.login` → `AuthProvider.login` | `POST /api/v1/auth/login` | `{ emailOrUsername, password }` ✅ | `LoginResponse` → `accessToken`, `user` | **PASS** |
| **Register** | `authApi.register` → `AuthProvider.register` | `POST /api/v1/auth/register` | `{ email, username, password, displayName }` ✅ | `LoginResponse` | **PASS** |
| **Logout** | `authApi.logout` → `AuthProvider.logout` | `POST /api/v1/auth/logout` | Bearer token | `{ message }` | **PASS** |
| **Session restore** | `authApi.getMe` on boot | `GET /api/v1/auth/me` | Bearer token | `MeResponse` ≈ `AuthUserDto` | **PASS** |

#### DTO chi tiết — Login

| Field | BE `LoginRequest` | FE body | Match |
|-------|-------------------|---------|-------|
| Email/username | `EmailOrUsername` | `emailOrUsername` (camelCase JSON) | ✅ |
| Password | `Password` | `password` | ✅ |

#### DTO chi tiết — Register

| Field | BE `RegisterRequest` | FE body | Match |
|-------|----------------------|---------|-------|
| Email | `Email` | `email` | ✅ |
| Username | `Username` | `deriveUsernameFromEmail(email)` | ✅ |
| Password | `Password` (min 8) | `password` | ✅ |
| DisplayName | `DisplayName?` | `fullName` → `displayName` | ✅ |
| ConfirmPassword | — | FE validate only, không gửi | ✅ OK |

#### DTO chi tiết — LoginResponse / User

| Field | BE returns | FE consumes (`authMapper`) | Match |
|-------|------------|---------------------------|-------|
| `accessToken` | ✅ | `setAccessToken` → `sehubs_token` | ✅ |
| `refreshToken` | ✅ | **Ignored** | ❌ |
| `expiresIn` | ✅ | **Ignored** | ⚠️ |
| `user.id` | Guid | `mapApiUser.id` | ✅ |
| `user.role` | `"Student"` | `.toLowerCase()` → `"student"` | ✅ |
| `user.isPremium` | bool | `isPremium` | ✅ |
| `user.levelName` | string | `level` | ✅ |

#### Storage keys

| Key | Purpose | Set on |
|-----|---------|--------|
| `sehubs_token` | Access JWT | login/register |
| `sehubs_user` | Cached profile JSON | login/register/me |
| `sehubs_remember_login` | Remember email | login only |
| `sehubs_refresh_token` | — | **Not implemented** |

**Files:** `fe/src/api/httpClient.js` · `fe/src/context/AuthProvider.jsx` · `fe/src/api/authMapper.js`

---

### 3.2 Partial Alignment (PARTIAL)

| Flow | Issue | Impact |
|------|-------|--------|
| **Register password rules** | FE yêu cầu hoa/thường/số/đặc biệt; BE chỉ `MinLength(8)` | User pass FE fail BE hoặc ngược lại |
| **Premium status** | FE: `user.isPremium` từ JWT/login; BE: `PremiumAuthorizationHandler` đọc DB | Sau PayOS webhook FE cần `getMe()` hoặc poll subscription |
| **Post-login redirect** | Đã fix: `resolvePostLoginPath` → `/home` (không về guest `/`) | **PASS** *(đã sửa)* |
| **Error messages** | FE đọc `payload.message` hoặc `errors[0].message` | Khớp `ApiResponse` envelope ✅ |
| **CORS** | `VITE_API_BASE_URL=http://localhost:5006`; BE allows 5173/5174/5175 | **PASS** |

---

### 3.3 Not Wired (FAIL / MISSING)

| Flow | FE State | BE Endpoint | Status |
|------|----------|-------------|--------|
| **Refresh token** | Không lưu, không gọi | `POST /api/v1/auth/refresh` | **FAIL** |
| **Forgot password** | UI 4 bước — **toàn mock** (toast, không fetch) | `forgot-password`, `verify-otp`, `reset-password` | **FAIL** |
| **Email verification** | Không có màn hình | `send-email-verification`, `verify-email` | **MISSING** |
| **Google OAuth** | Toast "chưa kết nối API" | `POST /api/v1/auth/google` (stub) | **ALIGNED** *(cả hai chưa production)* |
| **SMS OTP** | ForgotPassword có UI phone | `send-sms-otp`, `verify-sms-otp` (mock SMS) | **FAIL** *(UI có, API không gọi)* |

**ForgotPassword evidence:** `handleSendOtp` chỉ `setStep("otp")` — không `apiRequest`. `handleResetPassword` chỉ toast + `navigate("/login")`.

---

## 4. Route Guard vs BE Authorization

| FE Guard | Checks | BE Equivalent | Guest impact |
|----------|--------|---------------|--------------|
| `PrivateRoute` | `isAuthenticated` | `RequireAuthenticated` | Guest → `/login` ✅ |
| `PremiumRoute` | `isAuthenticated` + `isPremium` | `RequirePremium` | Guest → `/login`; Free → `/home/premium` ✅ |
| `AdminRoute` | `isAuthenticated` + `isAdmin` | `RequireAdmin` | ✅ |
| `ModeratorRoute` | `isAuthenticated` + Mod/Admin | `RequireModerator` | ✅ |
| *(none)* | `/community` open | BE anonymous reads | Guest vào được route; **data mock** |

**Bootstrap gap:** `PrivateRoute` returns `null` while `isBootstrapping` — màn hình trắng ngắn khi có token cũ (acceptable).

---

## 5. Auth Flow Diagrams

### Current (implemented)

```
Guest → /login
  → POST /api/v1/auth/login { emailOrUsername, password }
  → localStorage: sehubs_token + sehubs_user
  → navigate /home (PrivateRoute)
  → [boot] GET /api/v1/auth/me (validate session)
```

### Missing (BE ready, FE not)

```
Access token expired
  → [should] POST /api/v1/auth/refresh { refreshToken }
  → [actual] getMe fails → clear session → /login

Forgot password
  → [should] POST forgot-password → verify-otp → reset-password
  → [actual] UI mock only
```

---

## 6. Findings Table

| # | Finding | Severity | FE | BE |
|---|---------|----------|----|----|
| 1 | Login/Register/Logout/Me wired correctly | — | ✅ | ✅ |
| 2 | Refresh token not stored or used | **MAJOR** | ❌ | ✅ |
| 3 | Forgot-password UI mock only | **MAJOR** | ❌ | ✅ |
| 4 | Guest feed/exams use mock, not `GET /posts` `/exams` | **MAJOR** | ❌ | ✅ |
| 5 | `/community/documents` open for guest; BE requires auth | **MAJOR** | Route open | 401 |
| 6 | Email verification no FE flow | **MINOR** | ❌ | ✅ |
| 7 | Register password rules stricter on FE | **MINOR** | Stricter | Looser |
| 8 | Premium FE trusts JWT; BE re-checks DB | **MINOR** | JWT | DB |
| 9 | Google — both sides non-production | **INFO** | Toast | Stub |
| 10 | CORS + `VITE_API_BASE_URL` aligned | — | ✅ | ✅ |

---

## 7. Recommended Fix Priority

| Priority | Task | Files |
|----------|------|-------|
| P0 | Wire `refreshToken` + silent refresh on 401 | `httpClient.js`, `authApi.js`, `AuthProvider.jsx` |
| P0 | Wire `ForgotPasswordPage` → 3 auth endpoints | `ForgotPasswordPage.jsx`, `authApi.js` |
| P1 | Guest feed: `GET /api/v1/posts` thay `MOCK_POSTS` | `feedApi.js`, `FeedPage.jsx`, `HomePage.jsx` |
| P1 | Block or auth-gate `/community/documents` | `App.jsx` or `DocumentsPage` |
| P2 | Email verification screen | new page + `authApi` |
| P2 | Poll `GET /premium/subscription` after checkout | `PremiumPage`, `AuthProvider` |

---

## 8. Verdict

| Classification | Result |
|----------------|--------|
| Auth core (login/register/logout/me) | **READY** |
| Auth extended (refresh, forgot, verify-email) | **NOT READY** |
| Guest browsing (feed/exams via API) | **NOT READY** (mock only) |
| Guest vs BE policy structure | **ALIGNED** |

**Guest + Auth FE↔BE: CONDITIONAL PASS** — đăng nhập/đăng ký hoạt động; guest vẫn dùng mock data; forgot-password và refresh chưa nối BE.
