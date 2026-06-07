# Google Token Pipeline Audit

Verifies Google Login uses the **same token pipeline** as email/password login.

---

## Shared Entry Point

All login paths terminate at `AuthService.BuildLoginResponseAsync`:

| Login Method | Calls `BuildLoginResponseAsync`? |
|--------------|----------------------------------|
| `RegisterAsync` | Yes |
| `LoginAsync` | Yes |
| `GoogleAuthAsync` | Yes |
| `RefreshAsync` | Yes (after rotation) |

**No duplicated JWT logic.** Google path does not bypass or fork token generation.

---

## Access Token

| Property | Source |
|----------|--------|
| Generator | `JwtTokenService.GenerateAccessToken` |
| Algorithm | HMAC-SHA256 |
| Claims | `sub`, `NameIdentifier`, `Name`, `Email`, `Role`, `isPremium` |
| Issuer / Audience | `JwtSettings.Issuer`, `JwtSettings.Audience` |
| Expiry | `JwtSettings.ExpirationMinutes` (default 60 min) |
| Validation | `JwtBearer` middleware — issuer, audience, lifetime, signing key |

Google-created users receive identical claim structure; `Role` = `Student` from Identity role mapping.

**Verdict: PASS**

---

## Refresh Token

| Property | Source |
|----------|--------|
| Generator | `JwtTokenService.GenerateRefreshTokenValue` — CSPRNG 48 bytes, base64url |
| Storage | `RefreshTokenRepository.AddAsync` — DB row with `UserId`, `Token`, `ExpiresAt`, `IsRevoked` |
| Expiry | `JwtSettings.RefreshExpirationDays` (default 7 days) |
| Returned in | `LoginResponse.RefreshToken` + `RefreshExpiresIn` |

Google login test: `GoogleAuth_GeneratesRefreshToken_AndRefreshRotates` — **PASS**

**Verdict: PASS**

---

## Rotation

`RefreshAsync` flow:

1. `FindByTokenValueAsync` — lookup by token value (includes revoked for reuse detection)
2. If valid and not revoked → `RevokeAsync(stored)` 
3. `BuildLoginResponseAsync` — issues **new** access + refresh pair

Google-issued refresh tokens rotate identically to email-login tokens.

**Verdict: PASS**

---

## Reuse Detection

```csharp
if (stored.IsRevoked) {
    await RevokeAllForUserAsync(stored.UserId);
    throw ForbiddenException(REFRESH_TOKEN_REUSE_DETECTED);
}
```

Applies uniformly regardless of how the original session was created (Google or email).

**Verdict: PASS**

---

## Logout Revoke

`LogoutAsync` → `RevokeAllForUserAsync(userId)` — all active refresh tokens for user marked revoked.

Works for Google-created users (same `UserId` / `RefreshToken.UserId` FK).

**Verdict: PASS**

---

## Password Reset Revoke

`ResetPasswordAsync` → after successful password update:

```csharp
await _refreshTokenRepository.RevokeAllForUserAsync(user.Id, cancellationToken);
```

Google users who reset password via OTP have all sessions invalidated — same as email users.

**Verdict: PASS**

---

## Pipeline Diagram

```
GoogleAuthAsync ──┐
LoginAsync ───────┼──► BuildLoginResponseAsync
RegisterAsync ────┘         │
                            ├── JwtTokenService.GenerateAccessToken
                            ├── JwtTokenService.GenerateRefreshTokenValue
                            └── RefreshTokenRepository.AddAsync

RefreshAsync ──────────────► RevokeAsync(old) → BuildLoginResponseAsync
LogoutAsync ───────────────► RevokeAllForUserAsync
ResetPasswordAsync ────────► RevokeAllForUserAsync
```

---

## Summary

| Capability | Google Login | Email Login | Match? |
|------------|--------------|-------------|--------|
| Access token | `BuildLoginResponseAsync` | Same | **YES** |
| Refresh token | `BuildLoginResponseAsync` | Same | **YES** |
| Rotation | `RefreshAsync` | Same | **YES** |
| Reuse detection | `RefreshAsync` | Same | **YES** |
| Logout revoke | `LogoutAsync` | Same | **YES** |
| Password reset revoke | `ResetPasswordAsync` | Same | **YES** |

**Overall: PASS** — Google Login fully shares the token pipeline.
