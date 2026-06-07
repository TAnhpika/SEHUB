# Role & Permission Audit

> **Date:** 2026-06-06  
> **Actors (BA):** Guest · Student (Free) · Student (Premium) · Moderator · Admin  
> **Implementation:** Identity roles + `RequirePremium` (DB subscription) + service-layer checks

---

## Policy Registration

| Policy | Definition | Handler |
|--------|------------|---------|
| `RequireAuthenticated` | `RequireAuthenticatedUser()` | — |
| `RequirePremium` | Authenticated + `PremiumRequirement` | `PremiumAuthorizationHandler` (DB) |
| `RequireModerator` | Role `Moderator` or `Admin` | — |
| `RequireAdmin` | Role `Admin` only | — |

**Files:** `AuthorizationPolicies.cs` · `PremiumAuthorizationHandler.cs` · `BannedUserMiddleware.cs`

---

## Actor → Policy Mapping (ARCH-BE §1.5)

| Actor | FE Guard | BE Policy | Status |
|-------|----------|-----------|--------|
| Guest | No token | `AllowAnonymous` on read endpoints | **PASS** |
| Student (Free) | `PrivateRoute` | `RequireAuthenticated` | **PASS** |
| Student (Premium) | `PremiumRoute` | `RequirePremium` (DB) | **PASS** |
| Moderator | `ModeratorRoute` | `RequireModerator` | **PASS** |
| Admin | `AdminRoute` | `RequireAdmin` | **PASS** |

---

## Use Case Permission Matrix

| UC / Feature | Expected Actor | Actual Policy | Result | Notes |
|--------------|----------------|---------------|--------|-------|
| Register / Login | Guest | Anonymous | **PASS** | |
| View exam list | Guest | Anonymous `GET /exams` | **PASS** | |
| View questions (no answer) | Guest/Free | Anonymous | **PASS** | Service masks answers |
| View correct answer | Premium | `RequirePremium` | **PASS** | Mod/Admin via service |
| Start exam attempt | Premium | `RequirePremium` | **PASS** | |
| AI explain | Free (limited) / Premium | `RequireAuthenticated` + token limits | **PASS** | |
| Practice GitHub submit | Premium | `RequirePremium` | **PASS** | |
| View documents | Student+ (not Guest) | `RequireAuthenticated` | **PASS** | Guest → 401 |
| Download document | Premium/Mod/Admin | `RequireAuthenticated` + service `HasFullAccess` | **PASS** | Controller not `RequirePremium` — service blocks Free |
| View posts feed | Guest+ | Anonymous `GET /posts` | **PASS** | |
| Create/edit/delete post | Student+ | `RequireAuthenticated` + author/Mod | **PASS** | |
| Like / comment | Student+ | `RequireAuthenticated` | **PASS** | |
| Report post | Student+ | `RequireAuthenticated` | **PASS** | |
| Feature post | Moderator+ | `RequireModerator` | **PASS** | |
| Resolve reports | Moderator+ | `RequireModerator` (class) | **PASS** | |
| Temp ban user | Moderator+ | `RequireModerator` on PATCH | **PASS** | Service limits Mod to temp |
| Permanent ban | Admin | Admin-only permanent (no `BanUntil`) | **PASS** | |
| Create exam | Moderator+ | `RequireModerator` POST | **PASS** | |
| Approve exam / OCR | Admin | `RequireAdmin` | **PASS** | Mod cannot approve |
| Admin payments | Admin | `RequireAdmin` (class) | **PASS** | Mod blocked |
| Admin documents | Admin | `RequireAdmin` (class) | **PASS** | |
| Premium purchase | Student+ | `RequireAuthenticated` | **PASS** | |
| Follow / Chat | Student+ (BA) | Not implemented | **N/A** | G2 defer |

---

## Security Findings

### Missing Permissions

| Gap | Severity | Detail |
|-----|----------|--------|
| Document download controller policy | LOW | Relies on service-layer premium check — works but defense-in-depth gap |
| Google OAuth endpoint | HIGH | Anonymous with no real verification |
| OTP endpoints HTTP rate limit | MEDIUM | Only app-level limits |

### Excess Permissions

| Finding | Severity | Detail |
|---------|----------|--------|
| None critical | — | Mod correctly blocked from Admin payments, documents, exam approve |
| JWT access after logout | LOW | No blacklist; ~60 min window |

### Security Risks

| Risk | Actor Impact | Mitigation Present |
|------|--------------|-------------------|
| Google auth stub | Any → impersonate | **None** — **CRITICAL** |
| Refresh token plain text | DB breach → session hijack | Rotation/reuse detection only |
| Banned user with valid JWT | Blocked by middleware | **PASS** |
| Premium claim stale in JWT | Premium endpoints re-check DB | **PASS** |

---

## Controller Authorization Summary

| Controller | Class Policy | Assessment |
|------------|--------------|------------|
| `AuthController` | Per-action | **PASS** |
| `PostsController` | Per-action mixed | **PASS** |
| `ExamsController` | Per-action mixed | **PASS** |
| `DocumentsController` | All authenticated | **PASS** (service enforces tier) |
| `PracticeSubmissionsController` | Premium/Mod per action | **PASS** |
| `PremiumController` | Mixed | **PASS** |
| `Admin/*` | Class or per-action elevation | **PASS** |

**Overall Role Compliance:** **PASS** for G1 scope (excluding G2 social features)
