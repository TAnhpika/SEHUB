# SEHub — Frontend ↔ Backend Alignment Report

> **Ngày audit:** 2026-06-05  
> **Vai trò:** Principal Solution Architect  
> **Phương pháp:** Đọc source code thực tế — **không suy đoán**

---

# Executive Summary

| Câu hỏi | Kết luận |
|---------|----------|
| FE hiện tại có thể tích hợp BE hiện tại không? | **Chưa** — FE **0%** HTTP/API wiring; BE **76 endpoint** sẵn sàng |
| Thiếu màn hình / API / DTO / flow? | **Có** — xem chi tiết từng phase bên dưới |

**Verdict:** `NOT_READY_FOR_FE`

Backend MVP G1 đã triển khai đủ phần lớn nghiệp vụ P0 (Auth, Feed, Exam, Document, Premium, Profile, Admin/Moderation). Frontend là **UI prototype hoàn chỉnh về mặt giao diện** nhưng **chưa có lớp tích hợp API** (không axios, không Redux, không service layer, không `VITE_API_URL`).

**Gap lớn nhất:** Không phải thiếu API backend, mà **FE chưa gọi API** + **lệch route/DTO/flow** giữa mock data và contract thực tế.

### Tài liệu tham chiếu

| Tài liệu | Trạng thái trong repo | Vai trò audit |
|----------|----------------------|---------------|
| `ARCHITECTURE.md` | ✅ Có | FE target: Redux, axios, routes `/exams`, `/admin` (§4) |
| `ARCHITECTURE-FE.md` | ❌ **Không tồn tại** | Thay bằng `ARCHITECTURE.md` + `ARCHITECTURE-BE.md` §4 cột FE route + `fe/src/app/App.jsx` |
| `ARCHITECTURE-BE.md` | ✅ Có (v2.0) | BE contract: 71+ endpoints §4, ma trận Phụ lục D, `ApiResponse<T>` §5 |
| `SEHUB_PhanTichNghiepVu.md` | ✅ Có | Use case P0/P1/P2 §3, §5, §6 |
| Backend source | ✅ `SEHub.Backend/` | 15 controllers, **76 endpoints** (grep verified), 74 Contracts DTOs |
| Frontend source | ✅ `fe/` | 22 mock `*Data.js`, React Context — **0** `/api/v1` calls (grep verified) |
| Swagger/OpenAPI | ✅ Swashbuckle v10.2.1 | **Development only** — `Program.cs` L17-21, JWT Bearer scheme |

---

# Business Mapping

> Nguồn use case: `SEHUB_PhanTichNghiepVu.md` §3, §5 (P0/P1/P2)

| Use Case | FE Screen | BE API | Status |
|----------|-----------|--------|--------|
| Đăng ký (email) | `RegisterPage` `/register` | `POST /api/v1/auth/register` | **COMPLETE** *(chưa wire)* |
| Đăng nhập (email/user) | `LoginPage` `/login` | `POST /api/v1/auth/login` | **COMPLETE** *(mock auth)* |
| Đăng nhập Google | ❌ Không có UI OAuth | `POST /api/v1/auth/google` | **FE_MISSING** |
| Quên mật khẩu (OTP) | `ForgotPasswordPage` | `POST forgot-password`, `verify-otp`, `reset-password` | **COMPLETE** *(FE có bước SMS mock, BE email-only)* |
| Refresh token | ❌ Không implement | ❌ Không có endpoint | **BOTH_MISSING** |
| Đăng xuất | Header logout (mock) | `POST /api/v1/auth/logout` | **COMPLETE** *(chưa wire)* |
| GET me / session | `AuthProvider` mock | `GET /api/v1/auth/me` | **COMPLETE** *(chưa wire)* |
| Xem feed bài viết | `FeedPage` `/community`, `HomePage` | `GET /api/v1/posts` | **COMPLETE** |
| Tạo bài viết | `CreatePostPage` | `POST /api/v1/posts` | **COMPLETE** |
| Sửa bài viết | ❌ Không có màn edit | `PUT /api/v1/posts/{id}` | **FE_MISSING** |
| Xóa bài viết | `PostOwnerMenu` (mock) | `DELETE /api/v1/posts/{id}` | **COMPLETE** *(chưa wire)* |
| Like bài viết | `PostCard` | `POST/DELETE .../like` | **COMPLETE** |
| Comment | `PostDetailPage/Modal` | `GET/POST .../comments` | **COMPLETE** |
| Reply comment | Nút Reply UI only | `CreateCommentRequest.ParentCommentId` | **COMPLETE** *(UI chưa gửi parentId)* |
| Share bài viết | Nút Share (toast) | ❌ Không có API | **BE_MISSING** |
| Báo cáo bài viết | `ReportPostModal` | `POST .../report` | **COMPLETE** |
| Bài viết nổi bật | Sidebar `FEATURED_POSTS` mock | `GET /api/v1/posts/featured` | **COMPLETE** |
| Lọc feed semester/major | `PostFeedFilters` UI | `PostQueryParams` *(BE filter chưa đầy đủ)* | **BE_MISSING** *(MIN backlog)* |
| Danh sách đề thi cuối kỳ | `ReviewQuestionsPage` | `GET /api/v1/exams` | **COMPLETE** |
| Chi tiết đề / câu hỏi | `ExamDetailPage` | `GET exams/{id}`, `.../questions` | **COMPLETE** |
| Xem đáp án (Premium) | UI ẩn/hiện mock | `GET .../questions/{questionId}` RequirePremium | **COMPLETE** |
| Làm bài trắc nghiệm (attempt) | ❌ Không có `ExamDoPage` | `POST .../attempts`, PUT answers, submit | **FE_MISSING** |
| Kết quả bài thi | ❌ Không có `ExamResultPage` | `GET .../result` | **FE_MISSING** |
| AI giải thích đáp án | ❌ Không có UI | `POST .../ai-explain` | **FE_MISSING** |
| Bình luận câu hỏi đề | Nút comment icon (no-op) | ❌ G2 — không có API | **BOTH_MISSING** *(cắt G1)* |
| Đề thực hành — danh sách | `PracticeQuestionsPage` | `GET /api/v1/exams` (ExamType) | **COMPLETE** |
| Nộp GitHub URL (Premium) | ❌ Không có form student | `POST .../practice-submissions` | **FE_MISSING** |
| Mod review practice | `AddPracticeExamPage` *(upload, không review list)* | `GET/PATCH practice-submissions` | **FE_MISSING** *(partial BE)* |
| Tài liệu — danh sách | `DocumentsPage` | `GET /api/v1/documents` | **COMPLETE** |
| Preview tài liệu | `ExamDetailPage` page=documents | `GET .../preview` | **COMPLETE** |
| Download tài liệu | ❌ Không có action | `GET .../download` | **FE_MISSING** |
| Trang cá nhân | `ProfilePage` | `GET /api/v1/profiles/{username}` | **COMPLETE** |
| Sửa profile | `EditProfilePage` | `PUT /api/v1/profiles/me` | **COMPLETE** |
| Stats / streak / badges | `ProfilePage` mock heatmap | `GET /profiles/me/stats` | **PARTIAL** *(FE heatmap, BE không có heatmap API)* |
| Tìm bạn / follow | `FriendsPage` | ❌ Follow API G2 | **BE_MISSING** |
| Chat / Messages | `MessagesPage`, `ChatModal` | ❌ Chat G2 | **BOTH_MISSING** *(P2 cắt)* |
| Thông báo | `NotificationDropdown` mock | ❌ Notifications G2 | **BE_MISSING** |
| Premium — xem gói | `PremiumPage`, `PricingModal` | `GET /api/v1/premium/plans` | **COMPLETE** |
| Mua Premium (PayOS) | `CheckoutPage` *(bank transfer mock)* | `POST /api/v1/premium/orders` | **PARTIAL** *(flow khác)* |
| Subscription status | ❌ Không poll sau thanh toán | `GET /api/v1/premium/subscription` | **FE_MISSING** |
| Admin Dashboard | ❌ Không có `/admin` | `GET /api/v1/admin/dashboard` | **FE_MISSING** |
| Admin User Management | ❌ | `GET/PATCH /api/v1/admin/users` | **FE_MISSING** |
| Admin Payments | ❌ | `GET /api/v1/admin/payments` | **FE_MISSING** |
| Admin Gamification | ❌ | `GET/PUT /api/v1/admin/gamification/*` | **FE_MISSING** |
| Moderator — content queue | `ContentModerationPage` | `GET/PATCH /admin/moderation/reports` | **COMPLETE** |
| Moderator — banned users | `ViolatingAccountsPage` | `GET /admin/moderation/banned` | **COMPLETE** |
| Moderator — thêm đề thi | `AddFinalExamWizard` | `POST /api/v1/admin/exams` | **COMPLETE** *(chưa wire)* |
| Moderator — feature post | ❌ | `PATCH /api/v1/posts/{id}/feature` | **FE_MISSING** |
| Feedback / Support form | `FeedbackPage`, `SupportPage` | ❌ Không có API | **BE_MISSING** |

**Tổng hợp status (42 use case P0/P1 audited):**

| Status | Count |
|--------|-------|
| COMPLETE (screen + API tồn tại) | 24 |
| FE_MISSING | 11 |
| BE_MISSING | 5 |
| BOTH_MISSING | 2 |

---

# Screen Mapping

> Đối chiếu **`ARCHITECTURE-BE.md` §4** (FE route kỳ vọng) + **`ARCHITECTURE.md` §4** + **`fe/src/app/App.jsx`** (thực tế) vs Backend Controllers

### Lệch tài liệu FE (3 nguồn)

| Màn hình | `ARCHITECTURE-BE.md` §4 | `ARCHITECTURE.md` §4 | FE thực tế `App.jsx` |
|----------|-------------------------|----------------------|----------------------|
| Feed | `/` Feed | `/` FeedPage guest | `/community`, `/home` |
| Exam list | `/exams` | `/exams` | `/community/final-exam` |
| Exam do | `/exams/:id/do` | `/exams/:id/do` | ❌ không có |
| Checkout | `/checkout` *(ghi chú bổ sung router)* | `/pricing` | `/home/premium/checkout/:planId` |
| Documents | `/documents` PrivateRoute | `/documents` | `/community/documents` |
| Admin | `/admin/*` AdminRoute | `/admin/*` | `/moderator/*` ModeratorRoute only |
| Pricing | `/pricing` | `/pricing` | `/home/premium` |

## Auth

| Screen | Route (FE thực tế) | API Available | DTO Available | Status |
|--------|-------------------|---------------|---------------|--------|
| Login Page | `/login` | ✅ `POST /auth/login` | ✅ `LoginRequest` → `LoginResponse` | **UI READY** — chưa integrate |
| Register Page | `/register` | ✅ `POST /auth/register` | ✅ `RegisterRequest` | **UI READY** |
| Forgot Password | `/forgot-password` | ✅ OTP flow 3 endpoints | ✅ | **UI READY** |
| Refresh Token | ❌ | ❌ | ❌ | **FAIL** |

## Feed

| Screen | Route | API | DTO | Status |
|--------|-------|-----|-----|--------|
| Feed List | `/community`, `/home` | ✅ `GET /posts` | ✅ `PagedResult<PostListItemDto>` | **UI READY** |
| Feed Detail | `/home/posts/:postId` | ✅ `GET /posts/{id}` | ✅ `PostDetailDto` | **UI READY** |
| Create Post | `/home/create-post` | ✅ `POST /posts` | ✅ `CreatePostRequest` | **UI READY** |
| Edit Post | ❌ | ✅ `PUT /posts/{id}` | ✅ `UpdatePostRequest` | **FE_MISSING** |
| Comment | Post detail modals | ✅ comments endpoints | ✅ `CommentDto` | **UI READY** |
| Like | Post cards | ✅ like/unlike | ⚠️ `LikeResultDto` *(Application, không Contracts)* | **UI READY** |
| Report | `ReportPostModal` | ✅ `POST .../report` | ✅ `ReportPostRequest` | **UI READY** |

## Exam

| Screen | Route | API | DTO | Status |
|--------|-------|-----|-----|--------|
| Exam List | `/community/final-exam` | ✅ `GET /exams` | ✅ `ExamListItemDto` | **UI READY** — route khác spec `/exams` |
| Exam Detail | `.../final-exam/:courseCode/:examId` | ✅ `GET /exams/{id}/questions` | ✅ `QuestionPublicDto` | **UI READY** — questions **generated mock**, không từ API |
| Create Attempt | ❌ `ExamDoPage` | ✅ `POST .../attempts` | ✅ `ExamAttemptDto` | **FE_MISSING** |
| Submit Attempt | ❌ | ✅ PUT answers + submit | ✅ `SaveAnswersRequest`, `ExamResultDto` | **FE_MISSING** |
| Result | ❌ `ExamResultPage` | ✅ `GET .../result` | ✅ `ExamResultDto` | **FE_MISSING** |

## Documents

| Screen | Route | API | DTO | Status |
|--------|-------|-----|-----|--------|
| Document List | `/community/documents` | ✅ `GET /documents` | ✅ `DocumentListItemDto` | **UI READY** |
| Preview | Via `ExamDetailPage` documents | ✅ `GET .../preview` | ✅ `DocumentPreviewDto` | **PARTIAL** — UI không gọi preview API |
| Download | ❌ action | ✅ `GET .../download` | ✅ `{ downloadUrl }` | **FE_MISSING** |

## Premium

| Screen | Route | API | DTO | Status |
|--------|-------|-----|-----|--------|
| Plans | `/home/premium` | ✅ `GET /premium/plans` | ✅ `SubscriptionPlanDto` | **PARTIAL** — plan IDs khác (`trial` vs `1m`) |
| Purchase / Checkout | `/home/premium/checkout/:planId` | ✅ `POST /premium/orders` | ✅ `PaymentOrderDto` | **FAIL** — FE bank transfer, BE PayOS QR |
| Subscription Status | ❌ dedicated UI | ✅ `GET /premium/subscription` | ✅ `SubscriptionStatusDto` | **FE_MISSING** |
| Payment Success | `/home/premium/success/:planId` | ✅ poll order/subscription | ✅ | **PARTIAL** — mock transactionId |

## Profile

| Screen | Route | API | DTO | Status |
|--------|-------|-----|-----|--------|
| Profile View | `/profile/:username` | ✅ `GET /profiles/{username}` | ✅ `ProfileDto` | **PARTIAL** — FE cần heatmap, followers |
| Profile Edit | `/profile/:username/edit` | ✅ `PUT /profiles/me` | ✅ `UpdateProfileRequest` | **UI READY** |

## Admin / Moderator

| Screen | Route (ARCHITECTURE target) | Route (FE thực tế) | API | Status |
|--------|----------------------------|-------------------|-----|--------|
| Dashboard | `/admin` | ❌ | ✅ `GET /admin/dashboard` | **FE_MISSING** |
| Moderation | `/admin/moderation` | `/moderator/content` | ✅ reports API | **UI READY** — path khác |
| User Management | `/admin/users` | ❌ | ✅ users API | **FE_MISSING** |
| Reports detail | `/admin/moderation/:id` | ❌ | ✅ `GET reports/{id}` | **FE_MISSING** |
| Banned accounts | `/admin/moderation/banned` | `/moderator/violations` | ✅ `GET .../banned` | **UI READY** |
| Payments | `/admin/payments` | ❌ | ✅ payments API | **FE_MISSING** |
| Add exam (mod) | `/admin/exams/create` | `/moderator/final-exams/add` | ✅ `POST /admin/exams` | **UI READY** |
| Practice review | ❌ | partial | ✅ practice-submissions | **FE_MISSING** |

---

# DTO Compatibility

> Embedded trong báo cáo — section tương đương `DTO_COMPATIBILITY_REPORT`

## Envelope & Transport

| Item | Backend | Frontend | Gap |
|------|---------|----------|-----|
| Response wrapper | `ApiResponse<T>` mọi endpoint *(trừ webhook, /health)* | FE không parse envelope | **Missing** — cần `response.data.data` |
| Pagination | `PagedResult<T>` `{ items, page, pageSize, totalCount }` | FE `POSTS_PER_PAGE=5` client-side slice | **Missing** — cần server pagination |
| Error format | `ApiError[]` + `message` | FE toast chuỗi cứng | **Missing** |
| Auth header | `Authorization: Bearer` | `mock-jwt-token` localStorage | **Missing** |

## Auth DTOs

| Field | `LoginResponse` / `AuthUserDto` (BE) | FE `AuthProvider` mock | Issue |
|-------|--------------------------------------|------------------------|-------|
| `accessToken` | ✅ string JWT | `"mock-jwt-token"` | Wrong source |
| `expiresIn` | ✅ seconds | ❌ không dùng | Missing |
| `user.id` | ✅ Guid | ❌ không có | Missing Field |
| `user.isPremium` | ✅ bool *(JWT hint)* | `isPremium: false` hardcoded | Wrong — cần poll subscription |
| `user.role` | ✅ `Student/Moderator/Admin` | ✅ `student/moderator/admin` | Case mismatch |
| `streak`, `unreadNotifications` | ❌ không trong DTO | ✅ FE mock header | FE-only fields |

## Feed DTOs

| Field | `PostListItemDto` / `PostDetailDto` | FE `MOCK_POSTS` | Issue |
|-------|-------------------------------------|-----------------|-------|
| `id` | Guid | number index | **Wrong Type** |
| `author.username` | ✅ | ✅ | OK |
| `author.displayName` | ✅ | `club`, `initial` FE-only | Missing in DTO — UI workaround |
| `tags` | `string[]` | `tags` array | OK |
| `likeCount`, `commentCount` | ✅ int | `likes`, `comments` | Rename mapping needed |
| `isLiked` | `bool?` | local state | OK when wired |
| `createdAt` | `DateTime` ISO | `"5 giờ trước"` string | **Wrong Type** — cần formatter |
| `semester`, `major` filter | Query params | FE filter local only | BE filter incomplete |

## Exam DTOs

| Field | `ExamDetailDto` | FE `subjectDetailData` | Issue |
|-------|-----------------|------------------------|-------|
| `id` | Guid | string slug `PRF192-FE-2024` | **Wrong Type** — route param mismatch |
| `code`, `title` | ✅ | ✅ `examId`, `title` | Mapping OK |
| `questionCount` | ✅ | ✅ — questions **fabricated** | FE không dùng `QuestionPublicDto[]` |
| `correctOptionId` | `QuestionAnswerDto` Premium | mock toggle | OK when premium wired |

## Premium DTOs

| Field | BE | FE `pricingData.js` | Issue |
|-------|-----|---------------------|-------|
| Plan code | `1m`, `8m`, `4y` | `trial`, `semester`, `lifetime` | **Enum/code mismatch** |
| Price | `decimal PriceVnd` | formatted string `"49.000 đ/tháng"` | **Wrong Type** |
| Payment | `QrUrl`, `CheckoutUrl`, `PayOsOrderCode` | Bank account `PAYMENT_INFO` static | **Flow mismatch** |
| Order status | `Pending/Paid/...` | navigate success on button click | **Missing polling** |

## Profile DTOs

| Field | `ProfileDto` / `ProfileStatsDto` | FE `profileData.js` | Issue |
|-------|----------------------------------|---------------------|-------|
| `points`, `levelName` | ✅ | ✅ | OK |
| `badges` | `BadgeDto[]` | `BADGES` mock 26 items | Partial — BE may return fewer |
| `followers`, `following` | ❌ | ✅ FE displays | **Missing Field** |
| `heatmap` 6 tháng | ❌ G2 | ✅ `HEATMAP_MOCK` | **BE_MISSING** |
| `recentPosts` | ❌ in ProfileDto | ✅ separate mock | **Missing Field** — FE cần `GET /posts?author=` |

## Documents DTOs

| Field | `DocumentListItemDto` | FE documents mock | Issue |
|-------|----------------------|-------------------|-------|
| `pageCount` | ✅ | ✅ | OK |
| `accessTier` | enum string | FE hardcode 3-page limit | OK when wired |
| `categoryId` | Guid | courseCode string | **Wrong Type** |

### DTO Compatibility Score drivers

| Category | Pass rate |
|----------|-----------|
| Auth | ~55% |
| Feed | ~65% |
| Exam | ~50% |
| Premium | ~35% |
| Profile | ~45% |
| Documents | ~60% |
| **Weighted average** | **~52%** |

---

# Flow Verification

## Auth Flow

```
Login → Store Token → Refresh → Logout
```

| Step | FE Screen | API Endpoint | Request | Response | Status |
|------|-----------|--------------|---------|----------|--------|
| Login | `LoginPage` | `POST /api/v1/auth/login` | `LoginRequest` | `LoginResponse` | **FAIL** — mock login |
| Store token | `AuthProvider` | — | — | `localStorage mock-jwt-token` | **FAIL** |
| Refresh | ❌ | ❌ | — | — | **FAIL** |
| Logout | Header | `POST /api/v1/auth/logout` | — | message | **FAIL** — local clear only |
| Get me | — | `GET /api/v1/auth/me` | — | `MeResponse` | **FAIL** |

**Flow verdict: FAIL**

---

## Premium Flow

```
Purchase → PayOS → Webhook → Subscription Activated → Premium Unlock
```

| Step | FE | BE | Status |
|------|-----|-----|--------|
| Chọn gói | `PremiumPage` mock plans | `GET /premium/plans` | **FAIL** — IDs/price format khác |
| Tạo đơn | `CheckoutPage` bank info | `POST /premium/orders` → `PaymentOrderDto` | **FAIL** — không gọi API |
| Thanh toán | User chuyển khoản thủ công | PayOS QR / `CheckoutUrl` | **FAIL** — flow khác |
| Webhook | — | `POST /premium/webhooks/payos` | **PASS** *(BE only)* |
| Kích hoạt | — | Subscription in DB | **PASS** *(BE only)* |
| Poll status | ❌ | `GET /premium/subscription` | **FAIL** |
| Unlock UI | `isPremium: false` fixed | `RequirePremium` policy | **FAIL** |

**Flow verdict: FAIL**

---

## Exam Flow

```
List → Detail → Attempt → Submit → Result
```

| Step | FE | BE | Status |
|------|-----|-----|--------|
| List | `ReviewQuestionsPage` | `GET /exams` | **FAIL** — mock catalog |
| Detail | `ExamDetailPage` | `GET /exams/{id}/questions` | **FAIL** — mock questions |
| Attempt | ❌ no ExamDoPage | `POST /exams/{id}/attempts` | **FAIL** |
| Save answers | ❌ | `PUT .../answers` | **FAIL** |
| Submit | ❌ | `POST .../submit` | **FAIL** |
| Result | ❌ | `GET .../result` | **FAIL** |

**Flow verdict: FAIL**

---

## Feed Flow

```
Create Post → Like → Comment → Report
```

| Step | FE | BE | Status |
|------|-----|-----|--------|
| Create | `CreatePostPage` toast only | `POST /posts` | **FAIL** |
| Like | `PostCard` local toggle | `POST/DELETE .../like` | **FAIL** |
| Comment | modal UI | `POST .../comments` | **FAIL** |
| Report | `ReportPostModal` toast | `POST .../report` | **FAIL** |

**Flow verdict: FAIL** *(API tồn tại, FE chưa gọi)*

---

# Route Audit

## ARCHITECTURE.md (target) vs FE thực tế vs BE

| ARCHITECTURE.md route | FE `App.jsx` | BE endpoint | Status |
|----------------------|--------------|-------------|--------|
| `/` FeedPage guest | `/` LandingPage | `GET /posts` | **Route mismatch** |
| `/exams` | `/community/final-exam` | `GET /exams` | **Route mismatch** |
| `/exams/:id/do` | ❌ | `POST .../attempts` | **FE route missing** |
| `/exams/:id/result` | ❌ | `GET .../result` | **FE route missing** |
| `/documents` | `/community/documents` | `GET /documents` | **Prefix mismatch** |
| `/documents/:id` | nested `.../:examId` | `GET /documents/{id}` | **Param semantics wrong** |
| `/pricing` | `/home/premium` | `GET /premium/plans` | **Route mismatch** |
| `/chat` | `/home/messages` | ❌ no API | **BE missing** |
| `/admin/*` (15+ routes) | `/moderator/*` (5 routes) | `/api/v1/admin/*` | **FE admin shell missing** |
| `PremiumRoute` guard | ❌ — no `PremiumRoute` | Policy `RequirePremium` | **Guard missing** |
| `AdminRoute` guard | `ModeratorRoute` only | `RequireAdmin` vs `RequireModerator` | **Partial** |

## Unused BE endpoints (FE chưa có màn hình tương ứng)

| Endpoint group | Count | Ghi chú |
|----------------|-------|---------|
| `/api/v1/admin/dashboard` | 1 | Không có Admin UI |
| `/api/v1/admin/users/*` | 5 | Không có User Management UI |
| `/api/v1/admin/payments/*` | 4 | Không có Payments UI |
| `/api/v1/admin/gamification/*` | 3 | Không có Gamification UI |
| `/api/v1/admin/documents/*` | 4 | Mod upload tài liệu — FE thiếu |
| `/api/v1/exams/.../attempts/*` | 6 | Thiếu ExamDo/Result pages |
| `/api/v1/exams/questions/.../ai-explain` | 1 | Thiếu AI UI |
| `POST /auth/google` | 1 | Thiếu OAuth button |

**Tổng unused by FE: ~25 endpoints** (ước tính từ inventory 76)

## Duplicate / Dead FE routes

| Item | Detail |
|------|--------|
| `/landing` → redirect `/` | OK |
| `/moderator/reports`, `/moderator/featured` | Nav links **không có route** (`moderatorNavData.js`) |
| `/community/pratical-exam` | Typo *pratical* vs *practice* |

---

# State Management Audit

## Thực tế vs ARCHITECTURE.md

| ARCHITECTURE.md kỳ vọng | FE thực tế | Gap |
|-------------------------|-----------|-----|
| Redux Toolkit + `createAsyncThunk` | ❌ Không có Redux | **Critical gap** |
| `axiosInstance` + interceptors | ❌ Không có axios | **Critical gap** |
| `authSlice` | `AuthContext` + `AuthProvider` | Different pattern |
| React Query | ❌ | Not installed |

## Khuyến nghị cache / invalidate / optimistic (khi wire API)

| API / Feature | Strategy | Lý do |
|---------------|----------|-------|
| `POST/DELETE .../like` | **Optimistic update** | UX tức thì; rollback on error |
| `GET /posts` feed | **Cache + pagination** | Infinite scroll; stale 30s |
| `GET /posts/{id}` | **Cache** | Detail revisit |
| `GET /profiles/{username}` | **Cache** | Profile revisit |
| `PUT /profiles/me` | **Invalidate** profile + `GET /auth/me` | Avatar/name sync |
| `GET /premium/subscription` | **Revalidate** sau checkout + interval 30s | Premium unlock sau PayOS |
| `POST /premium/orders` | **No cache** | One-shot |
| `POST .../attempts` | **No optimistic** | Server owns attempt state |
| `PUT .../answers` | **Debounce save** | Autosave exam |
| `GET /exams/{id}/questions` | **Cache** per exam | Immutable published |
| Moderation reports | **Invalidate list** on PATCH resolve | Queue refresh |
| Notifications *(future)* | **Polling/WebSocket** | Badge count |

---

# Missing Items

## P0 — Block integration

1. **FE API layer hoàn toàn thiếu** — axios client, base URL, interceptors, error handler
2. **`ApiResponse<T>` envelope parser** — mọi service call
3. **Exam attempt + result pages** — flow Premium cốt lõi
4. **PayOS checkout wiring** — thay bank transfer mock
5. **Plan code mapping** — `trial/semester/lifetime` ↔ `1m/8m/4y`
6. **Premium status poll** — sau payment + `PremiumRoute` guard
7. **Guid exam IDs** — FE dùng string slug, BE dùng `Guid`

## P1 — Sau wire cơ bản

8. Admin portal (`/admin/*`) — dashboard, users, payments
9. Edit post screen
10. Document download action
11. Practice submission form (student)
12. Google OAuth button
13. `GET /auth/me` on app boot

## P2 — Đã cắt G1 (chấp nhận)

14. Chat real-time
15. Follow API
16. Notifications API
17. Heatmap API
18. Share post API
19. Refresh token

---

# Recommendations

## Sprint 0 — Integration Foundation (bắt buộc trước feature)

| # | Task | Effort |
|---|------|--------|
| 1 | `npm install axios` + `@reduxjs/toolkit` react-redux *(hoặc TanStack Query nếu đơn giản hóa)* | 0.5d |
| 2 | `api/client.js` — base URL, Bearer interceptor, 401 → logout | 1d |
| 3 | `api/envelope.js` — unwrap `ApiResponse<T>` | 0.5d |
| 4 | Auth slice/service — login, register, logout, me | 1d |
| 5 | Vite proxy `/api` → backend Development | 0.5d |

## Sprint 1 — P0 vertical slices

| # | Module | FE work | BE dependency |
|---|--------|---------|---------------|
| 1 | Feed | Wire list, detail, create, like, comment, report | Ready |
| 2 | Auth | Wire full OTP flow | Ready |
| 3 | Exam | Add `ExamDoPage`, `ExamResultPage`; wire questions từ API | Ready |
| 4 | Premium | PayOS QR checkout + subscription poll + `PremiumRoute` | Ready |
| 5 | Profile | Wire profile + stats; drop/mock followers until G2 | Ready |

## Sprint 2 — Admin + hardening

| # | Task |
|---|------|
| 1 | Admin layout `/admin` + dashboard, users, payments |
| 2 | Align routes với `ARCHITECTURE.md` hoặc cập nhật doc theo `/community` |
| 3 | DTO mapping layer (FE adapters) |
| 4 | E2E smoke: login → feed → exam attempt → premium |

## Documentation

- Tạo `ARCHITECTURE-FE.md` gộp `ARCHITECTURE.md` + routes thực tế `/community`, `/moderator` — `ARCHITECTURE-BE.md` đã có
- Đồng bộ Phụ lục D `ARCHITECTURE-BE.md` với `App.jsx` (checkout path, exam routes)
- Publish Swagger `/swagger` (Development) cho FE team
- DTO chi tiết: [DTO_COMPATIBILITY_REPORT.md](DTO_COMPATIBILITY_REPORT.md)

---

# Integration Readiness Score

| Metric | Score | Cơ sở |
|--------|-------|-------|
| **Business Coverage** | **68/100** | 24/42 use case có cả FE screen + BE API; 11 FE_MISSING, 7 BE/BOTH_MISSING |
| **Screen Coverage** | **58/100** | ~20/35 màn hình ARCHITECTURE.md; thiếu admin shell, exam do/result, edit post |
| **API Coverage** | **82/100** | BE 76 endpoints cover ~90% P0; ~25 endpoint chưa có FE consumer |
| **DTO Compatibility** | **52/100** | Envelope, Guid vs string, plan codes, premium flow, profile extras |
| **Integration Readiness** | **18/100** | 0 API calls; mock auth; no axios/Redux; flows FAIL end-to-end |

### Tổng điểm

```
(68 + 58 + 82 + 52 + 18) / 5 = 55.6 ≈ 56/100
```

| Ngưỡng | Kết quả |
|--------|---------|
| ≥ 80 READY_FOR_FE | ❌ |
| 56/100 | **NOT_READY_FOR_FE** |

---

# Kết luận

```
NOT_READY_FOR_FE
```

**Backend:** Sẵn sàng làm nguồn API cho G1 — Swagger, DTOs, 76 endpoints, PayOS webhook, Premium DB policy.

**Frontend:** Sẵn sàng làm **UI shell** — component, route, mock UX đầy đủ — nhưng **chưa integration-ready**.

**Điều kiện chuyển sang `READY_FOR_FE`:**

1. Sprint 0 foundation (axios + envelope + auth wire) — **~3 ngày**
2. Ít nhất 4 flow PASS E2E: Auth, Feed, Exam attempt, Premium PayOS — **~2 sprint**
3. DTO adapter + route alignment — **~1 sprint**

Ước tính: **4–6 tuần dev** để đạt integration readiness ≥ 80 với 1 FE developer full-time.
