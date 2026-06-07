# Entity Mapping Report

> **Date:** 2026-06-06  
> **Compare:** `SEHUB_PhanTichNghiepVu.md` + `ARCHITECTURE-BE.md` §3.4 vs `SEHub.Domain/Entities`

---

## Summary

| Category | BA Expected | Implemented | Missing | Extra |
|----------|-------------|-------------|---------|-------|
| Core entities | 23 | 23 | 0 | 0 |
| G2 deferred | 5 | 0 | 5 | — |
| Infrastructure identity | 1 | 1 (`ApplicationUser`) | 0 | 0 |
| **Coverage (G1)** | **23/23** | **100%** | — | — |
| **Coverage (incl. G2)** | **28** | **23** | **5** | **0** |

---

## Implemented Entities — Field Alignment

### Identity & User

| BA Entity | Domain Entity | Key Fields | Status |
|-----------|---------------|------------|--------|
| ApplicationUser | `ApplicationUser` (Infrastructure) | Points, LevelId, StreakCount, IsBanned, BanUntil | **PASS** |
| UserProfile | `UserProfile` | AvatarUrl, Bio, Major, Semester | **PASS** |
| RefreshToken | `RefreshToken` | Token, ExpiresAt, IsRevoked | **PASS** |
| OtpVerification | `OtpVerification` | CodeHash, Purpose, AttemptCount, Phone *(extra)* | **PASS** |

### Feed

| BA Entity | Domain Entity | Key Fields | Status |
|-----------|---------------|------------|--------|
| Post | `Post` | Title, Content, Tags, Status, IsFeatured, IsDeleted | **PASS** |
| Comment | `Comment` | ParentCommentId, IsDeleted | **PASS** |
| PostLike | `PostLike` | Composite (PostId, UserId) | **PASS** |
| PostReport | `PostReport` | Reason, Status, ResolvedById | **PASS** |

### Exam

| BA Entity | Domain Entity | Key Fields | Status |
|-----------|---------------|------------|--------|
| Exam | `Exam` | Code, ExamType, ContentHash, AssetUrl, Status | **PASS** |
| Question | `Question` | OrderIndex, CorrectOptionId | **PASS** |
| QuestionOption | `QuestionOption` | Label, Text | **PASS** |
| ExamAttempt | `ExamAttempt` | AnswersJson, Score, Status | **PASS** |
| PracticeSubmission | `PracticeSubmission` | GitHubRepoUrl, IsLatest, ReviewerComment | **PASS** |

### Document

| BA Entity | Domain Entity | Status |
|-----------|---------------|--------|
| DocumentCategory | `DocumentCategory` | **PASS** |
| Document | `Document` | **PASS** |

### Premium

| BA Entity | Domain Entity | Status |
|-----------|---------------|--------|
| SubscriptionPlan | `SubscriptionPlan` | **PASS** |
| Subscription | `Subscription` | **PASS** |
| PaymentOrder | `PaymentOrder` | **PASS** |
| PaymentAuditLog | `PaymentAuditLog` | **PASS** |

### Gamification

| BA Entity | Domain Entity | Status |
|-----------|---------------|--------|
| LevelConfig | `LevelConfig` | **PASS** |
| Badge | `Badge` | **PASS** |
| UserBadge | `UserBadge` | **PARTIAL** — schema only |
| AiTokenDailyUsage | `AiTokenDailyUsage` | **PASS** |

### Moderation

| BA Entity | Domain Entity | Status |
|-----------|---------------|--------|
| UserBan | `UserBan` | **PASS** |

---

## Missing Entities (BA / ARCH-BE — G2 or P2)

| Entity | BA Reference | Reason | Impact |
|--------|--------------|--------|--------|
| `QuestionComment` | §3.3 exam comments | G2 defer | Exam Q&A not available |
| `Follow` / `UserFollow` | §3.7 | G2 defer | Social graph missing |
| `ChatMessage` / `Conversation` | §3.7 | G2 defer | Real-time chat missing |
| `Notification` | §3.7 | G2 defer | Push/badge notifications missing |
| `Voucher` / `UserVoucher` | §2.2 gamification | P1 partial | VoucherPercent on LevelConfig only |

---

## Missing Fields (on existing entities)

| Entity | Expected Field | Actual | Status |
|--------|----------------|--------|--------|
| `Post` | `RejectedReason`, `ModeratedAt` | Not present | **MINOR** — moderation metadata |
| `ApplicationUser` | `FollowerCount` / `FollowingCount` | Not present | **N/A** — Follow entity missing |
| `Exam` | `DurationMinutes` (time limit) | Not present | **MINOR** — G2 optional |
| `Document` | `DownloadCount` | Not present | **MINOR** |

---

## Extra Entities (not in BA v1.0)

| Entity | Purpose | Assessment |
|--------|---------|------------|
| `RefreshToken` | ARCH-BE auth extension | **Valid addition** |
| `OtpVerification.Phone` | SMS OTP support | **Valid addition** |

---

## Relationship Verification

| Relationship | BA | Actual EF Config | Status |
|--------------|-----|------------------|--------|
| User 1-1 Profile | ✅ | `ApplicationUserConfiguration` | **PASS** |
| Post 1-N Comment (self-ref) | ✅ | `CommentConfiguration` | **PASS** |
| Exam 1-N Question 1-N Option | ✅ | Cascade configs | **PASS** |
| PaymentOrder 1-N AuditLog | ✅ | Append-only interceptor | **PASS** |
| Badge N-N User via UserBadge | ✅ | Composite PK | **PASS** |

**Entity Mapping Score:** **92/100** (G1 complete; G2 entities absent by design)
