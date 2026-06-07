# Frontend–Backend Auth Integration Report

**Date:** 2026-06-05  
**Scope:** Auth flows + guest feature readiness  
**Method:** Source audit + CodeGraph-backed BE contracts (prior auth audits)

---

## Integration Score: **72 / 100**

| Area | Weight | Score | Notes |
|------|--------|-------|-------|
| Auth API wiring | 35% | 88% | 8/10 flows integrated |
| Auth store / tokens | 20% | 80% | Refresh + 401 retry added; no proactive expiry |
| DTO compatibility | 15% | 90% | Auth DTOs aligned |
| Guest features | 20% | 35% | Pages exist; APIs mostly mock |
| Demo readiness | 10% | 65% | Auth demoable; content APIs not wired |

---

## Status Summary

### PASS (13)

| Item |
|------|
| Register (`POST /auth/register` ↔ `RegisterPage` + `authApi.register`) |
| Login (`POST /auth/login` ↔ `LoginPage` + `useAuth.login`) |
| Logout (`POST /auth/logout` ↔ `useAuth.logout`) |
| Get current user (`GET /auth/me` ↔ bootstrap) |
| Forgot password (`POST /auth/forgot-password`) |
| Verify OTP (`POST /auth/verify-otp`) |
| Reset password (`POST /auth/reset-password`) |
| Refresh token (`POST /auth/refresh` ↔ `httpClient` interceptor) |
| JWT Bearer attachment on authenticated requests |
| `ApiResponse<T>` envelope parsing |
| `AuthUserDto` / `MeResponse` mapping |
| Route guard (`PrivateRoute` + `isBootstrapping`) |
| Backend: 46/46 integration tests pass |

### PARTIAL (8)

| Item | Gap |
|------|-----|
| Google Login | FE wired (Login + Register); needs `VITE_GOOGLE_CLIENT_ID` + BE `Google:ClientId` |
| Verify Email | `authApi.sendEmailVerification` / `verifyEmail` exist; **no UI** |
| Guest Home Feed | `FeedPage` uses mock `feedData.js`; BE `GET /posts` ready |
| Guest Post Details | No public route; `/home/posts/:id` requires auth |
| Guest Exams | Pages mock data; BE guest GET endpoints exist |
| Guest Documents | Page exists; **BE requires JWT** for all document endpoints |
| Token expiry | Reactive 401 refresh only; `expiresIn` ignored |
| `sehubs_remember_login` | Stored but not used for session policy |

### FAIL (5)

| Item | Gap |
|------|-----|
| Search Posts | No FE search → API integration |
| Posts API client | No `postsApi.js` |
| Documents API client | No `documentsApi.js` |
| Exams API client | No `examsApi.js` |
| SMS OTP auth | BE exists; FE not implemented |

---

## Phase 6 Implementation (Completed)

Extended existing JS architecture (not TypeScript — project convention):

| File | Change |
|------|--------|
| `fe/src/api/auth.types.js` | JSDoc typedefs for auth DTOs |
| `fe/src/api/httpClient.js` | Refresh token storage, `refreshSession()`, 401 retry |
| `fe/src/api/authApi.js` | `googleLogin`, `refresh`, `sendEmailVerification`, `verifyEmail` |
| `fe/src/utils/googleAuth.js` | Google Identity Services loader |
| `fe/src/context/AuthProvider.jsx` | Refresh on bootstrap; `googleLogin()` |
| `fe/src/features/auth/LoginPage/LoginPage.jsx` | Google login wired |
| `fe/src/features/auth/RegisterPage/RegisterPage.jsx` | Google signup wired |

**Not created:** `authService.ts`, `useAuth.ts`, axios — project uses `authApi.js` + `useAuth.js` + `fetch`.

---

## Remaining Integration Gaps

### Auth (priority)

1. **Email verification UI** — post-register prompt + code entry page
2. **Google OAuth config** — set `VITE_GOOGLE_CLIENT_ID` in `fe/.env.development`
3. **Proactive token refresh** — optional timer from `expiresIn`
4. **SMS OTP** — if product requires phone verification

### Content (guest + student)

5. **`postsApi.js`** — wire `FeedPage`, `PostDetailPage`, search
6. **`examsApi.js`** — wire exam catalog and question views
7. **`documentsApi.js`** — requires BE policy decision (guest vs auth-only)
8. **Public post detail route** — e.g. `/community/posts/:id` for guests
9. **React Query** — not in project; optional future layer for caching

### Backend alignment

10. **Documents guest access** — BE `[Authorize]` on all document endpoints blocks guest demo as specified
11. **Seed student user** — only admin seeded in dev DB; register before demo

---

## Generated Reports

| Report | Path |
|--------|------|
| Guest feature mapping | `GUEST_INTEGRATION_AUDIT.md` |
| Auth flow mapping | `AUTH_INTEGRATION_MAPPING.md` |
| DTO compatibility | `DTO_COMPATIBILITY_REPORT.md` |
| Auth store audit | `AUTH_STORE_AUDIT.md` |
| API contract | `AUTH_API_CONTRACT.md` |
| Demo checklist | `AUTH_DEMO_CHECKLIST.md` |
| This report | `FE_BE_AUTH_INTEGRATION_REPORT.md` |

---

## Verdict

**Auth integration is demo-ready** for email/password login, register, logout, forgot-password, and refresh (after Phase 6). **Google login and email verification need configuration/UI** before full parity. **Guest content features remain UI-only** until posts/exams/documents API clients are built and routing aligns with BE authorization policies.

**Recommended next steps:**

1. Add `VITE_GOOGLE_CLIENT_ID` and verify Google login end-to-end
2. Build verify-email page using existing `authApi` functions
3. Create `postsApi.js` and replace `feedData.js` mock on `/community`
4. Decide documents guest policy (relax BE `[Authorize]` or keep auth-only FE)
