# Auth Store Audit

Audits how the frontend manages JWT sessions, refresh tokens, and logout.

**Stack:** React Context (`AuthProvider`) + `fetch` client (`httpClient.js`) — no axios, no React Query.

---

## Storage Keys

| Key | Storage | Purpose | Status |
|-----|---------|---------|--------|
| `sehubs_token` | `localStorage` | JWT access token | **PASS** |
| `sehubs_refresh_token` | `localStorage` | Refresh token (Phase 6) | **PASS** |
| `sehubs_user` | `localStorage` | Cached user profile (UI) | **PASS** |
| `sehubs_remember_login` | `localStorage` | Legacy flag (purged with mock) | **PARTIAL** — unused for TTL |
| `sessionStorage` | — | Not used | N/A |

---

## Access Token

| Check | Implementation | Status |
|-------|----------------|--------|
| Set on login/register/google | `applyAuthSession` → `setAccessToken` | **PASS** |
| Attached to API calls | `apiRequest` adds `Authorization: Bearer` when `auth: true` | **PASS** |
| Cleared on logout | `clearAuthTokens` | **PASS** |
| Legacy mock purge | `purgeLegacyMockSession()` rejects `mock-jwt-token` | **PASS** |
| Expiry tracking | `expiresIn` from BE not stored | **PARTIAL** — reactive only |

---

## Refresh Token

| Check | Implementation | Status |
|-------|----------------|--------|
| Stored after auth | `setRefreshToken(loginResponse.refreshToken)` | **PASS** |
| Used on 401 | `apiRequest` catches 401 → `refreshSession()` → retry | **PASS** |
| Deduped concurrent refresh | `refreshInFlight` singleton | **PASS** |
| Bootstrap recovery | `AuthProvider` calls `refreshSession` if `getMe` fails | **PASS** |
| Cleared on logout | `clearAuthTokens` | **PASS** |
| Refresh endpoint skips retry | `retryOnUnauthorized: false` on `/auth/refresh` | **PASS** |

---

## Auto Refresh

| Scenario | Behavior | Status |
|----------|----------|--------|
| API returns 401 with valid refresh | Silent refresh + retry original request | **PASS** |
| Refresh fails | Error propagates; bootstrap clears session | **PASS** |
| Proactive refresh before expiry | Not implemented | **FAIL** |
| Tab idle past refresh TTL | Session lost on next API call | **PARTIAL** |

---

## Logout

| Step | Behavior | Status |
|------|----------|--------|
| Call `POST /auth/logout` | When access token present | **PASS** |
| Clear local state on API failure | `finally { clearAuthSession }` | **PASS** |
| Revoke refresh server-side | BE invalidates refresh token | **PASS** (BE) |

---

## Token Expiry

| Mechanism | Status |
|-----------|--------|
| JWT `exp` decoded client-side | **FAIL** — not implemented |
| `expiresIn` timer | **FAIL** — not stored |
| 401-driven refresh | **PASS** |
| Refresh token rotation | BE issues new refresh; FE stores it | **PASS** |

---

## Interceptor Pattern

`httpClient.apiRequest` acts as the fetch interceptor:

```
Request → attach Bearer
  ↓
401 + refresh token? → refreshSession() → retry once
  ↓
else → throw ApiError
```

No axios interceptors; architecture uses native `fetch` wrapper — consistent with existing FE.

---

## AuthProvider Flow

```
Mount with token?
  → getMe()
  → fail + refresh token? → refreshSession() → getMe()
  → fail → clearAuthTokens + clear user
```

`isBootstrapping` gates `PrivateRoute` until session restore completes.

---

## Summary

| Area | Status |
|------|--------|
| localStorage token storage | **PASS** |
| Refresh token storage | **PASS** |
| 401 auto-refresh interceptor | **PASS** |
| Logout cleanup | **PASS** |
| Proactive expiry / timers | **FAIL** |
| sessionStorage | N/A (not used) |

**Overall auth store: PASS with minor gaps** (no proactive refresh, no `expiresIn` usage).
