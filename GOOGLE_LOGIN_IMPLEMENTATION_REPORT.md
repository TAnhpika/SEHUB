# Google Login — Implementation Report

## Summary

Replaced the insecure stub Google auth (client-supplied email in `idToken`) with **production-safe Google ID Token validation** using `Google.Apis.Auth`. The API contract `{ "idToken": "..." }` is unchanged.

## Security Validation Performed

| Check | Implementation |
|-------|----------------|
| Signature | `GoogleJsonWebSignature.ValidateAsync` (Google JWKS) |
| Issuer | Validated by Google library (`accounts.google.com`) |
| Audience | `GoogleAuthSettings.ClientId` |
| Expiration | Validated by Google library |
| Email trust | Only from validated token payload |
| `email_verified` | Required `true`; otherwise `GOOGLE_TOKEN_INVALID` |
| Client spoofing | Rejected — raw email strings no longer accepted |

## Endpoint Contract

```
POST /api/v1/auth/google
Authorization: none
Rate limit: GoogleLoginPolicy (5/min per IP in production)

Request:
{
  "idToken": "<Google ID Token from client SDK>"
}

Response 200 (LoginResponse):
{
  "success": true,
  "data": {
    "accessToken": "...",
    "expiresIn": 3600,
    "refreshToken": "...",
    "refreshExpiresIn": 604800,
    "user": { ... }
  }
}

Response 403 (invalid token):
{
  "success": false,
  "message": "Google token không hợp lệ hoặc đã hết hạn",
  "errors": [{ "field": "google", "message": "GOOGLE_TOKEN_INVALID" }]
}
```

### Behavior

| Case | Action |
|------|--------|
| Valid token + existing user (by email) | Login; auto-confirm email if unconfirmed |
| Valid token + new user | Create Student, `EmailConfirmed = true`, login |
| Invalid / expired / wrong audience | 403 `GOOGLE_TOKEN_INVALID` |
| Banned user | 403 `ACCOUNT_BANNED` |

Tokens use **`BuildLoginResponseAsync`** — same access/refresh pipeline as email login.

## Files Modified

### New

| File | Purpose |
|------|---------|
| `SEHub.Application/Auth/GoogleAuthSettings.cs` | `ClientId`, `ClientSecret` config |
| `SEHub.Application/Models/GoogleTokenPayload.cs` | Validated claim model |
| `SEHub.Application/Abstractions/IGoogleTokenValidator.cs` | Validator abstraction |
| `SEHub.Application/Auth/Validators/GoogleAuthRequestValidator.cs` | Non-empty `IdToken` |
| `SEHub.Infrastructure/Auth/GoogleTokenValidator.cs` | Google.Apis.Auth validation |
| `tests/.../FakeGoogleTokenValidator.cs` | Integration test double |
| `tests/.../GoogleAuthEndpointsTests.cs` | 8 integration tests |
| `tests/.../StrictRateLimitWebApplicationFactory.cs` | Rate-limit test isolation |

### Updated

| File | Change |
|------|--------|
| `AuthService.cs` | Validate token → find/create user → `BuildLoginResponseAsync` |
| `UserRepository.cs` | Google users created with `EmailConfirmed = true` |
| `UserAccount.cs` / `CreateUserModel` | `EmailConfirmed` flag on create |
| `ErrorCodes.cs` | `GOOGLE_TOKEN_INVALID` |
| `ExceptionHandlingMiddleware.cs` | Map Google token errors |
| `AuthController.cs` | `GoogleLoginPolicy` rate limiting |
| `AuthRateLimitExtensions.cs` | `GoogleLoginPolicy` + runtime config resolution |
| `AuthRateLimitPolicies.cs` | `GoogleLogin` policy name |
| `DependencyInjection.cs` (App + Infra) | Register validator, settings, FluentValidation |
| `appsettings.json` / `appsettings.Development.json` | `Google` section |
| `appsettings.Development.Local.json.example` | Google OAuth placeholders |
| `SEHub.Infrastructure.csproj` | `Google.Apis.Auth` package |
| `AuthServiceTests.cs` | 4 Google unit tests |
| `CustomWebApplicationFactory.cs` | Fake validator + relaxed rate limits |

## Configuration

```json
"Google": {
  "ClientId": "your-client-id.apps.googleusercontent.com",
  "ClientSecret": "your-client-secret"
}
```

- **Development:** `appsettings.Development.json` (empty placeholders)
- **Local secrets:** copy `appsettings.Development.Local.json.example` → `appsettings.Development.Local.json` or use User Secrets:
  ```bash
  dotnet user-secrets set "Google:ClientId" "..." --project src/SEHub.API
  dotnet user-secrets set "Google:ClientSecret" "..." --project src/SEHub.API
  ```
- **Note:** ID token validation uses `ClientId` only; `ClientSecret` is stored for future OAuth flows.

## Test Results

### `dotnet build`

```
Build succeeded. 0 Error(s)
```

### `dotnet test`

| Project | Result |
|---------|--------|
| `SEHub.Application.UnitTests` | **PASS** — 21/21 |
| `SEHub.API.IntegrationTests` | **PASS** — 25/25 |

### Google Test Coverage

| Test | Result |
|------|--------|
| Valid token — existing user login | PASS |
| Valid token — new user registration (Student, EmailConfirmed) | PASS |
| Invalid token | PASS |
| Expired token | PASS |
| Wrong audience token | PASS |
| Unverified email token | PASS |
| Refresh token generation + rotation | PASS |
| Duplicate login — no duplicate accounts | PASS |
| Unit: valid existing user | PASS |
| Unit: valid new user | PASS |
| Unit: invalid token | PASS |
| Unit: banned user | PASS |

## Swagger Manual Test Guide

### Prerequisites

1. Set `Google:ClientId` in local config (must match your Google Cloud OAuth client).
2. Obtain a real ID token from Google Sign-In (web/mobile SDK) for a test account.

### Steps

1. Open Swagger: `http://localhost:5006/swagger`
2. `POST /api/v1/auth/google`
   ```json
   { "idToken": "<paste Google ID token>" }
   ```
3. Expected: **200** with `accessToken`, `refreshToken`, and `user` object.
4. Copy `accessToken` → Authorize → Bearer token.
5. `GET /api/v1/auth/me` → should return authenticated profile.

### Negative tests

| Input | Expected |
|-------|----------|
| `{ "idToken": "" }` | 400 validation error |
| `{ "idToken": "not-a-jwt" }` | 403 `GOOGLE_TOKEN_INVALID` |
| `{ "idToken": "victim@gmail.com" }` | 403 (no longer accepts raw email) |

## Unchanged Flows

Email/password login, OTP, forgot password, email verification, refresh token rotation/reuse detection, role system, and existing DTO contracts (except internal validation) remain intact.
