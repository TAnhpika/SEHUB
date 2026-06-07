# Auth Rate Limit Implementation Report

> **Date:** 2026-06-06  
> **Status:** Implemented  
> **Technology:** Built-in ASP.NET Core Rate Limiting (.NET 8)

---

## Executive Summary

HTTP-level rate limiting is now active on three auth endpoints using named policies, `AddRateLimiter()`, and `UseRateLimiter()`. OTP business rules (`OtpService`, `OtpSettings`) were **not modified**.

**Build:** PASS  
**Tests:** PASS — 24/24 (15 unit + 9 integration)

---

## Policies Created

| Policy Name | Constant | Algorithm | Limit | Partition Key |
|-------------|----------|-----------|-------|---------------|
| `LoginPolicy` | `AuthRateLimitPolicies.Login` | Fixed window | 5 / minute | `login:{clientIp}` |
| `RegisterPolicy` | `AuthRateLimitPolicies.Register` | Fixed window | 5 / minute | `register:{clientIp}` |
| `RefreshPolicy` | `AuthRateLimitPolicies.Refresh` | Fixed window | 20 / minute | `refresh:user:{userId}` or `refresh:ip:{clientIp}` |

### Refresh partition resolution order

1. JWT-authenticated user (`ClaimTypes.NameIdentifier` / `sub`) — if present
2. `UserId` from `IRefreshTokenRepository.FindByTokenValueAsync` (reads request body)
3. Client IP fallback (`X-Forwarded-For` first hop, else `RemoteIpAddress`)

---

## Endpoints Protected

| Endpoint | Policy | Other auth endpoints |
|----------|--------|----------------------|
| `POST /api/v1/auth/login` | `LoginPolicy` | Unchanged (no policy) |
| `POST /api/v1/auth/register` | `RegisterPolicy` | — |
| `POST /api/v1/auth/refresh` | `RefreshPolicy` | — |

**Not rate-limited (by design):** forgot-password, send-email-verification, verify-email, verify-otp, reset-password, google, logout, me — existing OTP cooldown/limits remain sole protection for those flows.

---

## Architecture

```
Request
  │
  ▼
ExceptionHandlingMiddleware
  │
  ▼
CORS → Authentication → BannedUserMiddleware → Authorization
  │
  ▼
UseRateLimiter()                    ◄── NEW
  │
  ▼
AuthController [EnableRateLimiting]  ◄── login, register, refresh only
  │
  ▼
AuthService (unchanged)
```

---

## Files Added / Modified

### New files

| File | Purpose |
|------|---------|
| `SEHub.API/RateLimiting/AuthRateLimitPolicies.cs` | Policy name constants |
| `SEHub.API/RateLimiting/ClientIpResolver.cs` | IP extraction with `X-Forwarded-For` |
| `SEHub.API/RateLimiting/RefreshRateLimitPartitionResolver.cs` | Per-user / IP partition for refresh |
| `SEHub.API/RateLimiting/RateLimitResponseWriter.cs` | `OnRejected` → 429 + `ApiResponse` envelope |
| `SEHub.API/Extensions/AuthRateLimitExtensions.cs` | `AddAuthRateLimiting()` |
| `tests/.../AuthRateLimitTests.cs` | Integration tests (3 classes) |

### Modified files

| File | Change |
|------|--------|
| `ServiceCollectionExtensions.cs` | `services.AddAuthRateLimiting()` |
| `Program.cs` | `app.UseRateLimiter()` |
| `AuthController.cs` | `[EnableRateLimiting]` on login, register, refresh |
| `ErrorCodes.cs` | `AUTH_RATE_LIMIT_EXCEEDED` |

### Unchanged (per requirements)

- `OtpService.cs`
- `OtpSettings.cs`
- `appsettings.json` OTP section

---

## Middleware Registration

**DI** (`ServiceCollectionExtensions.AddApiServices`):

```csharp
services.AddAuthRateLimiting();
```

**Pipeline** (`Program.cs`):

```csharp
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
```

`UseRateLimiter()` is placed after authorization and immediately before endpoint mapping, per ASP.NET Core guidance.

---

## Expected 429 Response

**HTTP status:** `429 Too Many Requests`  
**Header:** `Retry-After` (seconds) when metadata available

**Body:**

```json
{
  "success": false,
  "data": null,
  "message": "Too many requests. Please try again later.",
  "errors": [
    { "field": "rateLimit", "message": "AUTH_RATE_LIMIT_EXCEEDED" }
  ]
}
```

---

## Test Scenarios

| Test | Scenario | Expected |
|------|----------|----------|
| `Login_ExceedingFiveRequestsPerMinute_Returns429` | 5 login attempts + 6th | 6th → 429 |
| `Register_ExceedingFiveRequestsPerMinute_Returns429` | 5 register attempts + 6th | 6th → 429 |
| `Refresh_ExceedingTwentyRequestsPerMinute_Returns429` | Login + 20 refreshes + 21st | 21st → 429 |

Rate-limit tests use separate `IClassFixture` instances per test class to avoid partition contention when xUnit runs tests in parallel.

---

## Build & Test Results

```
dotnet build --verbosity minimal
```

| Result | Details |
|--------|---------|
| **BUILD** | **PASS** (0 errors, 2 NU1903 warnings on AutoMapper) |

```
dotnet test --verbosity minimal
```

| Suite | Result | Passed | Failed | Total |
|-------|--------|--------|--------|-------|
| SEHub.Application.UnitTests | **PASS** | 15 | 0 | 15 |
| SEHub.API.IntegrationTests | **PASS** | 9 | 0 | 9 |
| **Total** | **PASS** | **24** | **0** | **24** |

---

## Operational Notes

| Topic | Detail |
|-------|--------|
| Storage | In-memory partitions (single-instance) |
| Multi-node | Requires Redis-backed limiter for shared state (future) |
| Proxy | Respects `X-Forwarded-For` for client IP |
| OTP endpoints | Existing `OtpService` limits unchanged |

---

## Related Documents

- `AUTH_RATE_LIMIT_AUDIT.md` — pre-implementation gaps
- `AUTH_SECURITY_HARDENING_PLAN.md` — broader hardening roadmap
