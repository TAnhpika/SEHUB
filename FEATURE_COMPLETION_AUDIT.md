# Báo cáo mức độ hoàn thiện tính năng SEHUB

> **Nguồn:** CodeGraph audit · nhánh `Hau_Profile` · đối chiếu tài liệu tính năng hệ thống (11 mục)  
> **Ngày audit:** 2026-06-13  
> **CodeGraph:** 865 file · 9.646 node · **121 route** · index up-to-date  
> **Tests:** 126/126 pass (61 unit + 65 integration)

---

## Thang đánh giá

| Mức | Ý nghĩa |
|-----|---------|
| **✅ ~85–100%** | BE + FE wired, luồng chính chạy được |
| **🟡 ~50–84%** | Có API nhưng thiếu phần phụ, hoặc FE/BE lệch nhau |
| **🟠 ~25–49%** | Chủ yếu UI/mock/localStorage |
| **🔴 ~0–24%** | Chưa có hoặc chỉ placeholder |

---

## Tổng quan

Nhánh `Hau_Profile` tích hợp social, chat SignalR, premium PayOS, profile activity heatmap, moderator content/reports API. Core student flows đã wire; một số sidebar/search/featured và exam comments vẫn mock.

**Friends (kết bạn):** đã **gỡ hoàn toàn**. UI **「Tìm kiếm bạn bè」** = tìm user + Follow/Message (khớp spec mục 3).

**Cập nhật gần đây (2026-06-13):**
- Heatmap 6 tháng → `GET /profiles/{username}/activity` + `loadProfileActivity`
- Streak milestone +20 điểm / 7 ngày → `UserActivityService`
- Moderator duyệt bài → `contentModerationService` wire API
- Moderator báo cáo → `reportsData` wire API; fix tab **Đã xử lý** (BE bỏ `Include(Post)` filter soft-delete)

**Ước lượng tổng thể so với tài liệu 11 mục: ~74% hoàn thiện** (tăng từ ~68%).

---

## 1. Cộng đồng & bài viết — 🟡 ~72%

| Tính năng | BE | FE | Ghi chú |
|-----------|----|----|---------|
| Feed danh sách | ✅ `GET /posts` | ✅ `feedData` → `postsApi` | Mock khi `VITE_USE_MOCK=true` |
| Lọc học kỳ / ngành | ✅ query params | 🟡 | FE lọc **client-side** sau tải 100 bài, chưa gửi filter lên API |
| Tạo bài viết | ✅ | ✅ | Bài mới → `PostStatus.Pending` (pre-moderation) |
| Like / bình luận | ✅ | ✅ | CRUD comment qua API |
| Trả lời bình luận | ✅ `ParentCommentId` | 🔴 | Nút **「Trả lời」** chỉ UI, **không gọi API** |
| Lượt xem | ✅ | ✅ | `ViewCount` từ API |
| Chia sẻ | — | 🟡 | Copy link / Web Share API, không metric share |
| Tìm kiếm bài viết | 🟡 `search` param | 🟠 | Tab Blogs `SearchAllPage` dùng **`MOCK_POSTS`**, chưa search API |
| Báo cáo bài viết | ✅ | ✅ | `ReportPostModal` → API |
| Bài nổi bật sidebar | ✅ `GET /posts/featured` | 🟠 | `HomeSidebar` / `CommunitySidebar` vẫn **`FEATURED_POSTS` mock** |
| Streak & thống kê | ✅ streak DB + +20/7 ngày | 🟡 | `UserActivityService`; sidebar streak từ profile stats |

**CodeGraph:** `PostsController` 10+ routes · `feedData.js` → `FeedPage`, `PostDetailPage`, `searchAllData` (mock import)

---

## 2. Hồ sơ người dùng — ✅ ~80%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Trang cá nhân (avatar, level, điểm) | ✅ ~90% | `profilesApi` + `profileData` |
| 26 danh hiệu | 🟡 ~60% | Catalog FE 26 badge; BE `BadgeCheckService` auto-unlock theo trigger (post, practice, …) — chưa cover hết 26 điều kiện FE |
| Heatmap 6 tháng | ✅ ~85% | `loadProfileActivity` → `GET /profiles/{username}/activity` · `ActivityHeatmap` |
| Bài viết gần đây | ✅ ~85% | `GET /profiles/{username}/posts` |
| Thanh tiến độ lên cấp | 🟡 ~70% | Stats API + admin level config |

**CodeGraph:** `ProfilesController` 7 routes · `ActivityHeatmap.jsx` nhận `heatmapData` từ API

---

## 3. Tìm kiếm & kết nối — ✅ ~85%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Tìm user | ✅ | `GET /users/search` |
| Follow | ✅ | `UsersController` + `FollowButton` |
| Message | ✅ | `ConversationsController` + SignalR `ChatHub` |
| Lịch sử / đã đọc | ✅ | unread count, mark read, attachments |
| Followers / following | ✅ | API + profile |
| Friends (kết bạn) | 🔴 **Đã gỡ** | Không còn friend request |

**CodeGraph:** `ConversationsController` 8 routes · `ChatHub.cs` · `UsersController` follow/search

---

## 4. Đề thi cuối kỳ — 🟡 ~75%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Danh sách / lọc kỳ & ngành | ✅ | `examsApi` |
| Chi tiết mã đề, số câu | ✅ | |
| Xem câu hỏi & đáp án | ✅ | `GET .../questions` |
| Làm bài online 50 câu | ✅ | attempts: save, submit, result |
| Bình luận câu hỏi | 🟠 ~25% | **`examCommentsStore.js`** — localStorage mock, **không có BE** |

**CodeGraph:** `ExamsController` + attempts routes · `examCommentsStore.js` isolated

---

## 5. Đề thi thực hành — 🟡 ~70%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Danh sách đề TH | ✅ | exams API |
| Xem nội dung đề | 🟡 | Tùy metadata/file |
| Nộp GitHub URL | ✅ | `POST .../practice-submissions` |
| Chấm / feedback | ✅ | moderator/admin patch submission |
| Đề liên quan | 🟡 | FE gợi ý theo môn, không API riêng |

**CodeGraph:** `PracticeSubmissionsController` · `practiceExamSubmissions.js`

---

## 6. Tài liệu học tập — 🟡 ~65%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Thư viện theo môn/kỳ/ngành | ✅ | `documentsApi` |
| Free 3 trang / Premium full | ✅ | `documentAccessPolicy.js` + BE preview |
| Câu hỏi ôn tập | 🟠 | **`reviewData` mock** |
| TH gắn tài liệu | 🟠 | Navigation FE, chưa module BE riêng |

**CodeGraph:** `DocumentsController` + admin documents routes

---

## 7. Hệ thống & tiện ích — 🟡 ~62%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Thông báo (chuông + badge) | ✅ ~85% | REST + SignalR |
| Discord | 🟠 ~20% | Link sidebar, không OAuth |
| Gửi phản hồi | 🟠 ~30% | `FeedbackPage` UI only — **không API submit** |
| Tích điểm (+10 post, +2 like) | ✅ BE | `GamificationService` |
| Streak +20 / 7 ngày | ✅ BE | `UserActivityService.StreakMilestonePoints` |
| Rank Bronze→Platinum | 🟡 | Level config admin API |
| Badge auto-unlock | 🟡 ~55% | `BadgeCheckService` một phần trigger |

**CodeGraph:** `NotificationsController` 4 routes · `GamificationService.cs`

---

## 8. Xác thực — ✅ ~90%

| Tính năng | Mức |
|-----------|-----|
| Login email/username + password | ✅ |
| Google OAuth | ✅ |
| Toggle mật khẩu | ✅ |
| Register + validation | ✅ |
| Quên mật khẩu (email/SMS) | ✅ BE endpoints |
| OTP verify + reset | ✅ |
| Logout / refresh token | ✅ |

**Lưu ý:** SMS OTP dùng `MockSmsService` — production cần provider thật.

**CodeGraph:** `AuthController` 10 routes · `AuthProvider.jsx`

---

## 9. Gói Premium — 🟡 ~75%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Mua gói 1/8 tháng / 4 năm | ✅ | PayOS checkout |
| Kích hoạt sau thanh toán | ✅ | webhook + subscription |
| Voucher theo rank/badge | 🟠 | Admin voucher mock/local |
| Free 3 trang / Premium full docs | ✅ | |
| AI giải đáp + token/ngày | 🟡 | BE `ai-explain`; FE **`aiTokens.js` localStorage** — spec 1 vs 100 lượt chưa align server |
| Reset token 00:00 | 🟡 | FE local date; chưa sync server |

**CodeGraph:** `PremiumController` 8 routes · `CheckoutPage.jsx`

---

## 10. Quản lý & kiểm duyệt (Moderator) — 🟡 ~75%

| Nhóm | Mức | Ghi chú |
|------|-----|---------|
| Xóa nội dung vi phạm | ✅ ~80% | Resolve report + `delete_post` → soft delete post |
| Xử lý báo cáo | ✅ ~85% | Community reports wire API; tab **Đã xử lý** fixed; exam-question reports vẫn localStorage |
| Ghim bài nổi bật | 🟠 ~40% | BE `PATCH .../feature`; mod **`featuredPostsData` mock** |
| Duyệt nội dung (pre-mod) | ✅ ~80% | `contentModerationService` wire queue/history/stats API |
| Cảnh báo / khóa tài khoản | ✅ ~80% | `violationsData` → `adminApi` warn/ban/unban |
| Thêm đề cuối kỳ (mod) | 🟡 ~65% | Wizard + `moderatorExamService` |
| Thêm đề TH + xem submission | 🟡 ~70% | contribution store → API |
| Pre-mod theo chuyên mục (toggle) | 🔴 | Spec có; **chưa implement** |

**CodeGraph:** `ModerationController` 10+ routes · `contentModerationStore.js` · `reportsData.js`

---

## 11. Quản trị toàn nền tảng (Admin) — 🟡 ~65%

| Nhóm | Mức | Ghi chú |
|------|-----|---------|
| CRUD đề + OCR + chống trùng SHA-256 | ✅ ~85% | `OcrExamService`, `ContentHash` |
| Duyệt đề mod pending | ✅ | approve endpoint |
| Quản lý tài liệu | 🟡 ~70% | upload/list/delete API |
| Quản lý user / reset pwd / grant tokens | ✅ ~80% | |
| Phân quyền Moderator | 🟡 ~60% | patch role |
| Gamification config | 🟡 ~65% | levels/badges API |
| Dashboard thống kê | 🟡 ~55% | `dashboardApi` + mock fallback |
| Báo cáo kiểm duyệt (stats) | 🟡 ~50% | Có moderation stats; chưa dashboard riêng đầy đủ |
| Export CSV/Excel | 🔴 | Không có |
| Backup/restore | 🔴 | Không có |
| Chatbot admin | 🔴 | **P2 — không có UI/BE** |
| PayOS confirm / audit trail | ✅ ~80% | payments API + audit log |
| Hard delete dữ liệu | 🟠 | Soft delete posts/exams |

**CodeGraph:** `AdminExamsController`, `AdminPaymentsController`, `DashboardController`

---

## CodeGraph — wiring tóm tắt

```
121 routes BE  ↔  ~28 API modules FE
  auth, posts, profiles, exams, messages, notifications, follow,
  premium, admin/*, documents, users, block, gamification, …

Đã wire API (không mock khi VITE_USE_MOCK=false):
  feedData (posts), profileData + activity heatmap, contentModerationService,
  reportsData (community), violationsData, adminReportData, practiceSubmissions,
  studentDocumentsData, dashboardApi, adminUserStore, …

Mock / fallback còn lại:
  FEATURED_POSTS (HomeSidebar, CommunitySidebar)
  MOCK_POSTS (searchAllData blogs tab)
  featuredPostsData (moderator ghim)
  examCommentsStore, examQuestionReportStore (localStorage)
  reviewData (guest), FeedbackPage (no submit API)
  aiTokens.js (localStorage)
  USE_MOCK fallback layers (nhiều admin/moderator modules)

Đã gỡ:
  FriendsController, FriendService, friendsApi, bảng FriendRequests
```

### Lệnh CodeGraph tham khảo

```bash
codegraph sync
codegraph status
codegraph query "PostsController" --kind route
codegraph query "ModerationController" --kind route
codegraph query "ProfilesController" --kind route
codegraph impact "feedData.js"
codegraph query "contentModerationStore"
```

---

## Phân loại theo mức sẵn sàng

### Sẵn sàng demo / production (core)

- Auth (login, register, OAuth, OTP reset)
- Follow / Message / Chat (SignalR, attachments)
- Feed cơ bản (list, create, like, comment, report)
- Profile (xem/sửa, heatmap 6 tháng, followers, recent posts)
- Pre-moderation queue (mod approve/reject posts)
- Community reports (mod dismiss/delete)
- Exams làm bài (attempt, submit, result)
- Practice submit GitHub
- Documents preview (Free 3 trang / Premium full)
- Premium checkout PayOS
- Admin exam OCR + duplicate hash
- Violating accounts warn/ban (mod)

### Cần hoàn thiện trước go-live (P0/P1)

| # | Gap | Effort |
|---|-----|--------|
| 1 | Reply comment (FE wire `ParentCommentId`) | Nhỏ |
| 2 | Featured sidebar → `GET /posts/featured` | Nhỏ |
| 3 | Search bài viết → posts API thay `MOCK_POSTS` | Nhỏ |
| 4 | Filter feed gửi semester/major lên API | Nhỏ |
| 5 | Exam question comments → BE + FE | Trung bình |
| 6 | Exam-question reports mod → BE (hiện localStorage) | Trung bình |
| 7 | Badge auto-unlock đủ 26 điều kiện FE catalog | Trung bình |
| 8 | AI token sync server (align 1 vs 100 lượt/ngày) | Trung bình |
| 9 | Feedback form → API | Nhỏ |
| 10 | Voucher tự động theo rank (không chỉ admin mock) | Trung bình |
| 11 | Moderator featured ghim → `PATCH /posts/{id}/feature` | Nhỏ |
| 12 | Pre-moderation toggle theo chuyên mục | Trung bình |

### Phase 2 / backlog (P2)

- Chatbot admin + knowledge base
- Export CSV/Excel dashboard
- Backup/restore
- Discord tích hợp sâu
- SMS provider production
- Hard delete + export toàn platform

---

## Deploy checklist

```bash
cd be/src/SEHub.Infrastructure
dotnet ef database update --startup-project ../SEHub.API/SEHub.API.csproj

cd be && dotnet test
cd fe && npm run build
```

**Cấu hình production:** PayOS keys, SMTP secrets, `Frontend.BaseUrl`, upload paths.

---

## Tài liệu liên quan

- `SEHUB_PhanTichNghiepVu.md`
- `fe/docs/FE_API_WIRE_PROMPT.md`
- `be/docs/FE_API_QUICKSTART.md`
