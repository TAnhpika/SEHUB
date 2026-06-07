# Token Security Audit

> **Date:** 2026-06-06  
> **Sources:** `JwtTokenService`, `RefreshToken` entity, `RefreshTokenRepository`, `AuthService`

---

## Access Token (JWT)

| Check | Status | Evidence |
|-------|--------|----------|
| Algorithm | **PASS** | HMAC-SHA256 (`SecurityAlgorithms.HmacSha256`) |
| Secret | **PASS** | `JwtSettings.Secret` via config |
| Issuer/Audience | **PASS** | Validated on every request |
| Expiration | **PASS** | `ExpirationMinutes` (default 60) → `expiresIn` seconds in response |

### Claims

| Claim | Value | Status |
|-------|-------|--------|
| `sub` | `user.Id` | PASS |
| `ClaimTypes.NameIdentifier` | `user.Id` | PASS |
| `ClaimTypes.Name` | `username` | PASS |
| `ClaimTypes.Email` | `email` | PASS |
| `ClaimTypes.Role` | `user.Role` | PASS |
| `isPremium` | `"true"` / `"false"` | PASS |

### Role & Premium

- Role embedded in JWT — used by `[Authorize(Roles)]` and policy handlers
- `isPremium` claim set at issuance from active subscription lookup
- Premium policy also re-checks subscription via `PremiumAuthorizationHandler` (defense in depth)

### Gaps

| Gap | Severity |
|-----|----------|
| No JWT blacklist on logout | MINOR — access token valid until expiry (~60 min) |
| Premium claim can be stale until token refresh | MINOR — handler re-validates for premium endpoints |

**Access Token Verdict: PASS**

---

## Refresh Token (Opaque)

| Check | Status | Evidence |
|-------|--------|----------|
| Generation | **PASS** | 48-byte CSPRNG → Base64Url (`JwtTokenService.GenerateRefreshTokenValue`) |
| Entropy | **PASS** | ~384 bits |
| Delivery | **PASS** | JSON body in `LoginResponse.refreshToken` |
| Expiration | **PASS** | `RefreshExpirationDays` (default 7) → `refreshExpiresIn` seconds |

### Storage

| Check | Status | Evidence |
|-------|--------|----------|
| Persisted | **PASS** | `RefreshTokens` table via `AddAsync` + `SaveChanges` |
| Format in DB | **FAIL** | **Plain text** in `Token` column (`nvarchar(256)`) |
| Unique index | **PASS** | `IX_RefreshTokens_Token` |
| Hashing at rest | **FAIL** | Unlike OTP (`CodeHash`), refresh stored verbatim |

### Rotation

| Check | Status | Evidence |
|-------|--------|----------|
| On refresh | **PASS** | `RevokeAsync(stored)` then `BuildLoginResponseAsync` (new row) |
| On login/register/google | **PASS** | New row added; old rows remain until revoked |

### Reuse Detection

| Check | Status | Evidence |
|-------|--------|----------|
| Lookup includes revoked | **PASS** | `FindByTokenValueAsync` (no `IsRevoked` filter) |
| Revoked token presented | **PASS** | `RevokeAllForUserAsync` + `REFRESH_TOKEN_REUSE_DETECTED` |
| Tested | **PASS** | Unit + integration tests |

### Revocation

| Trigger | Method | Status |
|---------|--------|--------|
| Refresh (rotation) | `RevokeAsync` | PASS |
| Logout | `RevokeAllForUserAsync` | PASS |
| Password reset | `RevokeAllForUserAsync` | PASS |
| Reuse detection | `RevokeAllForUserAsync` | PASS |

### Repository Methods

| Method | Used |
|--------|------|
| `FindByTokenValueAsync` | `RefreshAsync` |
| `AddAsync` | `BuildLoginResponseAsync` |
| `RevokeAsync` | `RefreshAsync` |
| `RevokeAllForUserAsync` | Logout, reset, reuse |
| `GetByTokenAsync` | **Unused** (dead code) |

**Refresh Token Verdict: PASS (logic) / FAIL (storage — plain text)**

---

## Overall Token Security

| Area | Score |
|------|-------|
| Access JWT | Strong |
| Refresh lifecycle | Strong |
| Refresh at-rest | Weak |

**Recommendation (no code change in this audit):** Hash refresh tokens at rest (SHA256) per `AUTH_SECURITY_HARDENING_PLAN.md`.
