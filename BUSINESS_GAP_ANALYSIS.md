# Business Gap Analysis

> **Date:** 2026-06-06  
> **Basis:** `SEHUB_PhanTichNghiepVu.md` Giai đoạn 1 vs `SEHub.Backend` implementation

---

## Gap Summary

| Severity | Count |
|----------|-------|
| **CRITICAL** | 1 |
| **MAJOR** | 6 |
| **MINOR** | 7 |

---

## CRITICAL

### GAP-C01: Google OAuth not verified

| Field | Detail |
|-------|--------|
| **Description** | `GoogleAuthAsync` treats `IdToken` as plain email — no Google certificate validation |
| **Impact** | Authentication bypass; impersonation in production |
| **Related UC** | UC-AUTH-05 |
| **Suggested Fix** | `GoogleJsonWebSignature.ValidateAsync`; map `sub`/`email` from validated payload |

---

## MAJOR

### GAP-M01: Post rejection / resubmit workflow missing

| **Description** | `PostStatus.Rejected` exists but posts created as `Published`; no Rejected→Pending transition |
| **Impact** | BA §4.1.C pre-moderation rework impossible |
| **Related UC** | UC-FEED-03, UC-FEED-10 |
| **Suggested Fix** | Mod reject endpoint; author edit transitions status |

### GAP-M02: Gamification badge engine not implemented

| **Description** | `Badge`/`UserBadge` seeded; no event-driven award service |
| **Impact** | 26-badge UX incomplete (P1) |
| **Related UC** | UC-GAME-01 |
| **Suggested Fix** | `IBadgeAwardService` on post/like/login milestones |

### GAP-M03: Streak bonus points (+20 / 7 days) missing

| **Description** | `StreakCount` increments; no +20 point award |
| **Impact** | BA gamification rule undelivered |
| **Related UC** | UC-FEED-11 |
| **Suggested Fix** | Award in `UpdateStreakOnLoginAsync` when `StreakCount % 7 == 0` |

### GAP-M04: G2 social features absent

| **Description** | Follow, Chat WebSocket, Notifications not implemented |
| **Impact** | BA §3.7 features unavailable (expected G2 cut) |
| **Related UC** | UC-CHAT-01, UC-NOTIF-01, UC-SEARCH-01 |
| **Suggested Fix** | Phase 2 roadmap; not G1 blocker per §5.1 |

### GAP-M05: Question comments absent

| **Description** | `QuestionComment` entity not created |
| **Impact** | Premium exam discussion feature missing |
| **Related UC** | UC-EXAM-07 |
| **Suggested Fix** | G2 implementation per ARCH-BE §4.9 |

### GAP-M06: Refresh token plain-text storage

| **Description** | `RefreshTokens.Token` stored verbatim (unlike OTP hash) |
| **Impact** | DB breach exposes live sessions |
| **Related UC** | UC-AUTH-08 |
| **Suggested Fix** | SHA256 hash at rest per hardening plan |

---

## MINOR

### GAP-N01: Email verification optional on login

Default `RequireConfirmedEmail=false` — tokens issued before verify.

### GAP-N02: OTP endpoints lack HTTP rate limiter

App-level limits only; no `[EnableRateLimiting]` on forgot-password/verify.

### GAP-N03: Profile read requires authentication

`GET /profiles/{username}` not anonymous — guest cannot browse profiles.

### GAP-N04: Post search limited to title/content

No dedicated tag index or full-text search.

### GAP-N05: Voucher at checkout not implemented

`LevelConfig.VoucherPercent` field only.

### GAP-N06: Admin CSV export / backup APIs missing

BA §2.5 deferred to G2.

### GAP-N07: Validator gaps on forgot-password / verify-otp

No FluentValidation on some auth DTOs.

---

## Intentional Deferrals (Not Gaps)

| Feature | BA Decision | Status |
|---------|-------------|--------|
| Chat WebSocket | §5.1 G2 | Aligned |
| Heatmap 6 months | §5.1 G2 | Aligned |
| Chatbot | §5.1 G2 | Aligned |
| Pre-moderation toggle by category | §5.1 cut | Partial (post-moderation only) |
