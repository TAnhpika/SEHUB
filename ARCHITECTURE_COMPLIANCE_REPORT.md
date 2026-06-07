# SEHub Backend — Architecture Compliance Report

> **Ngày audit:** 2026-06-05  
> **Phạm vi:** `SEHub.Backend/` — đối chiếu với [ARCHITECTURE-BE.md](ARCHITECTURE-BE.md) v2.0, [ARCHITECTURE.md](ARCHITECTURE.md), [SEHUB_PhanTichNghiepVu.md](SEHUB_PhanTichNghiepVu.md), [BACKEND_IMPLEMENTATION_PLAN.md](BACKEND_IMPLEMENTATION_PLAN.md)  
> **Phương pháp:** Đọc source code thực tế (không giả định). Build & test đã pass: 16/16.

---

# Executive Summary

Backend SEHub đã được scaffold và triển khai **đầy đủ 75 endpoint** theo Clean Architecture 6 project. Các module Auth, Feed, Exam, Practice, Document, Premium, Profile, Admin đều có controller + service + repository tương ứng. **Build thành công**, **16 test pass**.

Tuy nhiên, audit phát hiện **2 vấn đề CRITICAL** liên quan mô hình Premium và **6 vấn đề MAJOR** ảnh hưởng bảo mật/nghiệp vụ trước khi production. Kiến trúc tổng thể **gần đúng spec**, nhưng **chưa đạt compliance đầy đủ** với ARCHITECTURE-BE.md §1.7 (Premium luôn đọc DB) và một số business rules BA.

**Verdict:** **CONDITIONAL PASS — Cần remediation trước khi tích hợp FE production.**

---

# Compliance Score

| Area | Weight | Điểm | Ghi chú |
|------|--------|------|---------|
| Architecture | 20 | **17** | Clean Arch đúng; API reference Domain (exceptions) |
| Database | 20 | **16** | 24/24 entity; 1 migration gộp; UserBan không wired |
| Security | 20 | **11** | Premium JWT vs DB; PayOS mock; Mod ban bị chặn |
| Business Rules | 25 | **17** | Like/Attempt/Practice OK; AI token, post rejected, premium stale JWT |
| API Compliance | 15 | **13** | 75/75 endpoint; policy download & mod user patch sai |
| **Tổng** | **100** | **74** | |

---

# Critical Issues

### CRIT-01 — `ICurrentUserService.IsPremium` chỉ đọc JWT claim

| | |
|---|---|
| **Severity** | CRITICAL |
| **Requirement** | ARCHITECTURE-BE.md §1.7: *"Premium — authorization luôn đọc DB"*; claim `isPremium` chỉ cho UI |
| **Expected** | Mọi kiểm tra Premium trong Application layer đọc `Subscriptions` (hoặc delegate qua service DB-backed) |
| **Actual** | `CurrentUserService.IsPremium` đọc claim JWT `"isPremium"` |
| **File** | [SEHub.Backend/src/SEHub.Infrastructure/Identity/CurrentUserService.cs](SEHub.Backend/src/SEHub.Infrastructure/Identity/CurrentUserService.cs) L31-32 |
| **Impact** | Sau PayOS webhook, user có subscription active trong DB nhưng JWT cũ `isPremium=false` → **Document preview/download**, **mask đáp án**, **service-layer premium check** sai dù `RequirePremium` policy đã pass |
| **Fix** | Inject `ISubscriptionRepository` vào `CurrentUserService` (hoặc `IPremiumStatusService`) — `IsPremium` query DB + cache; invalidate cache khi webhook/admin confirm |

> **Lưu ý:** `PremiumAuthorizationHandler` **đúng spec** — đọc `Subscriptions` table (L38-40). Vấn đề là **tầng Application** vẫn tin JWT.

---

### CRIT-02 — Premium authorization không nhất quán giữa Policy và Service

| | |
|---|---|
| **Severity** | CRITICAL |
| **Requirement** | §6.1: Policy `RequirePremium` + business logic thống nhất một nguồn sự thật |
| **Expected** | User pass `RequirePremium` → service không reject lại bằng JWT claim |
| **Actual** | `ExamAttemptService.RequirePremiumUser()`, `PracticeSubmissionService`, `DocumentService.HasFullAccess()`, `ExamQueryService.ShouldMaskAnswers()` dùng `_currentUser.IsPremium` (JWT) |
| **File** | [ExamAttemptService.cs](SEHub.Backend/src/SEHub.Application/Exams/ExamAttemptService.cs) L151-154, [DocumentService.cs](SEHub.Backend/src/SEHub.Application/Documents/DocumentService.cs) L121, [ExamQueryService.cs](SEHub.Backend/src/SEHub.Application/Exams/ExamQueryService.cs) L100-101 |
| **Fix** | Thống nhất `IsPremium` DB-backed; hoặc bỏ duplicate check trong service khi controller đã gắn `RequirePremium` |

---

# Major Issues

### MAJ-01 — Moderator không thể ban tạm user

| | |
|---|---|
| **Severity** | MAJOR |
| **Requirement** | ARCHITECTURE-BE.md §4.8: `PATCH /admin/users/{id}` — *"ban tạm: Mod \| Admin"* |
| **Expected** | Moderator PATCH user với `banUntil`, `banType` (không đổi role) |
| **Actual** | `UsersController` gắn `[Authorize(Policy = RequireAdmin)]` toàn controller |
| **File** | [Admin/UsersController.cs](SEHub.Backend/src/SEHub.API/Controllers/Admin/UsersController.cs) L11 |
| **Fix** | Tách endpoint PATCH: policy `RequireModerator`; service validate Mod chỉ được ban tạm, không đổi role |

---

### MAJ-02 — `UserBan` entity tồn tại nhưng không được ghi khi ban

| | |
|---|---|
| **Severity** | MAJOR |
| **Requirement** | §3.4.7 Moderation: `UserBan` N-1 User; `/admin/moderation/banned` hiển thị danh sách |
| **Expected** | Ban user → INSERT `UserBan` + cập nhật `ApplicationUser.IsBanned` |
| **Actual** | `UserRepository.UpdateBanAsync` chỉ set `ApplicationUser.IsBanned/BanUntil`; **không** gọi `IUserBanRepository.AddAsync` |
| **File** | [UserRepository.cs](SEHub.Backend/src/SEHub.Infrastructure/Persistence/Repositories/UserRepository.cs) L192-199 |
| **Impact** | `GET /admin/moderation/banned` đọc `UserBans` table → **danh sách rỗng** dù có user bị ban |
| **Fix** | `UpdateBanAsync` tạo `UserBan` record; đồng bộ 2 nguồn hoặc chọn một nguồn sự thật |

---

### MAJ-03 — PayOS webhook: 2 implementation, handler chính không được dùng

| | |
|---|---|
| **Severity** | MAJOR |
| **Requirement** | §6.5: Transaction + `UPDLOCK` + idempotent; dùng `PayOsWebhookHandler` |
| **Expected** | Controller → `PayOsWebhookHandler.HandleAsync` |
| **Actual** | Controller gọi `PremiumService.HandlePayOsWebhookAsync`; `PayOsWebhookHandler` **registered nhưng dead code** |
| **File** | [PremiumController.cs](SEHub.Backend/src/SEHub.API/Controllers/PremiumController.cs) L72, [PayOsWebhookHandler.cs](SEHub.Backend/src/SEHub.Infrastructure/Payments/PayOsWebhookHandler.cs) |
| **Fix** | Route webhook qua `PayOsWebhookHandler`; xóa duplicate logic trong `PremiumService` |

---

### MAJ-04 — PayOS signature verification là mock, không phải HMAC thật

| | |
|---|---|
| **Severity** | MAJOR |
| **Requirement** | §4.6, §6.5: Verify chữ ký theo tài liệu PayOS |
| **Expected** | HMAC-SHA256 checksum theo spec PayOS |
| **Actual** | `PayOsService.VerifyWebhookSignature` so sánh `signature == "mock-{ChecksumKey}"` |
| **File** | [PayOsService.cs](SEHub.Backend/src/SEHub.Infrastructure/Payments/PayOsService.cs) L29-34 |
| **Fix** | Implement HMAC thật; mock chỉ trong `Development` environment |

---

### MAJ-05 — `PaymentAuditLog` không enforce append-only

| | |
|---|---|
| **Severity** | MAJOR |
| **Requirement** | §3.4.5, §6.5: `PaymentAuditLog` INSERT only — không UPDATE/DELETE |
| **Expected** | EF interceptor hoặc repository chỉ expose `AddAsync` |
| **Actual** | Repository chỉ có `AddAsync` (OK), nhưng `DbContext.PaymentAuditLogs` vẫn có thể Update/Delete trực tiếp; **không có interceptor** |
| **File** | [PaymentAuditLogRepository.cs](SEHub.Backend/src/SEHub.Infrastructure/Persistence/Repositories/PaymentAuditLogRepository.cs) |
| **Fix** | `SaveChangesInterceptor` chặn Modified/Deleted trên `PaymentAuditLog` |

---

### MAJ-06 — AI token limit sai spec (10 Free / 1000 Premium)

| | |
|---|---|
| **Severity** | MAJOR |
| **Requirement** | §6.3: Free 10 tokens/day, Premium 1000; lazy reset per `UsageDate` |
| **Expected** | `limit = IsPremium ? 1000 : 10` đọc từ config |
| **Actual** | `AiExplanationApplicationService.DailyTokenLimit = 50` cố định cho mọi user; không phân biệt Free/Premium |
| **File** | [AiExplanationApplicationService.cs](SEHub.Backend/src/SEHub.Application/Exams/AiExplanationApplicationService.cs) L17, L44 |
| **Fix** | Đọc `Ai:DailyTokenLimitFree/Premium` từ config; dùng DB-backed `IsPremium` |

---

# Minor Issues

### MIN-01 — API reference `SEHub.Domain` trực tiếp

| | |
|---|---|
| **Severity** | MINOR |
| **Requirement** | §2.3: **Không** cho `SEHub.API` → `SEHub.Domain` |
| **Expected** | API chỉ reference Application, Contracts, Infrastructure |
| **Actual** | `ExceptionHandlingMiddleware` import `SEHub.Domain.Exceptions`; `PremiumController` catch `ForbiddenException` |
| **File** | [ExceptionHandlingMiddleware.cs](SEHub.Backend/src/SEHub.API/Middleware/ExceptionHandlingMiddleware.cs), [PremiumController.cs](SEHub.Backend/src/SEHub.API/Controllers/PremiumController.cs) |
| **Fix** | Map exceptions trong Application hoặc dùng abstraction exception base trong Contracts |

---

### MIN-02 — Post `Rejected → Pending` khi resubmit chưa implement

| | |
|---|---|
| **Severity** | MINOR |
| **Requirement** | §4.2 PUT posts: *"Rejected → Pending"* |
| **Expected** | `UpdateAsync` set `Status = Pending` nếu hiện tại `Rejected` |
| **Actual** | `PostService.UpdateAsync` không đổi `Status` |
| **File** | [PostService.cs](SEHub.Backend/src/SEHub.Application/Feed/PostService.cs) L119-134 |

---

### MIN-03 — Feed query `semester`/`major` không được xử lý

| | |
|---|---|
| **Severity** | MINOR |
| **Requirement** | §4.2: `GET /posts?semester&major&tag&search` |
| **Expected** | Filter theo query params |
| **Actual** | `PostQueryParams` có `Semester`/`Major` nhưng `PostRepository.GetPagedAsync` **bỏ qua**; `Post` entity không có field semester/major |
| **File** | [PostRepository.cs](SEHub.Backend/src/SEHub.Infrastructure/Persistence/Repositories/PostRepository.cs) L18-30 |

---

### MIN-04 — Migration plan: 1 file thay vì 7 migrations

| | |
|---|---|
| **Severity** | MINOR |
| **Requirement** | BACKEND_IMPLEMENTATION_PLAN.md: Migration 01–07 theo module |
| **Expected** | 7 migrations riêng biệt |
| **Actual** | Chỉ `20260605033348_InitialCreate` gộp toàn schema |
| **File** | [Migrations/](SEHub.Backend/src/SEHub.Infrastructure/Persistence/Migrations/) |
| **Note** | Schema đầy đủ — chỉ khác quy trình review/rollback theo module |

---

### MIN-05 — `DocumentsController` download policy không khớp §4.5

| | |
|---|---|
| **Severity** | MINOR |
| **Requirement** | §4.5: `GET .../download` — **Premium \| Mod \| Admin** |
| **Expected** | `[Authorize(Policy = RequirePremium)]` hoặc custom policy cho staff |
| **Actual** | `[Authorize(RequireAuthenticated)]` — enforcement chỉ ở service layer |
| **File** | [DocumentsController.cs](SEHub.Backend/src/SEHub.API/Controllers/DocumentsController.cs) L44-45 |

---

### MIN-06 — Rate limiting chưa triển khai

| | |
|---|---|
| **Severity** | MINOR |
| **Requirement** | §6.9: Rate limit OTP, login, AI |
| **Expected** | AspNetCoreRateLimit hoặc tương đương |
| **Actual** | Không có middleware/package rate limit |

---

### MIN-07 — `GrantAiTokensAsync` là no-op

| | |
|---|---|
| **Severity** | MINOR |
| **Requirement** | §4.8: `POST /admin/users/{id}/grant-tokens` |
| **Expected** | Cộng/trừ AI token quota |
| **Actual** | `UserRepository.GrantAiTokensAsync` → `Task.CompletedTask` |
| **File** | [UserRepository.cs](SEHub.Backend/src/SEHub.Infrastructure/Persistence/Repositories/UserRepository.cs) L211-212 |

---

# Architecture Audit

## 1. Solution Architecture

| Kiểm tra | Kết quả |
|----------|---------|
| Clean Architecture 6 project | **PASS** |
| `SEHub.API` không reference `SEHub.Domain` (csproj) | **PASS** |
| `SEHub.API` import Domain trong code | **FAIL** (MIN-01) |
| `SEHub.Domain` không reference project khác | **PASS** |
| `SEHub.Contracts` không chứa business logic | **PASS** |
| `SEHub.Infrastructure` implement interfaces từ Application | **PASS** |
| Dependency direction đúng (Domain ← Application ← Infrastructure, API) | **PASS** |

### Project References (verified)

```
SEHub.API        → Application, Contracts, Infrastructure
SEHub.Application → Domain, Contracts, Shared
SEHub.Infrastructure → Application, Domain, Shared
SEHub.Contracts  → Shared
SEHub.Domain     → (none)
```

**Kết luận Architecture: PASS (có caveat MIN-01)**

---

# Database Audit

## Entity Compliance

| Entity | Tồn tại | Fields chính | Relationship | Status |
|--------|---------|--------------|--------------|--------|
| ApplicationUser | ✅ Infrastructure | DisplayName, Points, LevelId, Streak, Ban fields | 1-1 Profile, Identity roles | **PASS** |
| UserProfile | ✅ | AvatarUrl, Bio, Major, Semester | 1-1 User | **PASS** |
| RefreshToken | ✅ | Token, ExpiresAt, IsRevoked | N-1 User | **PASS** |
| OtpVerification | ✅ | Email, CodeHash, ExpiresAt, AttemptCount, Purpose | — | **PASS** |
| Post | ✅ + ISoftDeletable | Title, Content, Tags, Status, ViewCount, IsFeatured | N-1 Author | **PASS** |
| Comment | ✅ + ISoftDeletable | Content, ParentCommentId | N-1 Post, self-ref | **PASS** |
| PostLike | ✅ | Composite PK (PostId, UserId) | Junction | **PASS** |
| PostReport | ✅ | Reason, Status, ResolvedById | N-1 Post, Reporter | **PASS** |
| Exam | ✅ | Code, Title, ExamType, Semester, Major, ContentHash, AssetUrl | 1-N Question | **PASS** |
| Question | ✅ | OrderIndex, Content, CorrectOptionId | N-1 Exam | **PASS** |
| QuestionOption | ✅ | Label, Text | N-1 Question | **PASS** |
| ExamAttempt | ✅ | StartedAt, SubmittedAt, Score, AnswersJson, Status | N-1 User, Exam | **PASS** |
| PracticeSubmission | ✅ | GitHubRepoUrl, IsLatest, Review fields | N-1 User, Exam | **PASS** |
| DocumentCategory | ✅ | Name, Semester, Major | 1-N Document | **PASS** |
| Document | ✅ + ISoftDeletable | FilePath, PageCount, AccessTier | N-1 Category | **PASS** |
| SubscriptionPlan | ✅ | Code, DurationDays, PriceVnd | 1-N Subscription | **PASS** |
| Subscription | ✅ | StartAt, EndAt, IsActive | N-1 User, Plan | **PASS** |
| PaymentOrder | ✅ | PayOsOrderCode UNIQUE, Status, QrUrl | N-1 User, Plan | **PASS** |
| PaymentAuditLog | ✅ | Action, PayloadJson append intent | N-1 Order | **PASS** (enforce weak) |
| LevelConfig | ✅ | Name, MinPoints, VoucherPercent | 1-N User | **PASS** |
| Badge | ✅ | Code, Name, ConditionJson | N-N UserBadge | **PASS** |
| UserBadge | ✅ | EarnedAt | Junction | **PASS** |
| AiTokenDailyUsage | ✅ | UserId, UsageDate, TokensConsumed | UNIQUE (UserId, UsageDate) | **PASS** |
| UserBan | ✅ | BanType, Until, Reason | N-1 User, Actor | **FAIL** (không wired) |

## Indexes (§3.6)

| Index | Status |
|-------|--------|
| Posts CreatedAt | **PASS** (implicit ordering) |
| Posts IsFeatured | **PASS** (query filter) |
| Exams (Semester, Major, ExamType) | **PASS** |
| ExamAttempts (UserId, ExamId) filtered InProgress | **PASS** |
| PracticeSubmissions (ExamId, UserId, IsLatest) | **PASS** (non-unique) |
| PaymentOrders PayOsOrderCode UNIQUE | **PASS** |
| AiTokenDailyUsage (UserId, UsageDate) UNIQUE | **PASS** |

**Kết luận Database: PASS với gaps (UserBan, migration plan)**

---

# Security Audit

## Authorization Policies

| Policy | Đăng ký | Implementation | Status |
|--------|---------|----------------|--------|
| RequireAuthenticated | ✅ | `RequireAuthenticatedUser()` | **PASS** |
| RequirePremium | ✅ | `PremiumAuthorizationHandler` → **DB Subscriptions** | **PASS** (handler) |
| RequireModerator | ✅ | `RequireRole(Moderator, Admin)` | **PASS** |
| RequireAdmin | ✅ | `RequireRole(Admin)` | **PASS** |
| Banned user | ✅ | `BannedUserMiddleware` → 403 ACCOUNT_BANNED | **PASS** |

## RequirePremium — Chi tiết

```csharp
// PremiumAuthorizationHandler.cs L38-40 — ĐÚNG SPEC
isPremium = await _dbContext.Subscriptions
    .AnyAsync(s => s.UserId == userId && s.IsActive && s.EndAt > DateTime.UtcNow);
```

**Handler: PASS** — đọc DB, có cache 3 phút.

**Application services dùng JWT claim: CRITICAL FAIL** — xem CRIT-01, CRIT-02.

## Moderator Restrictions

| Endpoint group | Mod access spec | Actual | Status |
|----------------|-----------------|--------|--------|
| `/admin/payments/*` | Admin only | `RequireAdmin` | **PASS** |
| `/admin/settings/*` | P2 — không có | Không có | **PASS** |
| `/admin/gamification/*` | Admin only | `RequireAdmin` | **PASS** |
| `/admin/users PATCH` (ban tạm) | Mod \| Admin | Admin only | **FAIL** (MAJ-01) |
| `/admin/exams PUT, approve, ocr` | Admin only | `RequireAdmin` | **PASS** |
| `/admin/exams GET, POST` | Mod \| Admin | `RequireModerator` | **PASS** |
| `/admin/moderation/*` | Mod \| Admin | `RequireModerator` | **PASS** |

**Moderator Payments/Settings: PASS (không có CRITICAL FAIL)**

---

# Business Rule Audit

## Feed — Like Rules

| Rule | Expected | Actual | Status |
|------|----------|--------|--------|
| Like lần đầu +2 điểm author | +2 via `GamificationService` | `AwardLikeReceivedAsync` khi like mới | **PASS** |
| Unlike không trừ điểm | Không gọi gamification | `UnlikeAsync` không gọi gamification | **PASS** |
| Không cộng điểm nhiều lần | Idempotent | Return early nếu đã like | **PASS** |
| Không toggle trên POST | POST like + DELETE unlike riêng | 2 endpoint riêng | **PASS** |

**File:** [PostLikeService.cs](SEHub.Backend/src/SEHub.Application/Feed/PostLikeService.cs)

## Feed — Feature Post

| Rule | Status |
|------|--------|
| Chỉ Mod/Admin | Controller `RequireModerator` + service check | **PASS** |

## Exam — ExamAttempt

| Rule | Status |
|------|--------|
| 1 InProgress per (UserId, ExamId) | `GetActiveAsync` + throw `ConflictException(ACTIVE_ATTEMPT_EXISTS)` | **PASS** |
| 409 ACTIVE_ATTEMPT_EXISTS | `ErrorCodes.ActiveAttemptExists` | **PASS** |
| Filtered index InProgress | `ExamAttemptConfiguration` | **PASS** |

## Exam — Mask đáp án

| Actor | Expected | Actual | Status |
|-------|----------|--------|--------|
| Guest/Free | Không thấy CorrectOptionId | `QuestionPublicDto` không có field đáp án | **PASS** |
| Premium | Thấy đáp án | `GetQuestionWithAnswerAsync` check `_currentUser.IsPremium` (JWT) | **PARTIAL** |
| Mod/Admin | Thấy đáp án | `IsModeratorOrAdmin` check | **PASS** |

## Practice Submission

| Rule | Status |
|------|--------|
| Resubmit dùng `IsLatest` | `MarkPreviousAsNotLatestAsync` + new `IsLatest=true` | **PASS** |
| Không unique (ExamId, UserId) | Index non-unique `(ExamId, UserId, IsLatest)` | **PASS** |
| Mod review bản IsLatest | Review by submissionId (không enforce IsLatest check) | **PARTIAL** |

## Document

| Actor | Expected | Actual | Status |
|-------|----------|--------|--------|
| Guest | 401 | `[Authorize(RequireAuthenticated)]` → 401 | **PASS** |
| Free | Preview ≤ 3 pages | `FreePreviewPageLimit = 3` | **PASS** |
| Premium | Full preview + download | `HasFullAccess()` via JWT IsPremium | **PARTIAL** (CRIT-01) |
| Mod/Admin | Full access | `IsModeratorOrAdmin` | **PASS** |

## PayOS Webhook

| Rule | Status |
|------|--------|
| Verify signature | Mock only | **FAIL** (MAJ-04) |
| Transaction | `PayOsWebhookHandler` có; `PremiumService` không | **PARTIAL** |
| Idempotent Paid → 200 | Cả 2 path check `Status == Paid` | **PASS** |
| Không duplicate Subscription | Integration test 1 subscription | **PASS** |
| PaymentAuditLog INSERT | Có INSERT WEBHOOK_PAID | **PASS** |
| Append-only enforce | Không có interceptor | **FAIL** (MAJ-05) |

## Soft Delete

| Entity | ISoftDeletable | Global Filter | Delete API | Status |
|--------|----------------|---------------|------------|--------|
| Post | ✅ | ✅ DbContext L46 | `SoftDeleteAsync` — không `Remove()` | **PASS** |
| Comment | ✅ | ✅ L47 | `SoftDeleteAsync` | **PASS** |
| Document | ✅ | ✅ L48 | `SoftDeleteAsync` (Admin) | **PASS** |
| Interceptor | — | `SoftDeleteInterceptor` registered | Converts `Remove()` → soft | **PASS** |

> `PostLikeRepository.Remove()` xóa junction table — **đúng thiết kế**, không vi phạm soft delete entity.

---

# API Audit

**Tổng endpoint triển khai: 75** (khớp ARCHITECTURE-BE.md §4.0)

| # | Method | Endpoint | Policy Expected | Policy Actual | Status |
|---|--------|----------|-----------------|---------------|--------|
| | **Health (1)** | | | | |
| 1 | GET | `/health` | Anonymous | Anonymous | ✅ |
| | **Auth (8)** | | | | |
| 2 | POST | `/api/v1/auth/register` | Anonymous | Anonymous | ✅ |
| 3 | POST | `/api/v1/auth/login` | Anonymous | Anonymous | ✅ |
| 4 | POST | `/api/v1/auth/google` | Anonymous | Anonymous | ✅ |
| 5 | POST | `/api/v1/auth/forgot-password` | Anonymous | Anonymous | ✅ |
| 6 | POST | `/api/v1/auth/verify-otp` | Anonymous | Anonymous | ✅ |
| 7 | POST | `/api/v1/auth/reset-password` | Anonymous | Anonymous | ✅ |
| 8 | POST | `/api/v1/auth/logout` | Authenticated | RequireAuthenticated | ✅ |
| 9 | GET | `/api/v1/auth/me` | Authenticated | RequireAuthenticated | ✅ |
| | **Feed (12)** | | | | |
| 10 | GET | `/api/v1/posts` | Anonymous | AllowAnonymous | ✅ |
| 11 | GET | `/api/v1/posts/featured` | Anonymous | AllowAnonymous | ✅ |
| 12 | GET | `/api/v1/posts/{id}` | Anonymous | AllowAnonymous | ✅ |
| 13 | POST | `/api/v1/posts` | Authenticated | RequireAuthenticated | ✅ |
| 14 | PUT | `/api/v1/posts/{id}` | Author\|Mod | RequireAuthenticated + service | ✅ |
| 15 | PATCH | `/api/v1/posts/{id}/feature` | Mod\|Admin | RequireModerator | ✅ |
| 16 | DELETE | `/api/v1/posts/{id}` | Author\|Mod\|Admin | RequireAuthenticated + service | ✅ |
| 17 | POST | `/api/v1/posts/{id}/like` | Authenticated | RequireAuthenticated | ✅ |
| 18 | DELETE | `/api/v1/posts/{id}/like` | Authenticated | RequireAuthenticated | ✅ |
| 19 | GET | `/api/v1/posts/{id}/comments` | Anonymous | AllowAnonymous | ✅ |
| 20 | POST | `/api/v1/posts/{id}/comments` | Authenticated | RequireAuthenticated | ✅ |
| 21 | DELETE | `/api/v1/posts/{id}/comments/{commentId}` | Author\|Mod | RequireAuthenticated + service | ✅ |
| 22 | POST | `/api/v1/posts/{id}/report` | Authenticated | RequireAuthenticated | ✅ |
| | **Exam Final (11)** | | | | |
| 23 | GET | `/api/v1/exams` | Anonymous | AllowAnonymous | ✅ |
| 24 | GET | `/api/v1/exams/{id}` | Anonymous | AllowAnonymous | ✅ |
| 25 | GET | `/api/v1/exams/{id}/questions` | Anonymous | AllowAnonymous | ✅ |
| 26 | GET | `/api/v1/exams/{id}/questions/{questionId}` | Premium | RequirePremium | ✅ |
| 27 | POST | `/api/v1/exams/questions/{questionId}/ai-explain` | Authenticated | RequireAuthenticated | ✅ |
| 28 | POST | `/api/v1/exams/{id}/attempts` | RequirePremium | RequirePremium | ✅ |
| 29 | GET | `/api/v1/exams/{id}/attempts/current` | Premium | RequirePremium | ✅ |
| 30 | GET | `/api/v1/exams/{id}/attempts/{attemptId}` | Premium | RequirePremium | ✅ |
| 31 | PUT | `/api/v1/exams/{id}/attempts/{attemptId}/answers` | Premium | RequirePremium | ✅ |
| 32 | POST | `/api/v1/exams/{id}/attempts/{attemptId}/submit` | Premium | RequirePremium | ✅ |
| 33 | GET | `/api/v1/exams/{id}/attempts/{attemptId}/result` | Premium | RequirePremium | ✅ |
| | **Practice (4)** | | | | |
| 34 | POST | `/api/v1/exams/{examId}/practice-submissions` | RequirePremium | RequirePremium | ✅ |
| 35 | GET | `.../practice-submissions/me` | Premium | RequirePremium | ✅ |
| 36 | GET | `.../practice-submissions` | Mod\|Admin | RequireModerator | ✅ |
| 37 | PATCH | `.../practice-submissions/{id}` | Mod\|Admin | RequireModerator | ✅ |
| | **Documents (4)** | | | | |
| 38 | GET | `/api/v1/documents` | Authenticated | RequireAuthenticated | ✅ |
| 39 | GET | `/api/v1/documents/{id}` | Authenticated | RequireAuthenticated | ✅ |
| 40 | GET | `/api/v1/documents/{id}/preview` | Authenticated | RequireAuthenticated | ✅ |
| 41 | GET | `/api/v1/documents/{id}/download` | Premium\|Mod\|Admin | RequireAuthenticated only | ⚠️ MIN-05 |
| | **Premium (5)** | | | | |
| 42 | GET | `/api/v1/premium/plans` | Anonymous | AllowAnonymous | ✅ |
| 43 | POST | `/api/v1/premium/orders` | Authenticated | RequireAuthenticated | ✅ |
| 44 | GET | `/api/v1/premium/orders/{orderId}` | Authenticated | RequireAuthenticated | ✅ |
| 45 | GET | `/api/v1/premium/subscription` | Authenticated | RequireAuthenticated | ✅ |
| 46 | POST | `/api/v1/premium/webhooks/payos` | Anonymous+HMAC | AllowAnonymous + mock sig | ⚠️ MAJ-04 |
| | **Profile (3)** | | | | |
| 47 | GET | `/api/v1/profiles/{username}` | Authenticated | RequireAuthenticated | ✅ |
| 48 | PUT | `/api/v1/profiles/me` | Authenticated | RequireAuthenticated | ✅ |
| 49 | GET | `/api/v1/profiles/me/stats` | Authenticated | RequireAuthenticated | ✅ |
| | **Admin (27)** | | | | |
| 50 | GET | `/api/v1/admin/dashboard` | Admin | RequireAdmin | ✅ |
| 51-55 | * | `/api/v1/admin/users/*` (5) | Admin (PATCH ban: Mod) | RequireAdmin all | ⚠️ MAJ-01 |
| 56-61 | * | `/api/v1/admin/exams/*` (6) | Mixed Mod/Admin | Đúng từng action | ✅ |
| 62-65 | * | `/api/v1/admin/documents/*` (4) | Admin | RequireAdmin | ✅ |
| 66-69 | * | `/api/v1/admin/moderation/*` (4) | Mod\|Admin | RequireModerator | ✅ |
| 70-72 | * | `/api/v1/admin/gamification/*` (3) | Admin | RequireAdmin | ✅ |
| 73-76 | * | `/api/v1/admin/payments/*` (4) | Admin | RequireAdmin | ✅ |

**Endpoint thiếu (G2 — đúng scope):** Chat, QuestionComment, Follow, Notifications, Admin settings, Vouchers API — **không audit fail**.

**API Compliance: 72/75 PASS, 3 PARTIAL**

---

# Test Audit

| Nghiệp vụ quan trọng | Có test? | File | Status |
|----------------------|----------|------|--------|
| PremiumAuthorizationHandler (DB) | ❌ | — | **MISSING** |
| SoftDelete filter | ❌ | — | **MISSING** |
| PayOS Webhook idempotent | ✅ | `PayOsWebhookTests.cs` | **PASS** |
| ACTIVE_ATTEMPT_EXISTS 409 | ❌ integration | Unit logic in service | **PARTIAL** |
| PracticeSubmission IsLatest | ❌ | — | **MISSING** |
| MaskAnswer Free vs Premium | ✅ | `ExamQueryServiceTests.cs` | **PASS** |
| LikePointRule idempotent +2 | ✅ | `PostLikeServiceTests.cs` | **PASS** |
| Auth login + me | ✅ | `AuthEndpointsTests.cs` | **PASS** |
| Guest documents 401 | ❌ | — | **MISSING** |
| RequirePremium rejects Free | ✅ | `PremiumEndpointsTests.cs` | **PASS** |
| Subscription activation | ✅ | `SubscriptionServiceTests.cs` | **PASS** |
| Grading | ✅ | `ExamGradingServiceTests.cs` | **PASS** |
| Banned user | ✅ | `AuthServiceTests.cs` | **PASS** |

**Coverage estimate:** ~**40%** nghiệp vụ bắt buộc §8 (7/17 hạng mục có test đầy đủ)

---

# Missing Implementations

| Hạng mục | Spec | Trạng thái |
|----------|------|------------|
| Premium DB-backed trong `ICurrentUserService` | §1.7 | **Thiếu** |
| Moderator ban tạm user | §4.8 | **Thiếu** |
| UserBan ghi khi ban | §3.4.7 | **Thiếu** |
| PayOS HMAC thật | §6.5 | **Mock only** |
| PayOsWebhookHandler wired | §6.5 | **Dead code** |
| PaymentAuditLog append-only interceptor | §6.5 | **Thiếu** |
| AI token 10/1000 theo tier | §6.3 | **Sai (50 all)** |
| Post Rejected→Pending | §4.2 | **Thiếu** |
| Rate limiting OTP/login/AI | §6.9 | **Thiếu** |
| Grant tokens admin | §4.8 | **No-op** |
| Feed semester/major filter | §4.2 | **Thiếu** (entity không có field) |
| G2 modules (Chat, etc.) | §4.9 | **Đúng scope — không triển khai** |

---

# Recommended Fixes

## Ưu tiên P0 (trước khi FE integration)

1. **CRIT-01/02:** Refactor `ICurrentUserService.IsPremium` → query `Subscriptions` + `IMemoryCache`; invalidate khi webhook/admin confirm subscription.
2. **MAJ-01:** Cho phép Mod `PATCH /admin/users/{id}` với validation chỉ ban tạm.
3. **MAJ-02:** Ghi `UserBan` khi `UpdateBanAsync`; fix `GET /admin/moderation/banned`.
4. **MAJ-03:** Wire `PremiumController` → `PayOsWebhookHandler`; xóa duplicate trong `PremiumService`.

## Ưu tiên P1 (trước staging)

5. **MAJ-04:** Implement PayOS HMAC verification thật.
6. **MAJ-05:** Interceptor append-only `PaymentAuditLog`.
7. **MAJ-06:** AI token limits 10/1000 từ config.
8. **MIN-05:** `DocumentsController` download → `RequirePremium` hoặc staff policy.

## Ưu tiên P2 (polish)

9. MIN-01: Loại Domain reference khỏi API layer.
10. MIN-02: Post resubmit Rejected→Pending.
11. MIN-06: AspNetCoreRateLimit.
12. MIN-07: Implement `GrantAiTokensAsync`.
13. Bổ sung test: PremiumAuthorizationHandler, SoftDelete, PracticeSubmission, Guest 401 documents.

---

# Final Verdict

| Tiêu chí | Đánh giá |
|----------|----------|
| Scaffold & structure | ✅ Hoàn chỉnh |
| Endpoint coverage | ✅ 75/75 |
| Core business (Like, Attempt, Practice IsLatest, Soft delete) | ✅ Đúng spec |
| Premium authorization model | ❌ **Không tuân thủ §1.7 đầy đủ** |
| Moderation & Admin RBAC | ⚠️ Mod ban bị chặn; UserBan broken |
| PayOS production-ready | ❌ Mock signature; dual handler |
| Test coverage nghiệp vụ | ⚠️ ~40% |

### **FINAL VERDICT: CONDITIONAL PASS (74/100)**

Solution **đủ để dev/demo nội bộ** và **tiếp tục tích hợp FE** với lưu ý workaround (user phải re-login sau thanh toán để có `isPremium` claim đúng).

**Không đạt production compliance** cho đến khi xử lý **CRIT-01, CRIT-02** và các hạng mục P0/P1 trong Recommended Fixes.

---

_Báo cáo sinh từ audit source code thực tế — không giả định._
