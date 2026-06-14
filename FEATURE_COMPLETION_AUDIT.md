# Báo cáo mức độ hoàn thiện tính năng SEHUB

> **Nguồn:** CodeGraph audit · nhánh `Hau_Authen_BE` · đối chiếu tài liệu tính năng hệ thống  
> **Ngày audit:** 2026-06-12  
> **CodeGraph:** 837 file · 9.230 node · **124 route** · index up-to-date  
> **Tests:** 106/106 pass (41 unit + 65 integration)

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

Nhánh `Hau_Authen_BE` là bản tích hợp lớn: social Phase 2–3, chat SignalR, premium PayOS, moderator/admin exam. Nhiều module student đã wire API; admin/moderator và một số tiện ích cộng đồng vẫn còn mock hoặc UI-only.

**Friends (kết bạn):** đã **gỡ hoàn toàn** (API + bảng `FriendRequests`). UI **「Tìm kiếm bạn bè」** giữ nguyên — thực chất là **tìm user + Follow/Message**, khớp spec mục 3 (không còn friend request).

**Git vs `main`:** nhánh ahead 264 commits, behind 0 — fast-forward merge được.

**Ước lượng tổng thể so với tài liệu 11 mục: ~68% hoàn thiện.**

---

## 1. Cộng đồng & bài viết — 🟡 ~70%

| Tính năng | BE | FE | Ghi chú |
|-----------|----|----|---------|
| Feed danh sách | ✅ `GET /posts` | ✅ `feedData` → `postsApi` | Wire API (mock khi `VITE_USE_MOCK=true`) |
| Lọc học kỳ / ngành | ✅ query params | 🟡 | FE lọc **client-side** sau khi tải 100 bài, chưa gửi filter lên API |
| Tạo bài viết | ✅ | ✅ | Bài mới → `PostStatus.Pending` (chờ duyệt) |
| Like / bình luận | ✅ | ✅ | CRUD comment qua API |
| Trả lời bình luận | ✅ `ParentCommentId` | 🔴 | Nút **「Trả lời」** chỉ UI, **không gọi API** |
| Lượt xem | ✅ tăng khi xem chi tiết | ✅ | Hiển thị `ViewCount` từ API |
| Chia sẻ | — | 🟡 | Copy link / Web Share API, không metric share |
| Tìm kiếm bài viết | 🟡 `search` param | 🟠 | Tab Blogs trong `SearchAllPage` dùng **`MOCK_POSTS`**, chưa search API |
| Báo cáo bài viết | ✅ | ✅ | `ReportPostModal` → API |
| Bài nổi bật sidebar | ✅ `GET /posts/featured` | 🟠 | `HomeSidebar` / `CommunitySidebar` vẫn dùng **`FEATURED_POSTS` mock** |
| Streak & thống kê sidebar | ✅ streak trong DB | 🟡 | Điểm/cấp từ `AuthProvider` + profile stats; **+20 điểm streak 7 ngày** chưa thấy logic BE award |

**File tham chiếu:** `fe/src/features/feed/feedData.js`, `PostsController.cs`, `HomeSidebar.jsx`, `PostDetailPage.jsx`

---

## 2. Hồ sơ người dùng — 🟡 ~65%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Trang cá nhân (avatar, level, điểm) | ✅ ~85% | `profilesApi` + `profileData` |
| 26 danh hiệu | 🟡 ~55% | Catalog **26 badge FE** (`BADGE_CATALOG`); BE trả `ProfileDto.Badges` nhưng **chưa thấy auto-unlock** theo hành vi |
| Heatmap 6 tháng | 🟠 ~30% | `ActivityHeatmap` dùng **`HEATMAP_DATA` mock**; placeholder “bản cập nhật sau” |
| Bài viết gần đây | ✅ ~80% | Lọc từ `loadPosts` theo username |
| Thanh tiến độ lên cấp | 🟡 ~60% | Hiển thị từ stats; level config admin có API |

**File tham chiếu:** `fe/src/features/profile/profileData.js`, `ActivityHeatmap.jsx`, `ProfileService.cs`

---

## 3. Tìm kiếm & kết nối — ✅ ~85%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Tìm user | ✅ | `GET /users/search` → `FriendsPage` / `friendsData` |
| Follow | ✅ | `UsersController` + `FollowButton` |
| Message | ✅ | `ConversationsController` + SignalR `ChatHub` |
| Lịch sử / đã đọc | ✅ | unread count, mark read, attachments (emoji, ảnh, file) |
| Followers / following | ✅ | API + hiển thị profile |
| Friends (kết bạn) | 🔴 **Đã gỡ** | `FriendsController`, `friendsApi`, bảng `FriendRequests` đã xóa; UI tìm kiếm **không đổi** |

**File tham chiếu:** `fe/src/features/home/friendsData.js`, `ConversationsController.cs`, `useChatHub.js`

---

## 4. Đề thi cuối kỳ — 🟡 ~75%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Danh sách / lọc kỳ & ngành | ✅ | `examsApi` + subject pages |
| Chi tiết mã đề, số câu | ✅ | |
| Xem câu hỏi & đáp án | ✅ | `GET .../questions` |
| Làm bài online 50 câu | ✅ | attempts API: save answers, submit, result |
| Bình luận câu hỏi | 🟠 ~25% | **`examCommentsStore.js`** — localStorage + mock, **không có BE** |

**File tham chiếu:** `fe/src/features/exams/examDetailData.js`, `ExamsController.cs`, `examCommentsStore.js`

---

## 5. Đề thi thực hành — 🟡 ~70%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Danh sách đề TH | ✅ | exams API |
| Xem nội dung đề | 🟡 | Tùy đề có file/metadata |
| Nộp GitHub URL | ✅ | `POST .../practice-submissions` |
| Chấm / feedback | ✅ | moderator/admin patch submission |
| Đề liên quan | 🟡 | FE gợi ý theo môn (subject data), không API riêng |

**File tham chiếu:** `PracticeSubmissionsController.cs`, `practiceExamSubmissions.js`

---

## 6. Tài liệu học tập — 🟡 ~65%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Thư viện theo môn/kỳ/ngành | ✅ | `documentsApi` + `studentDocumentsData` |
| Free 3 trang / Premium full | ✅ | `documentAccessPolicy.js` + BE preview |
| Câu hỏi ôn tập | 🟠 | **`reviewData` mock** — guest catalog |
| TH gắn tài liệu | 🟠 | Chủ yếu navigation FE, chưa module BE riêng |

**File tham chiếu:** `fe/src/features/documents/documentAccessPolicy.js`, `DocumentsController.cs`

---

## 7. Hệ thống & tiện ích — 🟡 ~55%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Thông báo (chuông + badge) | ✅ ~80% | REST + SignalR; types: follow, message, like, … |
| Discord | 🟠 ~20% | Link/footer UI, không tích hợp OAuth |
| Gửi phản hồi | 🟠 ~30% | `FeedbackPage` có UI; **không thấy API gửi feedback** |
| Tích điểm (+10 post, +2 like) | ✅ BE | `GamificationService`; streak +20 / badge auto: **chưa đủ** |
| Rank Bronze→Platinum | 🟡 | Level config admin API; voucher rank: xem mục 9 |

**File tham chiếu:** `NotificationDropdown.jsx`, `GamificationService.cs`, `FeedbackPage.jsx`

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

**File tham chiếu:** `AuthController.cs`, `AuthProvider.jsx`

---

## 9. Gói Premium — 🟡 ~75%

| Tính năng | Mức | Ghi chú |
|-----------|-----|---------|
| Mua gói 1/8 tháng / 4 năm | ✅ | PayOS checkout, QR, return page |
| Kích hoạt sau thanh toán | ✅ | webhook + subscription service |
| Voucher theo rank/badge | 🟠 | Admin voucher page **mock/local**; rank config có field voucher trong gamification admin |
| Free 3 trang / Premium full docs | ✅ | |
| AI giải đáp + token/ngày | 🟡 | BE `ai-explain`; FE **`aiTokens.js` localStorage** (Free 10, Premium 1000) — spec nói 1 vs 100 lượt, cần align |
| Reset token 00:00 | 🟡 | FE theo ngày local; chưa rõ sync server |

**File tham chiếu:** `CheckoutPage.jsx`, `PremiumController.cs`, `fe/src/utils/aiTokens.js`

---

## 10. Moderator — 🟡 ~60%

| Nhóm | Mức | Ghi chú |
|------|-----|---------|
| Xóa nội dung vi phạm | 🟡 | Admin moderation API có; mod UI mix mock/API |
| Xử lý báo cáo | 🟡 ~65% | `adminReportData` wire API; mod `reportsData` một phần |
| Ghim bài nổi bật | 🟠 ~40% | BE `PATCH .../feature`; mod **`featuredPostsData` mock** |
| Duyệt nội dung (pre-mod) | 🟡 ~55% | BE pending posts + moderation API; mod queue **mock + API lẫn** |
| Cảnh báo / khóa tài khoản | 🟡 ~70% | `ViolatingAccountsPage` wire **`adminApi.listViolatingUsers`** khi không mock |
| Thêm đề cuối kỳ (mod) | 🟡 ~65% | Wizard + `moderatorExamService` wire API |
| Thêm đề TH + xem submission | 🟡 ~70% | contribution store refactored → API |

**File tham chiếu:** `ModerationController.cs`, `featuredPostsData.js`, `violationsData.js`

---

## 11. Admin — 🟡 ~65%

| Nhóm | Mức | Ghi chú |
|------|-----|---------|
| CRUD đề + OCR + chống trùng SHA-256 | ✅ ~85% | `OcrExamService`, `ContentHash` |
| Duyệt đề mod pending | ✅ | approve endpoint |
| Quản lý tài liệu | 🟡 ~70% | upload/list/delete API; FE admin wire có `USE_MOCK` fallback |
| Quản lý user / reset pwd / grant tokens | ✅ ~80% | |
| Phân quyền Moderator | 🟡 ~60% | patch role qua admin user |
| Gamification config | 🟡 ~65% | levels/badges API; preview mode FE |
| Dashboard thống kê | 🟡 ~55% | `dashboardApi` wire + mock fallback |
| Export CSV/Excel | 🔴 | Không thấy trong codebase |
| Backup/restore | 🔴 | Không có |
| Chatbot admin | 🔴 | Ghi chú **P2 — không có UI** |
| PayOS confirm / audit trail | ✅ ~80% | payments API + audit log append-only interceptor |
| Hard delete dữ liệu | 🟠 | Soft delete posts/exams; hard delete hạn chế |

**File tham chiếu:** `AdminExamsController.cs`, `AdminPaymentsController.cs`, `adminPageMeta.js`

---

## CodeGraph — wiring tóm tắt

```
124 routes BE  ↔  ~25 API modules FE
  auth, posts, exams, messages, notifications, follow, premium, admin/*, profiles, documents, users, block, …

Mock / fallback layers (VITE_USE_MOCK hoặc hardcoded):
  feedData (MOCK_POSTS, FEATURED_POSTS)
  searchAllData (blogs tab)
  HomeSidebar featured
  examCommentsStore (localStorage)
  featuredPostsData (moderator)
  admin dashboard, violations, payments (fallback)
  reviewData (guest)

Đã gỡ:
  FriendsController, FriendService, friendsApi, bảng FriendRequests (migration RemoveFriendRequests)
```

### Lệnh CodeGraph tham khảo

```bash
codegraph sync
codegraph status
codegraph query "PostsController" --kind route
codegraph query "ConversationsController" --kind route
codegraph impact "feedData.js"
```

---

## Phân loại theo mức sẵn sàng

### Sẵn sàng demo / production (core)

- Auth (login, register, OAuth, OTP reset)
- Follow / Message / Chat (SignalR, attachments)
- Feed cơ bản (list, create, like, comment, report)
- Profile (xem/sửa, followers)
- Exams làm bài (attempt, submit, result)
- Practice submit GitHub
- Documents preview (Free 3 trang / Premium full)
- Premium checkout PayOS
- Admin exam OCR + duplicate hash

### Cần hoàn thiện trước go-live (P0/P1)

| # | Gap | Effort ước lượng |
|---|-----|------------------|
| 1 | Reply comment (FE wire `ParentCommentId`) | Nhỏ |
| 2 | Featured sidebar → `GET /posts/featured` | Nhỏ |
| 3 | Search bài viết → posts API thay `MOCK_POSTS` | Nhỏ |
| 4 | Filter feed gửi semester/major lên API | Nhỏ |
| 5 | Exam question comments → BE + FE | Trung bình |
| 6 | Heatmap hoạt động từ stats API | Trung bình |
| 7 | Badge auto-unlock theo hành vi | Trung bình |
| 8 | AI token sync server (align spec 1 vs 100 lượt) | Trung bình |
| 9 | Feedback form → API | Nhỏ |
| 10 | Voucher tự động theo rank (không chỉ admin mock) | Trung bình |
| 11 | Moderator featured / content queue 100% API | Trung bình |

### Phase 2 / backlog (P2)

- Chatbot admin + knowledge base
- Export CSV/Excel dashboard
- Backup/restore
- Discord tích hợp sâu
- SMS provider production
- Hard delete + export toàn platform

---

## Deploy checklist (sau merge vào `main`)

```bash
# Migration
cd be/src/SEHub.Infrastructure
dotnet ef database update --startup-project ../SEHub.API/SEHub.API.csproj

# Verify
cd be && dotnet test
cd fe && npm run build
```

**Cấu hình production cần review:**

- PayOS keys (không dùng mock)
- N8n webhooks (`N8n.Enabled`, URLs)
- `Frontend.BaseUrl`
- SMTP qua secret manager (không commit password)
- Thư mục upload chat: `wwwroot/uploads/chat/`

---

## Tài liệu liên quan

- `SEHUB_PhanTichNghiepVu.md`
- `fe/docs/FE_API_WIRE_PROMPT.md`
- `be/docs/FE_API_QUICKSTART.md`
- `ARCHITECTURE-BE.md`
