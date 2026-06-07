# Auth Security Hardening Plan

> **Date:** 2026-06-06  
> **Status:** Plan only — **do not implement yet**  
> **Scope:** Refresh token hashing at rest + ASP.NET Core Rate Limiting on auth endpoints

---

## Overview

Two hardening tracks based on audit findings:

| Track | Problem | Solution |
|-------|---------|----------|
| A. Refresh Token Hashing | Plain-text tokens in `RefreshTokens.Token` | SHA256 hash at rest; compare via hash |
| B. Rate Limiting | No HTTP-level throttling on auth endpoints | Built-in `Microsoft.AspNetCore.RateLimiting` (.NET 8) |

---

# A. Refresh Token Hashing

## Requirements Mapping

| Requirement | Approach |
|-------------|----------|
| Never store raw value in DB | Hash before `AddAsync`; store hash in `Token` column |
| SHA256 hash | Reuse `OtpService.HashCode` pattern or shared `TokenHashing` utility |
| Compare incoming token using hash | Hash `request.RefreshToken` before repository lookup |
| API contract unchanged | Client still sends/receives plain opaque string |
| Rotation unchanged | `RevokeAsync` + `BuildLoginResponseAsync` flow preserved |
| Reuse detection unchanged | `FindByTokenValueAsync` still includes revoked rows; same `IsRevoked` logic |

## Proposed Hash Function

Align with existing OTP pattern for consistency:

```csharp
// Same as OtpService.HashCode — SHA256, lowercase hex, 64 chars
SHA256.HashData(Encoding.UTF8.GetBytes(plainToken))
→ Convert.ToHexString(bytes).ToLowerInvariant()
```

| Property | Value |
|----------|-------|
| Input | Plain Base64Url refresh token (~64 chars) |
| Output | 64-char hex string |
| Fits `nvarchar(256)` | Yes |
| Unique index | Still valid (SHA256 collision risk negligible) |

## Architecture Change

```
BEFORE:
  Generate → store plain → lookup WHERE Token = plain

AFTER:
  Generate plain → return plain to client
                → store SHA256(plain) in DB
  Refresh: hash(incoming) → lookup WHERE Token = hash(stored)
```

## Files to Modify

| File | Change |
|------|--------|
| **New** `SEHub.Application/Auth/ITokenHashingService.cs` | `string HashToken(string plainToken)` |
| **New** `SEHub.Application/Auth/TokenHashingService.cs` | SHA256 implementation (extract from `OtpService.HashCode`) |
| `SEHub.Application/DependencyInjection.cs` | Register `ITokenHashingService` |
| `AuthService.cs` | Hash before `AddAsync`; hash before `FindByTokenValueAsync` |
| `RefreshTokenRepository.cs` | No logic change if caller passes hash; optional rename of param docs |
| `IRefreshTokenRepository.cs` | Document that `token` param expects **hash** |
| `RefreshToken.cs` | Optional XML doc: `Token` holds hash, not plain value |
| `RefreshTokenConfiguration.cs` | No schema change required |
| `OtpService.cs` | Optional refactor to use shared `ITokenHashingService` (low priority) |
| `AuthServiceTests.cs` | Update mocks to expect hashed values in `AddAsync` / lookup |
| `AuthEndpointsTests.cs` | Should pass unchanged (E2E uses plain tokens in API) |

**No changes required:**

- `LoginResponse.cs`, `RefreshTokenRequest.cs` (API contract)
- `JwtTokenService.cs` (still generates plain opaque values)
- `AuthController.cs`
- Rotation / reuse / revoke logic in `AuthService`

## Migration Impact

| Item | Impact |
|------|--------|
| Schema change | **None** — `Token` column `nvarchar(256)` accommodates SHA256 hex (64 chars) |
| New EF migration | **Not required** for column type |
| Data migration | **Required** — existing rows contain plain tokens |

### Data Migration Strategy (recommended)

**Option 1 — Invalidate all existing sessions (recommended):**

```sql
-- One-time on deploy
UPDATE RefreshTokens SET IsRevoked = 1 WHERE IsRevoked = 0;
-- Or: DELETE FROM RefreshTokens;
```

- Pros: Simple, secure, no dual-read path
- Cons: All users must re-login once

**Option 2 — Dual-lookup transition (not recommended):**

- Lookup by hash first; fallback to plain compare
- Adds complexity and prolongs plain-text exposure

**Recommendation:** Option 1. Document in release notes: "Deploy invalidates all refresh tokens."

## Backward Compatibility

| Concern | Impact |
|---------|--------|
| API request/response shape | ✅ Unchanged |
| Client refresh flow | ✅ Unchanged (sends plain token) |
| Existing DB rows | ❌ Incompatible — must revoke/delete on deploy |
| `GetByTokenAsync` (unused) | Update to hash param if kept; or remove dead method |
| Integration tests | ✅ Pass after data seed uses new hash path |
| Unique index | ✅ Still works on hash values |

## Implementation Order

1. Add `ITokenHashingService` + implementation
2. Update `BuildLoginResponseAsync` to store hash
3. Update `RefreshAsync` to hash before lookup
4. Add one-time data migration script (revoke all)
5. Update unit tests
6. Run integration tests

---

# B. Rate Limiting

## Requirements Mapping

| Endpoint | Target Limit | Partition Key |
|----------|--------------|---------------|
| `POST /auth/login` | 5 / minute / IP | Client IP |
| `POST /auth/register` | 5 / minute / IP | Client IP |
| `POST /auth/refresh` | 20 / minute / user | UserId (after token lookup) |
| `POST /auth/forgot-password` | 3 / 10 minutes / email | Email from body |
| `POST /auth/send-email-verification` | 3 / 10 minutes / email | Email from body |
| `POST /auth/verify-email` | 10 / 10 minutes / email | Email from body |
| `POST /auth/verify-otp` | 10 / 10 minutes / email | Email from body |
| `POST /auth/reset-password` | — | Inherits verify-email OTP limits (or same 10/10min/email) |

## Technology Choice

Use **built-in ASP.NET Core Rate Limiting** (`Microsoft.AspNetCore.RateLimiting`) — included in .NET 8, no extra NuGet package.

```csharp
builder.Services.AddRateLimiter(...);
app.UseRateLimiter();  // after routing, before endpoints
```

## Architecture

```
Request
  │
  ▼
ExceptionHandlingMiddleware
  │
  ▼
UseRateLimiter  ◄── NEW (after CORS, before auth)
  │
  ├─ Policy: auth-login-ip        → login, register
  ├─ Policy: auth-refresh-user    → refresh (per-user partition)
  ├─ Policy: auth-email-send      → forgot-password, send-email-verification
  └─ Policy: auth-email-verify    → verify-email, verify-otp, reset-password
  │
  ▼
AuthController
```

### Partition Key Resolution

| Policy | Resolver |
|--------|----------|
| IP-based (login, register) | `httpContext.Connection.RemoteIpAddress` with `X-Forwarded-For` fallback |
| Email-based (OTP endpoints) | Read `email` from JSON body via custom `RateLimitPartition` resolver |
| Refresh per-user | **Application-level** counter in `AuthService.RefreshAsync` keyed by `UserId` after DB lookup (see below) |

### Refresh Endpoint — Per-User Limit

Built-in rate limiter runs **before** the controller and cannot know `UserId` without parsing the refresh token and hitting the DB. Two options:

| Option | Pros | Cons |
|--------|------|------|
| **B1. App-level in `RefreshAsync`** | Accurate per-user; no body parsing in middleware | Not a middleware 429; custom error code |
| **B2. IP-based proxy for refresh** | Simple middleware | Not per-user as required |
| **B3. Endpoint filter** | Runs at MVC layer; can call repository | More complex; still needs DB lookup |

**Recommendation:** **B1 + B2 hybrid**

- Middleware: IP-based fallback (e.g. 60/min/IP) on `/auth/refresh` to block blind flooding
- Application: `IMemoryCache` counter in `RefreshAsync` after `FindByTokenValueAsync` — 20/min per `UserId`

This satisfies "20 requests / minute / user" accurately while adding DDoS protection.

## Policies

```csharp
// ServiceCollectionExtensions.cs or new AuthRateLimitExtensions.cs

services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) => { /* ApiResponse envelope */ };

    // Login + Register: 5/min/IP
    options.AddPolicy("auth-login-ip", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ResolveClientIp(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Email send: 3/10min/email
    options.AddPolicy("auth-email-send", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"send:{ResolveEmail(httpContext)}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(10)
            }));

    // Email verify: 10/10min/email
    options.AddPolicy("auth-email-verify", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"verify:{ResolveEmail(httpContext)}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(10)
            }));

    // Refresh IP safety net: 60/min/IP (supplement to per-user app limit)
    options.AddPolicy("auth-refresh-ip", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ResolveClientIp(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1)
            }));
});
```

## Middleware Changes

**File:** `Program.cs`

```csharp
app.UseCors("DefaultCors");
app.UseRateLimiter();          // NEW — before auth
app.UseAuthentication();
app.UseMiddleware<BannedUserMiddleware>();
app.UseAuthorization();
```

**New helper:** `ResolveClientIp(HttpContext)` — respect `X-Forwarded-For` when behind reverse proxy.

**New helper:** `ResolveEmail(HttpContext)` — read and cache request body for partition key (enable request body buffering for affected endpoints).

## Controller Changes

**File:** `AuthController.cs`

```csharp
[EnableRateLimiting("auth-login-ip")]
[HttpPost("login")]

[EnableRateLimiting("auth-login-ip")]
[HttpPost("register")]

[EnableRateLimiting("auth-refresh-ip")]
[HttpPost("refresh")]

[EnableRateLimiting("auth-email-send")]
[HttpPost("forgot-password")]
[HttpPost("send-email-verification")]

[EnableRateLimiting("auth-email-verify")]
[HttpPost("verify-email")]
[HttpPost("verify-otp")]
[HttpPost("reset-password")]
```

## Application-Level Refresh Limit (B1)

**File:** `AuthService.RefreshAsync` (after successful `FindByTokenValueAsync`, before rotation)

```csharp
// Pseudocode
var cacheKey = $"refresh-limit:{stored.UserId}";
if (cache.Get<int>(cacheKey) >= 20)
    throw new ForbiddenException(ErrorCodes.RefreshRateLimitExceeded);
cache.Set(cacheKey, count + 1, TimeSpan.FromMinutes(1));
```

**New error code:** `REFRESH_RATE_LIMIT_EXCEEDED` in `ErrorCodes.cs`  
**Map in:** `ExceptionHandlingMiddleware` → 429 or 403

## OTP Service Alignment

Current `OtpService` limits (5/hour, 60s cooldown, 5 attempts/OTP) **overlap** with new HTTP limits. Options:

| Approach | Recommendation |
|----------|----------------|
| Keep both layers | Defense in depth — HTTP limit is first gate |
| Align `OtpSettings` to 3/10min | Update `MaxRequestsPerHour` → new `MaxRequestsPer10Minutes = 3` |
| Remove app-level send limits | Not recommended — keep as backup |

**Recommended:** Add HTTP rate limits **and** update `OtpSettings` to match target windows in a follow-up config change.

## Files to Modify (Rate Limiting)

| File | Change |
|------|--------|
| `Program.cs` | `UseRateLimiter()` |
| **New** `SEHub.API/Extensions/AuthRateLimitExtensions.cs` | Policy registration, IP/email resolvers |
| `ServiceCollectionExtensions.cs` | Call `AddAuthRateLimiting()` |
| `AuthController.cs` | `[EnableRateLimiting("policy")]` attributes |
| `AuthService.cs` | Per-user refresh counter (`IMemoryCache`) |
| `ErrorCodes.cs` | `RefreshRateLimitExceeded`, `AuthRateLimitExceeded` |
| `ExceptionHandlingMiddleware.cs` | Map 429 with `ApiResponse` envelope |
| `appsettings.json` | Optional: configurable permit limits |
| **New** `AuthRateLimitTests.cs` | Integration tests for 429 responses |

## Error Response Format

Align with existing `ApiResponse` envelope:

```json
{
  "success": false,
  "data": null,
  "message": "Too many requests",
  "errors": [{ "field": "rateLimit", "code": "AUTH_RATE_LIMIT_EXCEEDED" }]
}
```

Use `options.OnRejected` in rate limiter config to write this shape (not plain 429).

## Distributed Deployment Note

Built-in rate limiter uses **in-memory** partitions by default. For multi-instance deployments:

| Option | When |
|--------|------|
| In-memory (default) | Single instance / dev |
| `AddStackExchangeRedisRateLimiting` | Production multi-node (future) |

**Phase 1:** In-memory is acceptable for current single-instance dev/staging.

## Testing Plan

| Test | Expected |
|------|----------|
| 6th login from same IP in 1 min | 429 |
| 6th register from same IP in 1 min | 429 |
| 21st refresh for same user in 1 min | 403 `REFRESH_RATE_LIMIT_EXCEEDED` |
| 4th forgot-password for same email in 10 min | 429 |
| 11th verify-email for same email in 10 min | 429 |
| Under-limit requests | 200 (unchanged behavior) |

## Implementation Order

1. Add `AuthRateLimitExtensions` + policies
2. Wire `AddRateLimiter` / `UseRateLimiter`
3. Add `[EnableRateLimiting]` to `AuthController`
4. Add per-user refresh limit in `AuthService`
5. Add error codes + middleware mapping
6. Integration tests
7. Optional: align `OtpSettings` windows

---

## Combined Deployment Checklist

| Step | Track |
|------|-------|
| Deploy token hashing + revoke all refresh tokens | A |
| Deploy rate limiting policies | B |
| Update `FE_AUTH_INTEGRATION_GUIDE.md` with 429 handling | B |
| Release note: users must re-login after hashing deploy | A |

---

## Out of Scope

- HttpOnly cookie delivery for refresh tokens
- JWT access-token blacklist
- Redis distributed rate limiting (noted as P2)
- CAPTCHA on login
- Account lockout after N failed logins (Identity lockout wiring)

---

## Related Audit Documents

- `REFRESH_TOKEN_STORAGE_AUDIT.md` — plain-text storage confirmed
- `AUTH_RATE_LIMIT_AUDIT.md` — current protection gaps
