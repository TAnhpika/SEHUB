# Auth API Contract

Base URL: `http://localhost:5006` (configurable via `VITE_API_BASE_URL`)

All successful responses are wrapped:

```json
{
  "success": true,
  "data": { },
  "message": null,
  "errors": []
}
```

Error envelope:

```json
{
  "success": false,
  "data": null,
  "message": "Human-readable summary",
  "errors": [{ "field": "email", "message": "Email is required." }]
}
```

HTTP status codes: `400` validation, `401` unauthorized, `404` not found, `409` conflict, `429` rate limit, `500` server error.

---

## POST /api/v1/auth/register

**Auth:** Anonymous  
**Rate limit:** Yes (register policy)

### Request

```json
{
  "email": "student@example.com",
  "username": "student_example",
  "password": "Student@123",
  "displayName": "Student User"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email, max 256 |
| `username` | Required, 3–50 chars, `^[a-zA-Z0-9_]+$` |
| `password` | Required, 8–128 chars |
| `displayName` | Optional, max 100 |

### Response `data` (LoginResponse)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "refreshToken": "base64url-token",
  "refreshExpiresIn": 604800,
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "username": "student_example",
    "email": "student@example.com",
    "displayName": "Student User",
    "role": "Student",
    "isPremium": false,
    "avatarUrl": null,
    "points": 0,
    "levelName": "Bronze"
  }
}
```

### Errors

- `409` — email/username already exists
- `400` — validation failures
- `429` — too many register attempts

---

## POST /api/v1/auth/verify-email

**Auth:** Anonymous

### Request

```json
{
  "email": "student@example.com",
  "code": "123456"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email, max 256 |
| `code` | Required, exactly 6 chars |

### Response `data`

```json
{ "message": "Email verified" }
```

### Errors

- `400` — invalid/expired OTP
- `404` — user not found

---

## POST /api/v1/auth/login

**Auth:** Anonymous  
**Rate limit:** Yes (login policy)

### Request

```json
{
  "emailOrUsername": "student@example.com",
  "password": "Student@123"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `emailOrUsername` | Required, max 256 |
| `password` | Required |

### Response `data`

Same `LoginResponse` shape as register.

### Errors

- `401` — invalid credentials
- `429` — too many login attempts

---

## POST /api/v1/auth/google

**Auth:** Anonymous  
**Rate limit:** Yes (google policy)

### Request

```json
{
  "idToken": "<Google GIS credential JWT>"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `idToken` | Required, non-empty; validated server-side via Google.Apis.Auth |

### Response `data`

Same `LoginResponse` shape.

### Errors

- `401` — invalid Google token
- `400` — missing idToken
- `429` — rate limited

**BE config:** `Google:ClientId` must match FE `VITE_GOOGLE_CLIENT_ID`.

---

## POST /api/v1/auth/refresh

**Auth:** Anonymous (uses refresh token body)  
**Rate limit:** Yes (refresh policy)

### Request

```json
{
  "refreshToken": "base64url-token"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `refreshToken` | Required, max 256 |

### Response `data`

Same `LoginResponse` shape (rotated tokens).

### Errors

- `401` — invalid/expired/revoked refresh token
- `429` — rate limited

---

## POST /api/v1/auth/logout

**Auth:** Bearer JWT required

### Request

No body.

### Response `data`

```json
{ "message": "Logged out" }
```

### Errors

- `401` — missing/invalid access token

---

## POST /api/v1/auth/forgot-password

**Auth:** Anonymous

### Request

```json
{
  "email": "student@example.com"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email |

### Response `data`

```json
{ "message": "OTP sent" }
```

### Errors

- `404` — email not registered (may return generic message for security)
- `400` — validation

---

## POST /api/v1/auth/verify-otp

**Auth:** Anonymous

### Request

```json
{
  "email": "student@example.com",
  "code": "123456"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required |
| `code` | Required, 6 chars |

### Response `data`

```json
{ "message": "OTP verified" }
```

### Errors

- `400` — invalid OTP
- `404` — user not found

---

## POST /api/v1/auth/reset-password

**Auth:** Anonymous

### Request

```json
{
  "email": "student@example.com",
  "code": "123456",
  "newPassword": "NewPass@123"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email |
| `code` | Required, 6 chars |
| `newPassword` | 8–128, uppercase, lowercase, digit, special char |

### Response `data`

```json
{ "message": "Password reset successful" }
```

### Errors

- `400` — validation or invalid OTP
- `500` — Identity password policy (fixed in BE)

---

## GET /api/v1/auth/me

**Auth:** Bearer JWT required

### Request

No body.

### Response `data` (MeResponse)

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "username": "student_example",
  "email": "student@example.com",
  "displayName": "Student User",
  "role": "Student",
  "isPremium": false,
  "avatarUrl": null,
  "points": 0,
  "levelName": "Bronze"
}
```

### Errors

- `401` — expired/invalid token

---

## Additional BE Endpoints (not in contract scope, no FE UI)

| Method | URL | Purpose |
|--------|-----|---------|
| POST | `/api/v1/auth/send-email-verification` | Resend verification OTP |
| POST | `/api/v1/auth/send-sms-otp` | SMS OTP |
| POST | `/api/v1/auth/verify-sms-otp` | Verify SMS |

---

## Swagger

Available at `/swagger` when running `SEHub.API` in Development. Documents same DTOs and response envelope.
