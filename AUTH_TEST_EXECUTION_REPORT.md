# Auth Test Execution Report

> **Date:** 2026-06-06  
> **Command:** `dotnet build` · `dotnet test --verbosity normal`  
> **Solution:** `SEHub.Backend/SEHub.slnx`

---

## Build

| Metric | Result |
|--------|--------|
| Status | **SUCCESS** |
| Errors | 0 |
| Warnings | 2 (NU1903 AutoMapper 12.0.1 advisory) |
| Time | ~11s |

---

## Test Summary

| Project | Total | Passed | Failed | Skipped |
|---------|-------|--------|--------|---------|
| `SEHub.Application.UnitTests` | 15 | 15 | 0 | 0 |
| `SEHub.API.IntegrationTests` | 9 | 9 | 0 | 0 |
| **Total** | **24** | **24** | **0** | **0** |

**Overall: PASS**

---

## Auth Module Tests

### Unit — `AuthServiceTests.cs` (6/15 project tests)

| Test | Status |
|------|--------|
| `LoginAsync_WithInvalidPassword_ThrowsNotFoundException` | PASS |
| `LoginAsync_WhenUserIsBanned_ThrowsForbiddenException` | PASS |
| `LoginAsync_OnSuccess_ReturnsAccessAndRefreshTokens` | PASS |
| `RefreshAsync_WithValidToken_RotatesAndReturnsNewPair` | PASS |
| `RefreshAsync_WithRevokedToken_RevokesAllAndThrowsReuseDetected` | PASS |
| `RefreshAsync_WithExpiredToken_ThrowsExpired` | PASS |

### Integration — Auth folder (5/9 project tests)

| Test | Status |
|------|--------|
| `Login_ThenGetMe_ReturnsAuthenticatedProfile` | PASS |
| `Login_ThenRefresh_ReturnsNewAccessTokenAndRotatesRefresh` | PASS |
| `Login_ExceedingFiveRequestsPerMinute_Returns429` | PASS |
| `Register_ExceedingFiveRequestsPerMinute_Returns429` | PASS |
| `Refresh_ExceedingTwentyRequestsPerMinute_Returns429` | PASS |

---

## Coverage by Auth Module (manual assessment)

> No `coverlet` / code-coverage collector was configured in this run. Coverage is estimated from test mapping.

| Module | Files | Tested | Coverage Estimate |
|--------|-------|--------|-------------------|
| `AuthService` — Login | Yes | 3 unit tests | **High** |
| `AuthService` — Refresh | Yes | 3 unit + 1 integration | **High** |
| `AuthService` — Register | Partial | Rate limit only | **Low** |
| `AuthService` — Logout | No | — | **None** |
| `AuthService` — Forgot/Reset OTP | No | — | **None** |
| `AuthService` — Email verify | No | — | **None** |
| `AuthService` — Google | No | — | **None** |
| `JwtTokenService` | Indirect | Via AuthService mocks | **Medium** |
| `OtpService` | No | — | **None** |
| `RefreshTokenRepository` | Indirect | Integration refresh | **Medium** |
| `AuthController` | Partial | Login/me/refresh/rate limits | **Medium** |
| Rate limiting | Yes | 3 integration tests | **High** |
| `BannedUserMiddleware` | Partial | Ban login unit test | **Low** |

**Auth-specific tests:** 11 of 24 total (46%)  
**Auth flow coverage:** ~45% of endpoints have automated tests

---

## Untested Auth Flows

| Flow | Risk |
|------|------|
| Register (happy path) | Medium |
| Email verification send/verify | Medium |
| Forgot password / verify OTP / reset | High |
| Logout + refresh after logout | Medium |
| Google login | Low (stub) |
| Banned user on `/me` | Low |

---

## Recommendations

1. Add integration tests for OTP lifecycle (send → verify → reset)
2. Add logout + refresh-after-logout integration test
3. Add register happy-path integration test
4. Enable `coverlet.collector` for quantitative auth coverage in CI
