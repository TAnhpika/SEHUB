# SEHub — Refresh Token Audit

> **Date:** 2026-06-06  
> **Method:** Source code + CodeGraph (`RefreshToken`, `RefreshTokenRepository`, `RevokeAllForUserAsync`)

---

## Summary

| Check | Result |
|-------|--------|
| Refresh token returned on login | **FAIL** |
| Refresh token entity exists | **PASS** |
| Database table exists | **PASS** |
| Tokens stored in DB on login | **FAIL** |
| Expiration field on entity | **PASS** (never populated) |
| Revocation support in repository | **PASS** |
| Refresh API endpoint | **FAIL** |

**Overall refresh token system: INFRASTRUCTURE ONLY — not operational**

---

## Entity — `RefreshToken`

```5:11:SEHub.Backend/src/SEHub.Domain/Entities/RefreshToken.cs
public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
}
```

Inherits from `BaseEntity`: `Id`, `CreatedAt`, `UpdatedAt`.

---

## Database

| Item | Detail |
|------|--------|
| **Table** | `RefreshTokens` |
| **DbSet** | `SEHubDbContext.RefreshTokens` (line 17) |
| **Migration** | `20260605033348_InitialCreate.cs` |
| **Indexes** | Unique on `Token`; index on `UserId` (`RefreshTokenConfiguration.cs`) |

### Schema columns

| Column | Type | Purpose |
|--------|------|---------|
| `Id` | `uniqueidentifier` | PK |
| `UserId` | `uniqueidentifier` | Owner |
| `Token` | `nvarchar(256)` | Opaque refresh token string |
| `ExpiresAt` | `datetime2` | Expiry |
| `IsRevoked` | `bit` | Revocation flag |
| `CreatedAt` | `datetime2` | Audit |
| `UpdatedAt` | `datetime2` | Audit |

---

## Repository — `IRefreshTokenRepository`

```5:11:SEHub.Backend/src/SEHub.Application/Abstractions/Repositories/IRefreshTokenRepository.cs
public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);
    Task RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task RevokeAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);
}
```

### Implementation behaviors

| Method | Behavior | File |
|--------|----------|------|
| `GetByTokenAsync` | Find by token where `!IsRevoked` | `RefreshTokenRepository.cs:13-14` |
| `AddAsync` | Insert new row | `RefreshTokenRepository.cs:16-17` |
| `RevokeAllForUserAsync` | Set `IsRevoked=true` for all active user tokens | `RefreshTokenRepository.cs:19-25` |
| `RevokeAsync` | Set `IsRevoked=true` on single token | `RefreshTokenRepository.cs:27-30` |

---

## Critical Gap: Tokens Never Issued

**CodeGraph / grep finding:** `IRefreshTokenRepository.AddAsync` is **never called** from `AuthService` or any other application service.

`BuildLoginResponseAsync` only calls `JwtTokenService.GenerateAccessToken` — no refresh token creation:

```274:285:SEHub.Backend/src/SEHub.Application/Auth/AuthService.cs
        var (accessToken, expiresIn) = _jwtTokenService.GenerateAccessToken(user, isPremium);
        // No refreshTokenRepository.AddAsync(...)
        return new LoginResponse { AccessToken = accessToken, ExpiresIn = expiresIn, User = ... };
```

`LoginResponse` has **no** `RefreshToken` property.

---

## Revocation — Where Used

| Trigger | Action | CodeGraph caller |
|---------|--------|------------------|
| `POST /api/v1/auth/logout` | `RevokeAllForUserAsync(currentUserId)` | `LogoutAsync` |
| `POST /api/v1/auth/reset-password` | `RevokeAllForUserAsync(user.Id)` | `ResetPasswordAsync` |

Both paths update DB via `IUnitOfWork.SaveChangesAsync`.

> Because no refresh tokens are ever inserted, revocation is effectively a **no-op** in normal operation.

---

## Expiration

- Entity has `ExpiresAt` field.
- **No code** sets refresh token expiry (no token creation).
- **No configured** `RefreshTokenExpirationDays` in `JwtSettings` or `appsettings.json`.

---

## Multi-Device Support (schema readiness)

| Aspect | Status |
|--------|--------|
| Multiple rows per `UserId` | ✅ Schema allows |
| Per-device token tracking | ❌ No `DeviceId` / `UserAgent` field |
| Per-login token issuance | ❌ Not implemented |

---

## Comparison to ARCHITECTURE-BE.md

| ARCH-BE expectation | Actual |
|---------------------|--------|
| `RefreshToken` entity with expiry | ✅ Entity exists |
| Logout revokes refresh token | ✅ Code exists |
| Refresh token returned on login | ❌ Not implemented |
| `POST /auth/refresh` | ❌ Not implemented |

---

## Recommended Implementation (audit only — not applied)

1. Add `RefreshToken` + `RefreshExpiresIn` to `LoginResponse` (or HttpOnly cookie).
2. On `BuildLoginResponseAsync`: generate opaque token, `AddAsync` with `ExpiresAt` (e.g. 7–30 days).
3. Add `POST /api/v1/auth/refresh` with rotation (revoke old, issue new pair).
4. Configure `Jwt:RefreshExpirationDays` in settings.
