# Refresh Token Implementation Report

> **Date:** 2026-06-06  
> **Status:** Complete  
> **Scope:** Backend auth refresh token issuance, storage, rotation, revocation

---

## Executive Summary

The approved Refresh Token plan is fully implemented. Login, register, and Google auth issue opaque refresh tokens stored in the `RefreshTokens` table. `POST /api/v1/auth/refresh` rotates tokens with reuse detection. Logout and password reset revoke all refresh tokens for the user.

**Test results:** 21/21 passed (15 unit, 6 integration).

---

## Requirement Traceability

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| 1 | Login generates refresh token | ✅ | `LoginAsync` → `BuildLoginResponseAsync` |
| 2 | Register generates refresh token | ✅ | `RegisterAsync` → `BuildLoginResponseAsync` |
| 3 | Refresh token stored in DB | ✅ | `IRefreshTokenRepository.AddAsync` + `SaveChangesAsync` |
| 4 | `POST /api/v1/auth/refresh` | ✅ | `AuthController.Refresh` → `AuthService.RefreshAsync` |
| 5 | Refresh token rotation | ✅ | Revoke old token, issue new pair on every refresh |
| 6 | Revoke old token | ✅ | `RevokeAsync(stored)` before `BuildLoginResponseAsync` |
| 7 | Revoke all on logout | ✅ | `LogoutAsync` → `RevokeAllForUserAsync` |
| 8 | Revoke all on password reset | ✅ | `ResetPasswordAsync` → `RevokeAllForUserAsync` |

---

## Architecture

```
Login / Register / Google / Refresh
        │
        ▼
BuildLoginResponseAsync
  ├─ GenerateAccessToken (JWT, 60 min)
  ├─ GenerateRefreshTokenValue (48-byte CSPRNG → Base64Url)
  ├─ AddAsync(RefreshToken) → RefreshTokens table
  ├─ SaveChangesAsync
  └─ Return LoginResponse { accessToken, refreshToken, refreshExpiresIn, user }

POST /auth/refresh
  ├─ FindByTokenValueAsync (includes revoked — reuse detection)
  ├─ Invalid → 403 REFRESH_TOKEN_INVALID
  ├─ Revoked → RevokeAllForUserAsync → 403 REFRESH_TOKEN_REUSE_DETECTED
  ├─ Expired → 403 REFRESH_TOKEN_EXPIRED
  ├─ RevokeAsync(old) → rotation step 1
  └─ BuildLoginResponseAsync → rotation step 2 (new pair)
```

---

## API Contract

### Extended `LoginResponse`

```json
{
  "accessToken": "eyJ...",
  "expiresIn": 3600,
  "refreshToken": "kR7x...opaque...",
  "refreshExpiresIn": 604800,
  "user": { "id": "...", "role": "Student", "isPremium": false }
}
```

### New endpoint

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/api/v1/auth/refresh` | Anonymous | `{ "refreshToken": "..." }` |

**Response:** Same `LoginResponse` shape as login/register.

**Error codes (403):**

| Code | Condition |
|------|-----------|
| `REFRESH_TOKEN_INVALID` | Token not found in DB |
| `REFRESH_TOKEN_EXPIRED` | `ExpiresAt < UtcNow` |
| `REFRESH_TOKEN_REUSE_DETECTED` | Revoked token presented; all user sessions revoked |

---

## Files Modified

| Layer | File | Change |
|-------|------|--------|
| Shared | `ErrorCodes.cs` | `RefreshTokenInvalid`, `RefreshTokenExpired`, `RefreshTokenReuseDetected` |
| Contracts | `LoginResponse.cs` | `RefreshToken`, `RefreshExpiresIn` |
| Contracts | `RefreshTokenRequest.cs` | New DTO |
| Application | `JwtSettings.cs` | `RefreshExpirationDays` (default 7) |
| Application | `IJwtTokenService.cs` | `GenerateRefreshTokenValue()` |
| Application | `JwtTokenService.cs` | CSPRNG implementation |
| Application | `IAuthService.cs` | `RefreshAsync` |
| Application | `AuthService.cs` | Issuance in `BuildLoginResponseAsync`; `RefreshAsync` with rotation/reuse |
| Application | `IRefreshTokenRepository.cs` | `FindByTokenValueAsync` |
| Application | `RefreshTokenRequestValidator.cs` | FluentValidation |
| Application | `DependencyInjection.cs` | Validator registration |
| Infrastructure | `RefreshTokenRepository.cs` | `FindByTokenValueAsync` implementation |
| API | `AuthController.cs` | `POST refresh` |
| API | `appsettings.json` | `Jwt:RefreshExpirationDays: 7` |
| Tests | `AuthServiceTests.cs` | Login issuance, rotation, reuse, expiry |
| Tests | `AuthEndpointsTests.cs` | E2E login → refresh → old token rejected |

**No DB migration required** — `RefreshTokens` table existed from `InitialCreate`.

---

## Key Implementation Details

### Token generation (`JwtTokenService.GenerateRefreshTokenValue`)

- 48-byte `RandomNumberGenerator.Fill`
- Base64Url encoding (~64 chars, fits `nvarchar(256)`)

### Centralized issuance (`BuildLoginResponseAsync`)

Called by:

- `RegisterAsync` (line 169)
- `LoginAsync` (line 215)
- `GoogleAuthAsync` (line 259)
- `RefreshAsync` (line 527)

Each call persists a new `RefreshToken` row and returns both tokens in `LoginResponse`.

### Rotation (`RefreshAsync`)

1. Lookup token including revoked rows (`FindByTokenValueAsync`)
2. Reuse detection: revoked token → `RevokeAllForUserAsync` + throw
3. Expiry check
4. User load + ban check
5. `RevokeAsync(stored)` — marks old token revoked
6. `BuildLoginResponseAsync` — issues new access + refresh pair

### Revocation on logout / reset

```csharp
// LogoutAsync
await _refreshTokenRepository.RevokeAllForUserAsync(userId, cancellationToken);

// ResetPasswordAsync
await _refreshTokenRepository.RevokeAllForUserAsync(user.Id, cancellationToken);
```

---

## Configuration

```json
"Jwt": {
  "ExpirationMinutes": 60,
  "RefreshExpirationDays": 7
}
```

| Setting | Default | Purpose |
|---------|---------|---------|
| `ExpirationMinutes` | 60 | Access JWT lifetime |
| `RefreshExpirationDays` | 7 | Refresh token lifetime |

---

## Test Results

```
dotnet test --verbosity minimal
```

| Suite | Passed | Failed | Total |
|-------|--------|--------|-------|
| SEHub.Application.UnitTests | 15 | 0 | 15 |
| SEHub.API.IntegrationTests | 6 | 0 | 6 |
| **Total** | **21** | **0** | **21** |

### Unit tests (`AuthServiceTests`)

| Test | Verifies |
|------|----------|
| `LoginAsync_OnSuccess_ReturnsAccessAndRefreshTokens` | Login issues refresh + `AddAsync` called |
| `RefreshAsync_WithValidToken_RotatesAndReturnsNewPair` | Rotation: revoke old, issue new |
| `RefreshAsync_WithRevokedToken_RevokesAllAndThrowsReuseDetected` | Reuse detection |
| `RefreshAsync_WithExpiredToken_ThrowsExpired` | Expiry validation |

### Integration tests (`AuthEndpointsTests`)

| Test | Verifies |
|------|----------|
| `Login_ThenGetMe_ReturnsAuthenticatedProfile` | Login response includes `refreshToken` |
| `Login_ThenRefresh_ReturnsNewAccessTokenAndRotatesRefresh` | E2E refresh + old token returns 403 |

---

## Security Notes

| Topic | Approach |
|-------|----------|
| Token format | Opaque (not JWT) |
| Generation | 48-byte CSPRNG |
| Rotation | Every refresh invalidates previous token |
| Reuse detection | Revoked token reuse revokes all user sessions |
| Delivery | JSON body (`refreshToken` in `LoginResponse`) |
| Access token on logout | Not blacklisted (60-min TTL; out of scope) |
| Storage at rest | Plain opaque in DB (hashing is P2) |

---

## Out of Scope (unchanged)

- JWT access-token blacklist
- HttpOnly cookie delivery
- Refresh token hashing at rest
- Rate limiting on `/auth/refresh`
- Frontend wiring (documented in `FE_AUTH_INTEGRATION_GUIDE.md`)

---

## Related Documentation

- `REFRESH_TOKEN_IMPLEMENTATION_PLAN.md` — design plan
- `FE_AUTH_INTEGRATION_GUIDE.md` — frontend integration guide
