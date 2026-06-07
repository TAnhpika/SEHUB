# SEHub — Frontend Auth Integration Guide

> **Date:** 2026-06-06  
> **Based on:** Actual BE DTOs + FE `authApi.js` / `AuthProvider.jsx` / `httpClient.js`  
> **API base:** `VITE_API_BASE_URL` (default `http://localhost:5006`)

---

## Overview

SEHub uses **JWT access tokens** (short-lived) plus **opaque refresh tokens** (long-lived). The FE stores both in `localStorage` and attaches the access token as `Authorization: Bearer <token>`.

| Token | BE support | FE storage |
|-------|------------|------------|
| Access Token | ✅ Issued on login/register/refresh | `localStorage["sehubs_token"]` |
| Refresh Token | ✅ Issued on login/register/refresh | `localStorage["sehubs_refresh_token"]` (recommended) |

---

## 1. Login Flow

```
User submits credentials
  → POST /api/v1/auth/login
  → unwrap ApiResponse.data → LoginResponse
  → store accessToken + refreshToken + user profile
  → optional: GET /api/v1/auth/me on app boot
```

### Request

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "emailOrUsername": "demo.student@sehub.local",
  "password": "Demo@12345"
}
```

**DTO:** `LoginRequest` — `emailOrUsername`, `password`

### Response (`data` after envelope unwrap)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "refreshToken": "kR7x...opaque...",
  "refreshExpiresIn": 604800,
  "user": {
    "id": "uuid",
    "username": "demo.student",
    "email": "demo.student@sehub.local",
    "displayName": "Demo Student",
    "role": "Student",
    "isPremium": false,
    "avatarUrl": null,
    "points": 0,
    "levelName": "Bronze"
  }
}
```

### FE implementation (`fe/src/api/authApi.js`)

```javascript
export function login({ emailOrUsername, password }) {
  return apiRequest("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: { emailOrUsername, password },
  });
}
```

### FE session apply (`fe/src/context/AuthProvider.jsx`)

```javascript
function applyAuthSession(setUser, loginResponse) {
  const nextUser = mapApiUser(loginResponse.user);
  setAccessToken(loginResponse.accessToken);       // localStorage "sehubs_token"
  setRefreshToken(loginResponse.refreshToken);     // localStorage "sehubs_refresh_token"
  persistUser(nextUser);                           // localStorage "sehubs_user"
  setUser(nextUser);
}
```

---

## 2. Store Access Token

| Key | Location | Set by |
|-----|----------|--------|
| `sehubs_token` | `localStorage` | `setAccessToken()` in `httpClient.js` |
| `sehubs_refresh_token` | `localStorage` | `setRefreshToken()` in `httpClient.js` |
| `sehubs_user` | `localStorage` | `persistUser()` in `AuthProvider.jsx` |

```javascript
// fe/src/api/httpClient.js
export const TOKEN_KEY = "sehubs_token";

export function setAccessToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
```

**Security note:** Access token in `localStorage` is vulnerable to XSS. HttpOnly cookies would be stronger (not current BE design).

---

## 3. Store Refresh Token

Backend returns `refreshToken` and `refreshExpiresIn` (seconds, default 7 days) in every `LoginResponse`.

```javascript
// fe/src/api/httpClient.js — recommended additions
export const REFRESH_TOKEN_KEY = "sehubs_refresh_token";

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token) {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}
```

Call `setRefreshToken(loginResponse.refreshToken)` in `applyAuthSession` and clear it in `clearAuthSession`.

**Security note:** Refresh tokens in `localStorage` are vulnerable to XSS. HttpOnly cookies would be stronger (not current BE design).

---

## 4. Authenticated Requests

```javascript
// fe/src/api/httpClient.js
if (auth) {
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
}
```

All `apiRequest(..., { auth: true })` calls include the Bearer header.

### Session restore on app load

```javascript
// AuthProvider.jsx — if token exists, validate via /me
const me = await authApi.getMe();
```

```http
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

**Response DTO:** `MeResponse` (same fields as `AuthUserDto`)

---

## 5. Refresh Flow

**Status: AVAILABLE**

| Endpoint | Exists? |
|----------|---------|
| `POST /api/v1/auth/refresh` | ✅ |
| `POST /api/v1/auth/refresh-token` | ❌ |

### Request

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<stored refresh token>"
}
```

**DTO:** `RefreshTokenRequest` — `refreshToken` (required, max 256 chars)

### Response

Same shape as login — full `LoginResponse` with new `accessToken`, `refreshToken`, and `user`. **Rotation:** each refresh invalidates the previous refresh token and issues a new one. Always store the new `refreshToken`.

### Recommended FE flow

```
Access token near expiry or API returns 401
  → POST /api/v1/auth/refresh
     Body: { "refreshToken": getRefreshToken() }
  → On success: applyAuthSession (update both tokens + user)
  → Retry original request with new accessToken
  → On 403 REFRESH_TOKEN_*: clearAuthSession, redirect to login
```

### FE implementation (`fe/src/api/authApi.js`)

```javascript
export function refresh({ refreshToken }) {
  return apiRequest("/api/v1/auth/refresh", {
    method: "POST",
    auth: false,
    body: { refreshToken },
  });
}
```

### Error codes (403)

| Code | Meaning | FE action |
|------|---------|-----------|
| `REFRESH_TOKEN_INVALID` | Token not found | Clear session, login |
| `REFRESH_TOKEN_EXPIRED` | Past expiry | Clear session, login |
| `REFRESH_TOKEN_REUSE_DETECTED` | Revoked token reused (possible theft) | Clear session, login; all sessions revoked server-side |

### Current FE behavior (until wired)

1. API returns **401**
2. `getMe()` or any authed call fails
3. `AuthProvider` calls `clearAuthSession()` — user redirected to login manually

**Next step:** Add 401 interceptor in `httpClient.js` to call `authApi.refresh` before clearing session.

---

## 6. Logout Flow

```
User clicks logout
  → POST /api/v1/auth/logout  (Bearer access token required)
  → BE: RevokeAllForUserAsync (all refresh tokens for user)
  → FE: clear localStorage access + refresh tokens + user
```

### Request

```http
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

### Response

```json
{ "success": true, "data": { "message": "Logged out" } }
```

### FE implementation

```javascript
export function logout() {
  return apiRequest("/api/v1/auth/logout", { method: "POST" });
}

// AuthProvider.jsx
const logout = useCallback(async () => {
  try {
    if (getAccessToken()) await authApi.logout();
  } finally {
    clearAuthSession(setUser);  // removes sehubs_token + sehubs_refresh_token + sehubs_user
  }
}, []);
```

**Important:** Access token remains valid until `expiresIn` (3600s) — no server-side JWT blacklist. Logout clears the client session and revokes all refresh tokens server-side.

---

## 7. Register Flow

Same response shape as login:

```http
POST /api/v1/auth/register
{
  "email": "user@sehub.local",
  "username": "user",
  "password": "Test@12345",
  "displayName": "User Name"
}
```

Returns `LoginResponse` — FE uses `applyAuthSession` identically.

---

## 8. Error Handling

| HTTP | Meaning | FE action |
|------|---------|-----------|
| 401 | Invalid/expired JWT | Clear session, redirect login |
| 403 | Banned / forbidden | Show message (`ACCOUNT_BANNED`) |
| 403 | Email not confirmed | Show verify-email prompt |
| 403 | `REFRESH_TOKEN_*` | Clear session, redirect login |

```javascript
// httpClient.js throws ApiError with status + errors[]
```

---

## 9. Endpoint Quick Reference

| Action | Method | Path | Auth |
|--------|--------|------|------|
| Login | POST | `/api/v1/auth/login` | No |
| Register | POST | `/api/v1/auth/register` | No |
| Google | POST | `/api/v1/auth/google` | No |
| Me | GET | `/api/v1/auth/me` | Bearer |
| Logout | POST | `/api/v1/auth/logout` | Bearer |
| Refresh | POST | `/api/v1/auth/refresh` | No |

---

## 10. Integration Checklist for FE Team

- [x] Store `accessToken` from `LoginResponse`
- [x] Attach `Authorization: Bearer` on API calls
- [x] Bootstrap session with `GET /auth/me`
- [x] Clear storage on logout
- [ ] Store `refreshToken` from `LoginResponse` (`sehubs_refresh_token`)
- [ ] Add `authApi.refresh()` calling `POST /auth/refresh`
- [ ] Retry on 401 with refresh before clearing session
- [ ] Clear refresh token on logout / refresh failure
