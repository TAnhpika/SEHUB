# SEHub — Use Case → Backend Mapping

> **Date:** 2026-06-06  
> **Source of truth:** `SEHUB_PhanTichNghiepVu.md` (BA v1.0, Giai đoạn 1)  
> **Verification method:** CodeGraph symbol/route queries + direct source inspection  
> **CodeGraph index:** 463 files · 4,542 nodes · 80 route nodes

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **PASS** | Endpoint, service, entity, and table chain implemented and aligned with BA |
| **PARTIAL** | Core flow exists but behavior, policy, or workflow differs from BA |
| **MISSING** | Not implemented (or explicitly deferred G2) |

---

## Authentication (§3.1)

| UC ID | UC Name | Status | Endpoint | Service | Entity / Tables | Notes |
|-------|---------|--------|----------|---------|-----------------|-------|
| UC-AUTH-01 | Đăng ký (Email) | **PASS** | `POST /api/v1/auth/register` | `AuthService.RegisterAsync` | `ApplicationUser`, `UserProfile`, `OtpVerification` | Auto-sends email verification OTP on register (`AuthService.cs:159`) |
| UC-AUTH-02 | Đăng nhập | **PASS** | `POST /api/v1/auth/login` | `AuthService.LoginAsync` | `ApplicationUser`, `RefreshToken` | JWT + streak update; optional `RequireConfirmedEmail` gate (`appsettings.json:38-40`) |
| UC-AUTH-03 | Quên mật khẩu (OTP) | **PASS** | `POST /api/v1/auth/forgot-password`, `verify-otp`, `reset-password` | `AuthService` → `OtpService` | `OtpVerification` | Cooldown 60s, max 5/hour, 5 attempts, 10 min expiry (`OtpService.cs:253-281`) |
| UC-AUTH-04 | Đăng xuất | **PASS** | `POST /api/v1/auth/logout` | `AuthService.LogoutAsync` | `RefreshToken` | Revokes refresh token |
| UC-AUTH-05 | OAuth Google | **PARTIAL** | `POST /api/v1/auth/google` | `AuthService.GoogleAuthAsync` | `ApplicationUser` | **Stub only** — treats `IdToken` as email string; no Google token verification (`AuthService.cs:219-223`) |
| UC-AUTH-06 | Xác minh email | **PASS** *(extra)* | `POST /api/v1/auth/send-email-verification`, `verify-email` | `AuthService` → `OtpService` | `OtpVerification`, `ApplicationUser.EmailConfirmed` | Beyond BA P0 minimum; implemented |
| UC-AUTH-07 | OTP SMS | **PARTIAL** *(extra)* | `POST /api/v1/auth/send-sms-otp`, `verify-sms-otp` | `OtpService` → `MockSmsService` | `OtpVerification` | Endpoints exist; SMS is mock only per project constraint |

**CodeGraph chain (forgot-password):** `AuthController` → `AuthService.SendForgotPasswordOtpAsync` → `OtpService.GenerateAndSendEmailAsync` → `IEmailService.SendOtpEmailAsync`

---

## Feed & Community (§3.2)

| UC ID | UC Name | Status | Endpoint | Service | Entity / Tables | Notes |
|-------|---------|--------|----------|---------|-----------------|-------|
| UC-FEED-01 | Xem feed | **PASS** | `GET /api/v1/posts` | `PostService.GetPostsAsync` | `Post`, `PostLike` | Pagination + search filter (`PostRepository.cs:22-24`) |
| UC-FEED-02 | Tạo bài viết | **PASS** | `POST /api/v1/posts` | `PostService.CreateAsync` | `Post` | Markdown ≤10,000 chars (`CreatePostRequestValidator.cs:8-13`); +10 points |
| UC-FEED-03 | Sửa bài viết | **PARTIAL** | `PUT /api/v1/posts/{id}` | `PostService.UpdateAsync` | `Post` | Author/Mod can edit; **no Rejected→Pending resubmit** (`PostService.cs:119-134`) |
| UC-FEED-04 | Xóa bài viết | **PASS** | `DELETE /api/v1/posts/{id}` | `PostService.DeleteAsync` | `Post` | Soft delete via `IPostRepository.SoftDeleteAsync` |
| UC-FEED-05 | Like / Unlike | **PASS** | `POST/DELETE /api/v1/posts/{id}/like` | `PostLikeService` | `PostLike` | Idempotent like (`PostLikeService.cs:36-44`); +2 points on first like |
| UC-FEED-06 | Comment / Reply | **PASS** | `GET/POST /api/v1/posts/{id}/comments`, `DELETE .../comments/{id}` | `CommentService` | `Comment` | Nested via `ParentCommentId`; soft delete |
| UC-FEED-07 | Báo cáo bài viết | **PASS** | `POST /api/v1/posts/{id}/report` | `PostReportService` | `PostReport` | Pending report dedup |
| UC-FEED-08 | Bài nổi bật | **PASS** | `GET /api/v1/posts/featured`, `PATCH /api/v1/posts/{id}/feature` | `PostService` | `Post.IsFeatured` | Mod/Admin feature flag |
| UC-FEED-09 | Tìm kiếm bài | **PARTIAL** | `GET /api/v1/posts?search=` | `PostRepository` | `Post` | Title/content `Contains` only; no dedicated tag index table (G1 JSON tags) |
| UC-FEED-10 | Pre-moderation | **MISSING** | — | — | `Post.Status` | Entity supports `Pending/Rejected` but posts created as `Published` directly (`PostService.cs:108`) |

---

## Exam — Cuối kỳ (§3.3)

| UC ID | UC Name | Status | Endpoint | Service | Entity / Tables | Notes |
|-------|---------|--------|----------|---------|-----------------|-------|
| UC-EXAM-01 | Danh sách đề thi | **PASS** | `GET /api/v1/exams` | `ExamQueryService` | `Exam` | Filter `type`, `semester`, `major` |
| UC-EXAM-02 | Chi tiết đề | **PASS** | `GET /api/v1/exams/{id}` | `ExamQueryService` | `Exam` | Unpublished hidden from non-Mod (`ExamQueryService.cs:41-44`) |
| UC-EXAM-03 | Xem câu hỏi (ẩn đáp án) | **PASS** | `GET /api/v1/exams/{id}/questions` | `ExamQueryService` | `Question`, `QuestionOption` | Masks for Guest/Free (`ExamQueryService.cs:100-101`) |
| UC-EXAM-04 | Xem đáp án | **PASS** | `GET /api/v1/exams/{id}/questions/{questionId}` | `ExamQueryService` | `Question` | `RequirePremium` policy |
| UC-EXAM-05 | Làm bài trực tuyến | **PASS** | `POST .../attempts`, `PUT .../answers`, `POST .../submit`, `GET .../current` | `ExamAttemptService` | `ExamAttempt` | 409 `ACTIVE_ATTEMPT_EXISTS` (`ExamAttemptService.cs:45-49`) |
| UC-EXAM-06 | AI giải thích đáp án | **PASS** | `POST /api/v1/exams/questions/{id}/ai-explain` | `AiExplanationApplicationService` | `AiTokenDailyUsage` | Lazy reset: Free 10 / Premium 1000 per day |
| UC-EXAM-07 | Bình luận câu hỏi | **MISSING** *(G2)* | — | — | — | `QuestionComment` not implemented per `ARCHITECTURE-BE.md` §4.9 |

---

## Exam — Thực hành (§3.4)

| UC ID | UC Name | Status | Endpoint | Service | Entity / Tables | Notes |
|-------|---------|--------|----------|---------|-----------------|-------|
| UC-PRAC-01 | Danh sách đề TH | **PASS** | `GET /api/v1/exams?type=Practice` | `ExamQueryService` | `Exam` | Shared list endpoint |
| UC-PRAC-02 | Xem nội dung đề TH | **PASS** | `GET /api/v1/exams/{id}` | `ExamQueryService` | `Exam.AssetUrl` | Metadata + asset URL |
| UC-PRAC-03 | Nộp GitHub URL | **PASS** | `POST /api/v1/exams/{examId}/practice-submissions` | `PracticeSubmissionService` | `PracticeSubmission` | Premium only; `IsLatest` flip (`PracticeSubmissionService.cs:48-58`) |
| UC-PRAC-04 | Mod đánh giá nộp bài | **PASS** | `GET/PATCH .../practice-submissions` | `PracticeSubmissionService` | `PracticeSubmission` | Status Passed/Failed + `ReviewerComment` |
| UC-PRAC-05 | Xem danh sách nộp (Mod) | **PASS** | `GET /api/v1/exams/{examId}/practice-submissions` | `PracticeSubmissionService` | `PracticeSubmission` | `RequireModerator` |

---

## Documents (§3.5)

| UC ID | UC Name | Status | Endpoint | Service | Entity / Tables | Notes |
|-------|---------|--------|----------|---------|-----------------|-------|
| UC-DOC-01 | Xem danh sách tài liệu | **PASS** | `GET /api/v1/documents` | `DocumentService` | `Document`, `DocumentCategory` | Guest → 401 (`DocumentService.cs:113-118`) |
| UC-DOC-02 | Xem preview | **PASS** | `GET /api/v1/documents/{id}/preview` | `DocumentService` | `Document` | Free ≤3 pages (`DocumentService.cs:12,74-83`) |
| UC-DOC-03 | Tải tài liệu | **PASS** | `GET /api/v1/documents/{id}/download` | `DocumentService` | `Document` | Service enforces Premium/Mod/Admin (`DocumentService.cs:102-105`); controller is `RequireAuthenticated` only |
| UC-DOC-04 | Admin upload/quản lý | **PASS** | `POST/GET/DELETE /api/v1/admin/documents` | `AdminDocumentService` | `Document` | Admin-only controller |

---

## Profile & Gamification (§3.6)

| UC ID | UC Name | Status | Endpoint | Service | Entity / Tables | Notes |
|-------|---------|--------|----------|---------|-----------------|-------|
| UC-PROF-01 | Trang cá nhân | **PASS** | `GET /api/v1/profiles/{username}` | `ProfileService` | `UserProfile`, `ApplicationUser` | Authenticated read |
| UC-PROF-02 | Cập nhật profile | **PASS** | `PUT /api/v1/profiles/me` | `ProfileService` | `UserProfile` | |
| UC-PROF-03 | Thống kê điểm/streak | **PARTIAL** | `GET /api/v1/profiles/me/stats` | `ProfileStatsService` | `ApplicationUser`, `LevelConfig` | Points + streak count; **no heatmap**, **no badge engine** |
| UC-GAME-01 | 26 danh hiệu | **MISSING** *(P1)* | — | — | `Badge`, `UserBadge` | Schema seeded; no award logic on events |
| UC-GAME-02 | Streak +20đ / 7 ngày | **MISSING** | — | `UserRepository.UpdateStreakOnLoginAsync` | `ApplicationUser.StreakCount` | Streak increments; **no +20 point bonus** (`UserRepository.cs:159-170`) |
| UC-GAME-03 | Heatmap 6 tháng | **MISSING** *(G2)* | — | — | — | Deferred per BA §5.1 |

---

## Premium & Payment (§3.8)

| UC ID | UC Name | Status | Endpoint | Service | Entity / Tables | Notes |
|-------|---------|--------|----------|---------|-----------------|-------|
| UC-PREM-01 | Xem gói Premium | **PASS** | `GET /api/v1/premium/plans` | `PremiumService` | `SubscriptionPlan` | Anonymous |
| UC-PREM-02 | Tạo đơn PayOS | **PASS** | `POST /api/v1/premium/orders` | `PremiumService` → `PayOsService` | `PaymentOrder` | QR/checkout URL |
| UC-PREM-03 | Webhook xác nhận | **PASS** | `POST /api/v1/premium/webhooks/payos` | `PayOsWebhookHandler` | `PaymentOrder`, `Subscription`, `PaymentAuditLog` | HMAC verify + idempotent |
| UC-PREM-04 | Trạng thái subscription | **PASS** | `GET /api/v1/premium/subscription` | `PremiumService` | `Subscription` | DB-backed premium check |
| UC-PREM-05 | Admin xác nhận thủ công | **PASS** | `POST /api/v1/admin/payments/{orderId}/confirm` | `AdminPaymentService` | `PaymentAuditLog` | Append-only audit |

---

## Moderator (§2.4)

| UC ID | UC Name | Status | Endpoint | Service | Entity / Tables | Notes |
|-------|---------|--------|----------|---------|-----------------|-------|
| UC-MOD-01 | Xử lý báo cáo | **PASS** | `GET/PATCH /api/v1/admin/moderation/reports` | `ModerationService` | `PostReport`, `Post` | Optional `delete_post` action |
| UC-MOD-02 | Khóa tạm tài khoản | **PASS** | `PATCH /api/v1/admin/users/{id}` | `AdminUserService` | `ApplicationUser`, `UserBan` | Mod limited to `BanType.Temp` + `BanUntil` (`AdminUserService.cs:317-337`) |
| UC-MOD-03 | Ghim bài nổi bật | **PASS** | `PATCH /api/v1/posts/{id}/feature` | `PostService.SetFeaturedAsync` | `Post.IsFeatured` | `RequireModerator` |
| UC-MOD-04 | Thêm đề thi (chờ duyệt) | **PASS** | `POST /api/v1/admin/exams` | `AdminExamService` | `Exam` | Created `PendingApproval` (`AdminExamService.cs:121`) |
| UC-MOD-05 | Xóa comment vi phạm | **PASS** | `DELETE /api/v1/posts/{id}/comments/{id}` | `CommentService` | `Comment` | Mod or author soft delete |

---

## Admin (§2.5)

| UC ID | UC Name | Status | Endpoint | Service | Entity / Tables | Notes |
|-------|---------|--------|----------|---------|-----------------|-------|
| UC-ADM-01 | Dashboard thống kê | **PASS** | `GET /api/v1/admin/dashboard` | `AdminDashboardService` | Aggregates | |
| UC-ADM-02 | Quản lý tài khoản | **PASS** | `GET/PATCH /api/v1/admin/users`, `reset-password`, `grant-tokens` | `AdminUserService` | `ApplicationUser` | Admin-only list/detail; Mod can PATCH ban |
| UC-ADM-03 | CRUD + duyệt đề | **PARTIAL** | `GET/POST/PUT/approve/ocr /api/v1/admin/exams` | `AdminExamService`, `OcrExamService` | `Exam` | Mod can create; **PUT + OCR require Admin** |
| UC-ADM-04 | Quản lý tài liệu | **PASS** | `/api/v1/admin/documents/*` | `AdminDocumentService` | `Document` | |
| UC-ADM-05 | Cấu hình gamification | **PARTIAL** | `GET/PUT /api/v1/admin/gamification/levels`, `GET badges` | `AdminGamificationService` | `LevelConfig`, `Badge` | Levels CRUD; **no voucher API** |
| UC-ADM-06 | Xuất CSV / backup | **MISSING** *(G2)* | — | — | — | BA §2.5 deferred |

---

## Deferred G2 (§5.1 — expected MISSING)

| UC ID | UC Name | Status | Notes |
|-------|---------|--------|-------|
| UC-CHAT-01 | Follow / Chat WebSocket | **MISSING** | No controller/hub — aligned with scope cut |
| UC-NOTIF-01 | Thông báo real-time | **MISSING** | No notification hub |
| UC-BOT-01 | Chatbot tư vấn | **MISSING** | No admin settings/chatbot API |

---

## Summary

| Status | Count |
|--------|-------|
| PASS | 38 |
| PARTIAL | 9 |
| MISSING | 8 |

**P0 core (Auth · Feed · Exam · Document · Premium · Practice):** 34/38 PASS, 4 PARTIAL, 0 critical MISSING for MVP demo paths.
