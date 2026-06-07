# Rate Limit Validation

> **Date:** 2026-06-06  
> **Source:** `AuthRateLimitExtensions`, `AuthController`, integration tests

---

## Infrastructure

| Component | Status |
|-----------|--------|
| `AddRateLimiter()` | Registered in `AddAuthRateLimiting()` |
| `UseRateLimiter()` | `Program.cs` before `MapControllers` |
| Rejection | 429 + `ApiResponse` + `AUTH_RATE_LIMIT_EXCEEDED` |
| `Retry-After` header | Set when metadata available |

---

## Policy Matrix

| Endpoint | Policy Name | Limit | Partition Key | `[EnableRateLimiting]` |
|----------|-------------|-------|---------------|------------------------|
| `POST /api/v1/auth/login` | `LoginPolicy` | 5/min | `login:{IP}` | **YES** |
| `POST /api/v1/auth/register` | `RegisterPolicy` | 5/min | `register:{IP}` | **YES** |
| `POST /api/v1/auth/refresh` | `RefreshPolicy` | 20/min | `refresh:user:{userId}` or `refresh:ip:{IP}` | **YES** |

### Refresh partition resolution

1. JWT `NameIdentifier` / `sub` if authenticated
2. `UserId` from `FindByTokenValueAsync` (reads request body)
3. Client IP fallback

---

## Unprotected Auth Endpoints

| Endpoint | HTTP Rate Limit | App-Level Limit |
|----------|-----------------|-----------------|
| `POST /auth/google` | None | None |
| `POST /auth/forgot-password` | None | OTP 5/hour + 60s cooldown |
| `POST /auth/send-email-verification` | None | OTP limits |
| `POST /auth/verify-email` | None | OTP max attempts |
| `POST /auth/verify-otp` | None | OTP max attempts |
| `POST /auth/reset-password` | None | OTP max attempts |
| `POST /auth/logout` | None | N/A (authenticated) |
| `GET /auth/me` | None | N/A |

---

## Expected 429 Response

```json
{
  "success": false,
  "data": null,
  "message": "Too many requests. Please try again later.",
  "errors": [{ "field": "rateLimit", "message": "AUTH_RATE_LIMIT_EXCEEDED" }]
}
```

---

## Test Results

| Test | Expected | Actual | Result |
|------|----------|--------|--------|
| 6th login in 1 min | 429 | 429 | **PASS** |
| 6th register in 1 min | 429 | 429 | **PASS** |
| 21st refresh in 1 min | 429 | 429 | **PASS** |
| Under-limit requests | 200/404 | 200/404 | **PASS** |

Integration tests: `LoginRateLimitTests`, `RegisterRateLimitTests`, `RefreshRateLimitTests`.

---

## Verdict

| Scope | Result |
|-------|--------|
| Login / Register / Refresh policies | **PASS** |
| OTP endpoint HTTP rate limits | **NOT IMPLEMENTED** (by design — OTP rules unchanged) |

**Overall: PASS** for the three required endpoints.
