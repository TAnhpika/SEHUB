# Auth Swagger Test Guide

> **Base URL:** `https://localhost:7xxx` or `http://localhost:5xxx` (see launchSettings)  
> **API prefix:** `/api/v1/auth`  
> **Swagger:** `/swagger` (Development)

---

## 1. Register

| Field | Value |
|-------|-------|
| **URL** | `POST /api/v1/auth/register` |
| **Auth** | None |
| **Rate limit** | 5/min per IP |

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "fullName": "Test User"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<opaque>",
    "expiresIn": 3600,
    "refreshExpiresIn": 604800,
    "user": {
      "id": "...",
      "email": "user@example.com",
      "username": "testuser",
      "role": "Student",
      "isPremium": false,
      "emailConfirmed": false
    }
  },
  "message": null,
  "errors": null
}
```

**Expected:** 200 with tokens; verification email OTP sent (check logs if `LoggingEmailService`).

**Errors:** 409 duplicate email/username · 400 validation · 429 rate limit

---

## 2. Verify Email

### Send OTP

| Field | Value |
|-------|-------|
| **URL** | `POST /api/v1/auth/send-email-verification` |
| **Auth** | None |

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (200):** `{ "success": true, "data": { "message": "Verification email sent" } }`

### Verify

| Field | Value |
|-------|-------|
| **URL** | `POST /api/v1/auth/verify-email` |

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Expected:** 200 · `emailConfirmed` true on next login/me

**Errors:** 403 `OTP_INVALID` · `OTP_COOLDOWN` · `OTP_RATE_LIMIT_EXCEEDED`

---

## 3. Login

| Field | Value |
|-------|-------|
| **URL** | `POST /api/v1/auth/login` |
| **Rate limit** | 5/min per IP |

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same shape as Register `LoginResponse`

**Expected:** 200 with new token pair

**Errors:** 404 (bad credentials) · 403 `EMAIL_NOT_CONFIRMED` (if enabled) · 403 `USER_BANNED` · 429

---

## 4. Refresh

| Field | Value |
|-------|-------|
| **URL** | `POST /api/v1/auth/refresh` |
| **Rate limit** | 20/min per user |

**Request:**
```json
{
  "refreshToken": "<from login response>"
}
```

**Response:** New `LoginResponse` with rotated refresh token

**Expected:** 200; old refresh token must not work again (reuse → 403)

**Errors:** 404 `REFRESH_TOKEN_INVALID` · 403 `REFRESH_TOKEN_REUSE_DETECTED` · 403 `USER_BANNED` · 429

---

## 5. Forgot Password

| Field | Value |
|-------|-------|
| **URL** | `POST /api/v1/auth/forgot-password` |

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (200):**
```json
{ "success": true, "data": { "message": "OTP sent" } }
```

**Expected:** Always 200 (even if email unknown)

---

## 6. Verify OTP

| Field | Value |
|-------|-------|
| **URL** | `POST /api/v1/auth/verify-otp` |

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Expected:** 200 — confirms OTP valid without consuming it

**Errors:** 403 `OTP_INVALID` · `OTP_MAX_ATTEMPTS`

---

## 7. Reset Password

| Field | Value |
|-------|-------|
| **URL** | `POST /api/v1/auth/reset-password` |

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Response (200):** `{ "message": "Password reset successful" }`

**Expected:** 200; all refresh tokens revoked; must login again

---

## 8. Logout

| Field | Value |
|-------|-------|
| **URL** | `POST /api/v1/auth/logout` |
| **Auth** | Bearer `{accessToken}` |

**Request:** Empty body

**Response (200):** `{ "message": "Logged out" }`

**Expected:** All refresh tokens revoked; refresh with old token fails

**Note:** Access token remains valid until expiry (~60 min)

---

## Bonus: Get Current User

| Field | Value |
|-------|-------|
| **URL** | `GET /api/v1/auth/me` |
| **Auth** | Bearer |

**Response:** `MeResponse` with profile, streak, premium status

---

## Swagger Authorization

1. Login → copy `accessToken`
2. Click **Authorize** → `Bearer {token}`
3. Call protected endpoints (`/me`, `/logout`)
