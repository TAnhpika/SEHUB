# SEHub — Business Compliance Gap Analysis

> **Date:** 2026-06-06  
> **Basis:** `SEHUB_PhanTichNghiepVu.md` Giai đoạn 1 scope vs actual `SEHub.Backend` source

---

## Gap Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| MAJOR | 5 |
| MINOR | 6 |

---

## CRITICAL

### GAP-C01: Google OAuth not verified

| Field | Detail |
|-------|--------|
| **Description** | `GoogleAuthAsync` treats `IdToken` as a plain email string. No Google API token validation. |
| **Impact** | Authentication bypass in production — any client can impersonate users via forged `IdToken`. |
| **File** | `SEHub.Backend/src/SEHub.Application/Auth/AuthService.cs` (lines 215–223) |
| **Recommended fix** | Integrate `GoogleJsonWebSignature.ValidateAsync` (or equivalent) against Google certs; map `sub`/`email` from validated payload. |

---

## MAJOR

### GAP-M01: Post rejection / resubmit workflow missing

| Field | Detail |
|-------|--------|
| **Description** | BA §4.1.C and entity `PostStatus.Rejected` exist, but posts are created as `Published` and updates do not transition `Rejected → Pending`. |
| **Impact** | Pre-moderation and rejected-content rework flows cannot operate; moderators must delete instead of reject-with-resubmit. |
| **File** | `SEHub.Backend/src/SEHub.Application/Feed/PostService.cs` (lines 101–134) |
| **Recommended fix** | Add moderation status transitions: optional `Pending` on create; Mod reject endpoint; author edit sets `Rejected → Pending`. |

### GAP-M02: Gamification badge engine not implemented

| Field | Detail |
|-------|--------|
| **Description** | `Badge`, `UserBadge` tables seeded but no service awards badges on events (26 badge conditions in BA). |
| **Impact** | Profile/gamification UX incomplete for P1; engagement mechanics partial. |
| **File** | Missing — only `GamificationService.cs` handles points (+10 post, +2 like) |
| **Recommended fix** | Event-driven `IBadgeAwardService` hooked to post/like/login milestones; start with 3–5 badges for G1. |

### GAP-M03: Streak bonus points (+20 / 7 days) missing

| Field | Detail |
|-------|--------|
| **Description** | `UpdateStreakOnLoginAsync` increments `StreakCount` but does not award +20 points on 7-day milestone. |
| **Impact** | BA gamification rule not delivered; streak is display-only. |
| **File** | `SEHub.Backend/src/SEHub.Infrastructure/Persistence/Repositories/UserRepository.cs` (lines 159–170) |
| **Recommended fix** | On streak increment, if `StreakCount % 7 == 0`, call `AddPointsAsync(authorId, 20)`. |

### GAP-M04: Profile visibility requires authentication

| Field | Detail |
|-------|--------|
| **Description** | `GET /api/v1/profiles/{username}` requires `RequireAuthenticated`; BA community model implies discoverable public profiles. |
| **Impact** | Guest cannot browse member profiles; FE public profile pages need auth token. |
| **File** | `SEHub.Backend/src/SEHub.API/Controllers/ProfilesController.cs` |
| **Recommended fix** | Allow Anonymous on read-only profile GET; keep PUT/me stats authenticated. |

### GAP-M05: Automated test coverage below plan

| Field | Detail |
|-------|--------|
| **Description** | BACKEND_IMPLEMENTATION_PLAN lists 12 test files covering OTP, active attempt 409, document guest 401, soft delete — only 11 files / 16 tests exist. |
| **Impact** | Regression risk on business rules (ban, moderation, practice review). |
| **File** | `SEHub.Backend/tests/` |
| **Recommended fix** | Add integration tests for: banned login 403, document preview page 4 forbidden, practice `IsLatest` flip, OTP rate limit 429. |

---

## MINOR

### GAP-m01: Voucher discount at checkout not applied

| Field | Detail |
|-------|--------|
| **Description** | `LevelConfig.VoucherPercent` stored but `PremiumService.CreateOrderAsync` does not apply rank-based discount. |
| **Impact** | Gold/Platinum voucher benefits (BA §2.2) not active. |
| **File** | `SEHub.Backend/src/SEHub.Application/Premium/PremiumService.cs` |
| **Recommended fix** | P1 — compute discounted `Amount` from user level before PayOS order. |

### GAP-m02: SMS OTP channel mock-only

| Field | Detail |
|-------|--------|
| **Description** | BA forgot-password mentions Email/SMS choice; SMS uses `MockSmsService`. |
| **Impact** | SMS path non-functional in production (intentional per project constraints). |
| **File** | `SEHub.Backend/src/SEHub.Infrastructure/DependencyInjection.cs` (line 92) |
| **Recommended fix** | Document as known limitation; wire real SMS provider when approved. |

### GAP-m03: AI explanation uses mock provider

| Field | Detail |
|-------|--------|
| **Description** | `IAiExplanationService` → `MockAiExplanationService` in Infrastructure. |
| **Impact** | Demo-safe; not production AI. |
| **File** | `SEHub.Backend/src/SEHub.Infrastructure/Ai/MockAiExplanationService.cs` |
| **Recommended fix** | Swap to `OpenAiExplanationService` when API keys configured. |

### GAP-m04: PayOS mock credentials in dev config

| Field | Detail |
|-------|--------|
| **Description** | `appsettings.json` uses `mock-client-id` / `mock-api-key`. |
| **Impact** | Real payments require environment-specific PayOS keys. |
| **File** | `SEHub.Backend/src/SEHub.API/appsettings.json` (lines 11–15) |
| **Recommended fix** | Use user-secrets / Key Vault for staging/prod. |

### GAP-m05: Migration granularity differs from plan

| Field | Detail |
|-------|--------|
| **Description** | 2 migrations vs planned 7 module migrations. |
| **Impact** | Team process / rollback granularity only; schema largely complete. |
| **File** | `SEHub.Backend/src/SEHub.Infrastructure/Persistence/Migrations/` |
| **Recommended fix** | No action required if schema correct; document consolidation decision. |

### GAP-m06: Document download controller policy mismatch

| Field | Detail |
|-------|--------|
| **Description** | Download endpoint uses `RequireAuthenticated` not `RequirePremium`; service enforces premium. |
| **Impact** | Defense-in-depth gap — Free user gets 403 from service not policy. |
| **File** | `SEHub.Backend/src/SEHub.API/Controllers/DocumentsController.cs` |
| **Recommended fix** | Add `RequirePremium` or custom policy on download action for clarity. |

---

## Intentional G2 Gaps (Not defects)

| Item | BA Reference |
|------|--------------|
| Chat / Follow / Notifications | §5.1 |
| Question comments on exams | ARCH-BE §4.9 |
| Heatmap 6 months | §5.1 |
| Chatbot / admin settings | §5.1 |
| Admin CSV export / backup | §2.5 (full admin suite) |
