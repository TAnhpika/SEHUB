# SEHub — Access Token Audit

> **Date:** 2026-06-06  
> **Method:** Source code + CodeGraph (`JwtTokenService`, `BuildLoginResponseAsync`)  
> **Files:** `JwtTokenService.cs` · `AuthService.cs` · `ServiceCollectionExtensions.cs` · `LoginResponse.cs`

---

## Summary

| Check | Result |
|-------|--------|
| Access token returned on login | **PASS** |
| JWT issuer configured | **PASS** |
| JWT audience configured | **PASS** |
| Expiration configured | **PASS** (60 min default) |
| Claims complete for auth | **PASS** |
| Role claim present | **PASS** |
| Premium claim present | **PASS** (UI hint; authorization uses DB) |
| Middleware validation | **PASS** |

---

## CHECK 1 — Login Response

When user logs in via `POST /api/v1/auth/login`, `register`, or `google`:

| Field | Returned? | Source |
|-------|-----------|--------|
| **Access Token** | ✅ Yes | `LoginResponse.AccessToken` |
| **Refresh Token** | ❌ No | Not in DTO; not generated |
| **Expiration** | ✅ Yes | `LoginResponse.ExpiresIn` (seconds) |

### Actual DTO — `LoginResponse`

```3:8:SEHub.Backend/src/SEHub.Contracts/Auth/LoginResponse.cs
public sealed class LoginResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public int ExpiresIn { get; init; }
    public AuthUserDto User { get; init; } = null!;
}
```

### Actual DTO — `AuthUserDto` (nested in login response)

```3:14:SEHub.Backend/src/SEHub.Contracts/Auth/AuthUserDto.cs
public sealed class AuthUserDto
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public bool IsPremium { get; init; }
    public string? AvatarUrl { get; init; }
    public int Points { get; init; }
    public string? LevelName { get; init; }
}
```

### Build chain

```274:285:SEHub.Backend/src/SEHub.Application/Auth/AuthService.cs
    private async Task<LoginResponse> BuildLoginResponseAsync(UserAccount user, CancellationToken cancellationToken)
    {
        var isPremium = await IsPremiumAsync(user.Id, cancellationToken);
        var (accessToken, expiresIn) = _jwtTokenService.GenerateAccessToken(user, isPremium);
        var profile = await _profileRepository.GetByUserIdAsync(user.Id, cancellationToken);

        return new LoginResponse
        {
            AccessToken = accessToken,
            ExpiresIn = expiresIn,
            User = BuildAuthUserDto(user, isPremium, profile?.AvatarUrl)
        };
    }
```

**CodeGraph callers of `BuildLoginResponseAsync`:** `RegisterAsync`, `LoginAsync`, `GoogleAuthAsync`

### Example response shape (envelope unwrapped by FE)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "username": "demo.student",
      "email": "demo.student@sehub.local",
      "displayName": "Demo Student",
      "role": "Student",
      "isPremium": false,
      "avatarUrl": null,
      "points": 120,
      "levelName": "Bronze"
    }
  }
}
```

---

## JWT Configuration

| Setting | Value (default `appsettings.json`) | File |
|---------|-----------------------------------|------|
| **Issuer** | `SEHub` | `appsettings.json:7` |
| **Audience** | `SEHub.Client` | `appsettings.json:8` |
| **Secret** | `SEHub-Dev-Secret-Key-Min-32-Chars-Long!` | `appsettings.json:6` |
| **ExpirationMinutes** | `60` | `appsettings.json:9` |
| **ExpiresIn (response)** | `3600` seconds (`ExpirationMinutes * 60`) | `JwtTokenService.cs:21` |

---

## Claims Issued

```25:33:SEHub.Backend/src/SEHub.Application/Auth/JwtTokenService.cs
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
            new("isPremium", isPremium.ToString().ToLowerInvariant())
        };
```

| Claim | Type | Purpose |
|-------|------|---------|
| `sub` | `JwtRegisteredClaimNames.Sub` | User ID (Guid string) |
| `NameIdentifier` | `ClaimTypes.NameIdentifier` | User ID (duplicate for ASP.NET) |
| `Name` | `ClaimTypes.Name` | Username |
| `Email` | `ClaimTypes.Email` | Email address |
| **Role** | `ClaimTypes.Role` | `Student` / `Moderator` / `Admin` |
| **isPremium** | Custom `"isPremium"` | `"true"` / `"false"` — **UI hint only** |

> **Note:** `RequirePremium` policy uses `PremiumAuthorizationHandler` → DB subscription check, not JWT `isPremium` claim (`ARCHITECTURE-BE.md` §1.7).

---

## Token Generation

```35:42:SEHub.Backend/src/SEHub.Application/Auth/JwtTokenService.cs
        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes),
            signingCredentials: credentials);
```

- **Algorithm:** HMAC-SHA256 (`SecurityAlgorithms.HmacSha256`)
- **Signing key:** Symmetric key from `Jwt:Secret`

---

## Middleware Validation

```76:86:SEHub.Backend/src/SEHub.API/Extensions/ServiceCollectionExtensions.cs
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
```

**Pipeline order** (`Program.cs`): `UseAuthentication()` → `BannedUserMiddleware` → `UseAuthorization()`

Expired or invalid tokens → **401** from JWT bearer middleware.

---

## Authorization Policies (post-authentication)

| Policy | Requirement |
|--------|-------------|
| `RequireAuthenticated` | Valid JWT |
| `RequirePremium` | JWT + active `Subscription` in DB |
| `RequireModerator` | JWT + role `Moderator` or `Admin` |
| `RequireAdmin` | JWT + role `Admin` |

`CurrentUserService` reads `sub` / `NameIdentifier` for `UserId`, `ClaimTypes.Role` for role.

---

## Findings

| # | Finding | Severity |
|---|---------|----------|
| 1 | Access token fully implemented for login/register/google | — |
| 2 | `isPremium` in JWT can become stale until re-login; premium gates use DB | Low (by design) |
| 3 | No refresh token in login response | High (see `REFRESH_TOKEN_AUDIT.md`) |
| 4 | Dev JWT secret in committed `appsettings.json` | Medium (use secrets in prod) |
