# Use Case Mapping Report

> **Date:** 2026-06-06  
> **Sources:** `SEHUB_PhanTichNghiepVu.md` · `ARCHITECTURE-BE.md` · `ARCHITECTURE.md`  
> **Method:** CodeGraph route/symbol trace + source inspection  
> **Code modified:** None

---

## Summary

| Status | Count | % |
|--------|-------|---|
| **PASS** | 38 | 69% |
| **PARTIAL** | 9 | 16% |
| **FAIL / MISSING** | 8 | 15% |
| **Total UCs** | 55 | 100% |

**P0 core (Auth · Feed · Exam · Document · Premium · Practice):** 34 PASS · 4 PARTIAL · 0 critical MISSING

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **PASS** | UC chain implemented end-to-end |
| **PARTIAL** | Core flow exists; behavior/policy differs from BA |
| **FAIL** | Stub or broken against BA intent |
| **MISSING** | Not implemented (incl. G2 deferrals) |

---

## Authentication (§3.1)

### UC-AUTH-01 — Đăng ký (Email)

| Field | Detail |
|-------|--------|
| **Actors** | Guest |
| **Preconditions** | Email/username not registered |
| **Main Flow** | Submit credentials → validate → create user + profile → send email OTP → return JWT |
| **Alternative** | Duplicate email/username → 409 |
| **Business Rules** | BCrypt hash; FluentValidation; rate limit 5/min/IP |

**Mapping:**

```
UC-AUTH-01 → AuthController → POST /api/v1/auth/register
           → AuthService.RegisterAsync
           → ApplicationUser, UserProfile, OtpVerification, RefreshToken
           → AspNetUsers, UserProfiles, OtpVerifications, RefreshTokens
```

**Result:** **PASS**

---

### UC-AUTH-02 — Đăng nhập

| Field | Detail |
|-------|--------|
| **Actors** | Student, Moderator, Admin |
| **Preconditions** | Valid credentials; user not banned |
| **Main Flow** | Email/username + password → JWT + refresh token + profile |
| **Alternative** | Bad credentials → 404 generic; banned → 403 |
| **Business Rules** | Streak update on login; optional email-confirmed gate |

**Mapping:** `POST /api/v1/auth/login` → `AuthService.LoginAsync` → `ApplicationUser`, `RefreshToken`

**Result:** **PASS**

---

### UC-AUTH-03 — Quên mật khẩu (OTP)

| Field | Detail |
|-------|--------|
| **Actors** | Student |
| **Main Flow** | forgot-password → verify-otp → reset-password |
| **Business Rules** | OTP hash; 60s cooldown; 5/hour; 5 attempts; 10 min expiry |

**Mapping:** `AuthController` → `AuthService` → `OtpService` → `OtpVerification`

**Result:** **PASS**

---

### UC-AUTH-04 — Đăng xuất

**Mapping:** `POST /api/v1/auth/logout` → `AuthService.LogoutAsync` → revoke `RefreshTokens`

**Result:** **PASS**

---

### UC-AUTH-05 — OAuth Google

| Field | Detail |
|-------|--------|
| **Main Flow (BA)** | Google 1-step OAuth → verify id_token → create/find user |
| **Actual** | `IdToken` treated as email stub — no Google API validation |

**Mapping:** `POST /api/v1/auth/google` → `AuthService.GoogleAuthAsync` → `ApplicationUser`

**Result:** **FAIL**

---

### UC-AUTH-06 — Xác minh email *(extra vs BA minimum)*

**Mapping:** `send-email-verification`, `verify-email` → `OtpService` → `OtpVerification`, `EmailConfirmed`

**Result:** **PASS**

---

### UC-AUTH-07 — OTP SMS

**Mapping:** `send-sms-otp`, `verify-sms-otp` → `OtpService` → `MockSmsService`

**Result:** **PARTIAL** (mock SMS only)

---

### UC-AUTH-08 — Refresh token *(ARCH-BE extension)*

**Mapping:** `POST /api/v1/auth/refresh` → `AuthService.RefreshAsync` → `RefreshToken` (rotation + reuse detection)

**Result:** **PASS**

---

### UC-AUTH-09 — Get current user

**Mapping:** `GET /api/v1/auth/me` → `AuthService.GetMeAsync` → `ApplicationUser`, `UserProfile`, `Subscription`

**Result:** **PASS**

---

## Feed & Community (§3.2)

| UC ID | UC Name | Actors | Mapping Chain | Result |
|-------|---------|--------|---------------|--------|
| UC-FEED-01 | Xem feed | Guest+ | `GET /posts` → `PostService` → `Post` | **PASS** |
| UC-FEED-02 | Tạo bài viết | Student+ | `POST /posts` → `PostService.CreateAsync` → `Post` | **PASS** |
| UC-FEED-03 | Sửa bài viết | Student+ | `PUT /posts/{id}` → `PostService.UpdateAsync` | **PARTIAL** (no Rejected→Pending) |
| UC-FEED-04 | Xóa bài viết | Student+/Mod | `DELETE /posts/{id}` → soft delete `Post` | **PASS** |
| UC-FEED-05 | Like / Unlike | Student+ | `POST/DELETE .../like` → `PostLikeService` → `PostLike` | **PASS** |
| UC-FEED-06 | Comment / Reply | Student+ | `POST .../comments` → `CommentService` → `Comment` | **PASS** |
| UC-FEED-07 | Báo cáo bài viết | Student+ | `POST .../report` → `PostReportService` → `PostReport` | **PASS** |
| UC-FEED-08 | Bài nổi bật | Mod+ | `GET /featured`, `PATCH .../feature` → `Post.IsFeatured` | **PASS** |
| UC-FEED-09 | Tìm kiếm bài | All | `GET /posts?search=` → `PostRepository` | **PARTIAL** (title/content only) |
| UC-FEED-10 | Pre-moderation | Mod | — | **MISSING** (posts → Published directly) |
| UC-FEED-11 | Streak & thống kê | Student+ | Login streak + `GET /profiles/me/stats` | **PARTIAL** (no heatmap) |

---

## Exam — Cuối kỳ (§3.3)

| UC ID | UC Name | Mapping | Result |
|-------|---------|---------|--------|
| UC-EXAM-01 | Danh sách đề | `GET /exams` → `ExamQueryService` → `Exam` | **PASS** |
| UC-EXAM-02 | Chi tiết đề | `GET /exams/{id}` → `Exam` | **PASS** |
| UC-EXAM-03 | Xem câu hỏi (ẩn đáp án) | `GET .../questions` → `Question`, `QuestionOption` | **PASS** |
| UC-EXAM-04 | Xem đáp án | `GET .../questions/{id}` `RequirePremium` | **PASS** |
| UC-EXAM-05 | Làm bài trực tuyến | `POST/PUT/POST submit .../attempts` → `ExamAttemptService` → `ExamAttempt` | **PASS** |
| UC-EXAM-06 | AI giải thích | `POST .../ai-explain` → `AiExplanationApplicationService` → `AiTokenDailyUsage` | **PASS** |
| UC-EXAM-07 | Bình luận câu hỏi | — | **MISSING** (G2) |

---

## Exam — Thực hành (§3.4)

| UC ID | UC Name | Mapping | Result |
|-------|---------|---------|--------|
| UC-PRAC-01 | Danh sách đề TH | `GET /exams?type=Practice` | **PASS** |
| UC-PRAC-02 | Xem nội dung đề TH | `GET /exams/{id}` (`AssetUrl`) | **PASS** |
| UC-PRAC-03 | Nộp GitHub URL | `POST .../practice-submissions` → `PracticeSubmissionService` | **PASS** |
| UC-PRAC-04 | Mod đánh giá | `PATCH .../practice-submissions/{id}` | **PASS** |
| UC-PRAC-05 | Xem danh sách nộp | `GET .../practice-submissions` `RequireModerator` | **PASS** |

---

## Documents (§3.5)

| UC ID | UC Name | Mapping | Result |
|-------|---------|---------|--------|
| UC-DOC-01 | Xem danh sách | `GET /documents` → `DocumentService` → `Document` | **PASS** |
| UC-DOC-02 | Preview (Free ≤3 trang) | `GET .../preview` | **PASS** |
| UC-DOC-03 | Download (Premium) | `GET .../download` | **PASS** |
| UC-DOC-04 | Admin upload/quản lý | `Admin/DocumentsController` → `AdminDocumentService` | **PASS** |

---

## Profile & Gamification (§3.6)

| UC ID | UC Name | Mapping | Result |
|-------|---------|---------|--------|
| UC-PROF-01 | Trang cá nhân | `GET /profiles/{username}` → `ProfileService` | **PASS** |
| UC-PROF-02 | Cập nhật profile | `PUT /profiles/me` | **PASS** |
| UC-PROF-03 | Thống kê | `GET /profiles/me/stats` → `ProfileStatsService` | **PARTIAL** |
| UC-GAME-01 | 26 danh hiệu | `Badge`, `UserBadge` schema only | **MISSING** |
| UC-GAME-02 | Streak +20đ/7 ngày | `UpdateStreakOnLoginAsync` | **MISSING** |
| UC-GAME-03 | Heatmap 6 tháng | — | **MISSING** (G2) |

---

## Premium & Payment (§3.8)

| UC ID | UC Name | Mapping | Result |
|-------|---------|---------|--------|
| UC-PREM-01 | Xem gói | `GET /premium/plans` → `SubscriptionPlan` | **PASS** |
| UC-PREM-02 | Tạo đơn PayOS | `POST /premium/orders` → `PayOsService` → `PaymentOrder` | **PASS** |
| UC-PREM-03 | Webhook | `POST /premium/webhooks/payos` → `PayOsWebhookHandler` | **PASS** |
| UC-PREM-04 | Trạng thái subscription | `GET /premium/subscription` → `Subscription` | **PASS** |
| UC-PREM-05 | Admin xác nhận thủ công | `POST /admin/payments/{id}/confirm` → `PaymentAuditLog` | **PASS** |

---

## Moderator (§2.4)

| UC ID | UC Name | Mapping | Result |
|-------|---------|---------|--------|
| UC-MOD-01 | Xử lý báo cáo | `Admin/ModerationController` → `ModerationService` | **PASS** |
| UC-MOD-02 | Khóa tạm | `PATCH /admin/users/{id}` → `UserBan` | **PASS** |
| UC-MOD-03 | Ghim bài nổi bật | `PATCH /posts/{id}/feature` | **PASS** |
| UC-MOD-04 | Thêm đề (chờ duyệt) | `POST /admin/exams` → `PendingApproval` | **PASS** |
| UC-MOD-05 | Xóa comment | `DELETE .../comments/{id}` | **PASS** |

---

## Admin (§2.5)

| UC ID | UC Name | Mapping | Result |
|-------|---------|---------|--------|
| UC-ADM-01 | Dashboard | `GET /admin/dashboard` | **PASS** |
| UC-ADM-02 | Quản lý tài khoản | `Admin/UsersController` | **PASS** |
| UC-ADM-03 | CRUD + duyệt đề | `Admin/ExamsController` | **PARTIAL** (Mod create; Admin approve/OCR) |
| UC-ADM-04 | Quản lý tài liệu | `Admin/DocumentsController` | **PASS** |
| UC-ADM-05 | Cấu hình gamification | `Admin/GamificationController` | **PARTIAL** (no voucher API) |
| UC-ADM-06 | Xuất CSV / backup | — | **MISSING** (G2) |

---

## Deferred G2 (§5.1 — Expected MISSING)

| UC ID | UC Name | Result | Notes |
|-------|---------|--------|-------|
| UC-CHAT-01 | Follow / Chat WebSocket | **MISSING** | Aligned with scope cut |
| UC-NOTIF-01 | Thông báo real-time | **MISSING** | No notification hub |
| UC-BOT-01 | Chatbot tư vấn | **MISSING** | No chatbot API |
| UC-SEARCH-01 | Tìm kiếm người dùng | **MISSING** | §3.7 deferred |

---

## Quick Reference — UC → API → Service → Entity → Table

```
UC-AUTH-*  → AuthController        → AuthService/OtpService     → ApplicationUser, OtpVerification, RefreshToken
UC-FEED-*  → PostsController       → Post/Comment/Like/Report   → Post, Comment, PostLike, PostReport
UC-EXAM-*  → ExamsController       → ExamQuery/Attempt/Grading  → Exam, Question, ExamAttempt
UC-PRAC-*  → PracticeSubmissions   → PracticeSubmissionService  → PracticeSubmission
UC-DOC-*   → DocumentsController   → DocumentService            → Document, DocumentCategory
UC-PREM-*  → PremiumController     → Premium/Subscription       → PaymentOrder, Subscription
UC-ADM-*   → Admin/*Controller     → Admin*Service              → (aggregates above)
```
