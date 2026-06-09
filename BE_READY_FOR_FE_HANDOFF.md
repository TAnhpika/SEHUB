# BE Ready for FE Handoff — Checklist

> **Mục đích:** BE team tick từng mục trước khi bàn giao cho FE nối API.  
> **Phạm vi:** Giai đoạn 1 (G1) — 4 phân hệ P0 + Admin/Moderator.  
> **Cập nhật:** 2026-06-08

---

## Cách dùng

| Ký hiệu | Ý nghĩa |
|---------|---------|
| ☐ | Chưa xong |
| ☑ | Đã xong |
| N/A | Không áp dụng G1 / FE dùng mock tạm |

**Quy tắc bàn giao:** Tất cả mục **P0** và **Infra** phải ☑. Mục **P1** có thể để ☐ nhưng phải ghi rõ trong phần Known gaps.

**Người ký:** _______________ · **Ngày:** _______________

---

## A. Hạ tầng & môi trường (bắt buộc)

| # | Hạng mục | Tiêu chí pass | Trạng thái |
|---|----------|---------------|------------|
| A1 | API chạy local | `dotnet run --project src/SEHub.API` → `http://localhost:5006` | ☐ |
| A2 | Health check | `GET /health` → 200 | ☐ |
| A3 | Swagger | `/swagger` mở được, đủ 15 controller | ☐ |
| A4 | Database migrate | `dotnet ef database update` thành công, không lỗi migration | ☐ |
| A5 | DbSeeder | Roles (Student/Moderator/Admin), plans, levels, admin user | ☐ |
| A6 | DemoDataSeeder (Development) | Chạy khi `ASPNETCORE_ENVIRONMENT=Development` | ☐ |
| A7 | CORS | `http://localhost:5173` (và 5174/5175) trong `Cors:AllowedOrigins` | ☐ |
| A8 | FE env khớp | `fe/.env.development` → `VITE_API_BASE_URL=http://localhost:5006` | ☐ |
| A9 | Response envelope | FE `httpClient` parse được `{ success, data, message, errors }` | ☐ |
| A10 | `dotnet test` | Toàn bộ test pass (unit + integration) | ☐ |

**Lệnh smoke nhanh:**

```bash
cd SEHub.Backend
dotnet ef database update --project src/SEHub.Infrastructure --startup-project src/SEHub.API
dotnet run --project src/SEHub.API
# Terminal khác:
curl http://localhost:5006/health
```

---

## B. Tài khoản test & seed data (bắt buộc)

### B1. Tài khoản (FE cần đủ 3 role)

| Role | Email | Password | Đã seed? | Ghi chú |
|------|-------|----------|----------|---------|
| Admin | `admin@sehub.local` | `Admin@123` | ☑ (DbSeeder) | Có sẵn |
| Student (Premium) | `demo.student@sehub.local` | `Demo@12345` | ☑ (DemoDataSeeder) | Có subscription 1m active |
| Student (Free) | `free.student@sehub.local` | `Free@12345` | ☑ (DemoDataSeeder) | Không có subscription |
| Moderator | `moderator@sehub.local` | `Mod@12345` | ☑ (DemoDataSeeder) | Role Moderator |

| # | Hạng mục | Tiêu chí pass | Trạng thái |
|---|----------|---------------|------------|
| B2 | Login 4 role | `POST /api/v1/auth/login` → `accessToken` + `user.role` đúng | ☐ |
| B3 | `GET /api/v1/auth/me` | Trả đủ `id`, `username`, `email`, `role`, `isPremium` | ☐ |
| B4 | Demo posts | ≥ 5 posts từ `demo.student@`, có ≥ 1 `isFeatured: true` | ☐ |
| B5 | Demo exams | Final `SE301-FINAL-01` + Practice `SE301-LAB-01`, có questions/options | ☐ |
| B6 | Demo document | Category `SE301 - Software Engineering`, file PDF tối thiểu | ☐ |
| B7 | Post reports (moderator) | ≥ 2 báo cáo trạng thái `Pending` | ☑ |
| B8 | Payment orders (admin) | ≥ 1 order `Pending` + 1 `Confirmed` (optional) | ☐ |
| B9 | Moderator pending exam | ≥ 1 exam `Pending` chờ admin duyệt (optional) | ☐ |

> **Đã bổ sung (nhánh `Bao_BE_demo_seed_handoff`):** `DemoDataSeeder` tạo free student, moderator, 2 post reports `Pending`, và mở rộng `SEHub.API.http`.

---

## C. Auth — FE đã/ sắp nối

| # | Endpoint | Method | Auth | FE page / hook | Smoke ☐ |
|---|----------|--------|------|----------------|---------|
| C1 | `/api/v1/auth/register` | POST | Anon | `RegisterPage` | ☐ |
| C2 | `/api/v1/auth/login` | POST | Anon | `LoginPage` | ☐ |
| C3 | `/api/v1/auth/google` | POST | Anon | `LoginPage` (Google) | ☐ |
| C4 | `/api/v1/auth/forgot-password` | POST | Anon | `ForgotPasswordPage` | ☐ |
| C5 | `/api/v1/auth/verify-otp` | POST | Anon | `ForgotPasswordPage` | ☐ |
| C6 | `/api/v1/auth/reset-password` | POST | Anon | `ForgotPasswordPage` | ☐ |
| C7 | `/api/v1/auth/refresh` | POST | Anon | `httpClient` auto | ☐ |
| C8 | `/api/v1/auth/logout` | POST | Bearer | `AuthProvider` | ☐ |
| C9 | `/api/v1/auth/me` | GET | Bearer | boot + `AuthProvider` | ☐ |
| C10 | `/api/v1/auth/send-email-verification` | POST | Anon | Chưa có UI | ☐ |
| C11 | `/api/v1/auth/verify-email` | POST | Anon | Chưa có UI | ☐ |

**FE contract notes:**
- Header: `Authorization: Bearer {accessToken}`
- Login response: `{ accessToken, refreshToken, expiresIn, user }` (trong `data` nếu có envelope)
- 401 → FE tự refresh; 403 banned → message rõ (`ErrorCodes`)

---

## D. Feed & Cộng đồng (P0)

| # | Endpoint | Method | Auth | FE page | Smoke ☐ |
|---|----------|--------|------|---------|---------|
| D1 | `/api/v1/posts` | GET | Anon | `FeedPage`, `HomePage` | ☐ |
| D2 | `/api/v1/posts/featured` | GET | Anon | `HomeSidebar` | ☐ |
| D3 | `/api/v1/posts/{id}` | GET | Anon | `PostDetailPage` | ☐ |
| D4 | `/api/v1/posts` | POST | Student+ | `CreatePostPage` | ☐ |
| D5 | `/api/v1/posts/{id}` | PUT | Author/Mod | Edit post (nếu có) | ☐ |
| D6 | `/api/v1/posts/{id}` | DELETE | Author/Mod | Post actions | ☐ |
| D7 | `/api/v1/posts/{id}/like` | POST | Student+ | `PostCard` | ☐ |
| D8 | `/api/v1/posts/{id}/like` | DELETE | Student+ | Unlike | ☐ |
| D9 | `/api/v1/posts/{id}/comments` | GET | Anon | `PostDetailPage` | ☐ |
| D10 | `/api/v1/posts/{id}/comments` | POST | Student+ | Comment form | ☐ |
| D11 | `/api/v1/posts/{id}/comments/{commentId}` | DELETE | Author/Mod | Mod actions | ☐ |
| D12 | `/api/v1/posts/{id}/report` | POST | Student+ | `ReportPostModal` | ☐ |
| D13 | `/api/v1/posts/{id}/feature` | PATCH | Moderator | `FeaturedPostsPage` | ☐ |

**DTO FE cần map:**
- List: `id`, `title`, `excerpt`, `author`, `tags`, `likeCount`, `commentCount`, `createdAt`, `isFeatured`
- Detail: thêm `content`, `isLiked`, `viewCount`, `status`
- Pagination: `page`, `pageSize`, `totalCount`, `items`

---

## E. Đề thi (P0)

| # | Endpoint | Method | Auth | FE page | Smoke ☐ |
|---|----------|--------|------|---------|---------|
| E1 | `/api/v1/exams` | GET | Anon | `CourseCatalogPage` | ☐ |
| E2 | `/api/v1/exams/{id}` | GET | Anon | `ExamDetailPage` | ☐ |
| E3 | `/api/v1/exams/{id}/questions` | GET | Student+ | `ExamDetailPage` (no answer) | ☐ |
| E4 | `/api/v1/exams/{id}/questions/{qid}` | GET | Premium | Show answer | ☐ |
| E5 | `/api/v1/exams/questions/{qid}/ai-explain` | POST | Student+ | AI explain button | ☐ |
| E6 | `/api/v1/exams/{id}/attempts` | POST | Premium | `ExamDoPage` start | ☐ |
| E7 | `/api/v1/exams/{id}/attempts/current` | GET | Premium | Resume attempt | ☐ |
| E8 | `/api/v1/exams/{id}/attempts/{aid}/answers` | PUT | Premium | Save answers | ☐ |
| E9 | `/api/v1/exams/{id}/attempts/{aid}/submit` | POST | Premium | Submit | ☐ |
| E10 | `/api/v1/exams/{id}/attempts/{aid}/result` | GET | Premium | `ExamResultPage` | ☐ |
| E11 | `/api/v1/exams/{examId}/practice-submissions` | POST | Premium | Practice submit | ☐ |
| E12 | `/api/v1/exams/{examId}/practice-submissions/me` | GET | Premium | My submission | ☐ |
| E13 | `/api/v1/exams/{examId}/practice-submissions` | GET | Moderator | Mod submissions list | ☐ |
| E14 | `/api/v1/exams/{examId}/practice-submissions/{sid}` | PATCH | Moderator | Review submission | ☐ |

**Query params FE cần:** `type` (Final/Practice), `courseCode`, `page`, `pageSize`

---

## F. Tài liệu (P0)

| # | Endpoint | Method | Auth | FE page | Smoke ☐ |
|---|----------|--------|------|---------|---------|
| F1 | `/api/v1/documents` | GET | Student+ | `DocumentsPage` | ☐ |
| F2 | `/api/v1/documents/{id}` | GET | Student+ | Document detail | ☐ |
| F3 | `/api/v1/documents/{id}/preview` | GET | Student+ | `StudentDocumentViewer` (Free: 3 trang) | ☐ |
| F4 | `/api/v1/documents/{id}/download` | GET | Premium | Download button | ☐ |

**Smoke Free vs Premium:**
- Free student → preview giới hạn 3 trang (403 hoặc truncated response theo contract)
- Premium student → full preview + download 200

---

## G. Profile (P1 — nối sau Feed)

| # | Endpoint | Method | Auth | FE page | Smoke ☐ |
|---|----------|--------|------|---------|---------|
| G1 | `/api/v1/profiles/{username}` | GET | Student+ | `ProfilePage`, `FriendProfilePage` | ☐ |
| G2 | `/api/v1/profiles/me` | PUT | Student+ | `EditProfilePage` | ☐ |
| G3 | `/api/v1/profiles/me/stats` | GET | Student+ | Profile stats / streak | ☐ |

---

## H. Premium & PayOS (P0)

| # | Endpoint | Method | Auth | FE page | Smoke ☐ |
|---|----------|--------|------|---------|---------|
| H1 | `/api/v1/premium/plans` | GET | Anon | `PremiumPage` | ☐ |
| H2 | `/api/v1/premium/orders` | POST | Student+ | `CheckoutPage` | ☐ |
| H3 | `/api/v1/premium/orders/{orderId}` | GET | Student+ | Poll payment status | ☐ |
| H4 | `/api/v1/premium/subscription` | GET | Student+ | `PremiumRoute`, header badge | ☐ |
| H5 | `/api/v1/premium/webhooks/payos` | POST | Anon (signed) | Server webhook | ☐ |

**Ghi chú:** Dev dùng mock PayOS URL — FE cần biết field `checkoutUrl` / `qrCode` trong response order.

---

## I. Moderator (P0 UI — nối sau Auth)

| # | Endpoint | Method | Auth | FE page | Smoke ☐ |
|---|----------|--------|------|---------|---------|
| I1 | `/api/v1/admin/moderation/reports` | GET | Moderator | `ReportsPage` list | ☐ |
| I2 | `/api/v1/admin/moderation/reports/{id}` | GET | Moderator | `ReportsPage` detail | ☐ |
| I3 | `/api/v1/admin/moderation/reports/{id}` | PATCH | Moderator | Dismiss / delete content | ☐ |
| I4 | `/api/v1/admin/moderation/banned` | GET | Moderator | Banned list (optional) | ☐ |
| I5 | `/api/v1/posts/{id}/feature` | PATCH | Moderator | `FeaturedPostsPage` | ☐ |
| I6 | `/api/v1/admin/users/{id}` | PATCH | Moderator | `ViolatingAccountsPage` (ban tạm) | ☐ |
| I7 | `/api/v1/admin/exams` | POST | Moderator | Add final/practice exam wizard | ☐ |
| I8 | `/api/v1/admin/exams` | GET | Moderator | Exam list (mod scope) | ☐ |
| I9 | Practice submissions | * | Moderator | `ModeratorPracticeSubmissionsPage` | ☐ |

**Không có API G1:** Content pre-moderation queue riêng → FE `ContentModerationPage` tạm giữ mock hoặc map sang reports.

---

## J. Admin (P0 UI — nối sau Moderator)

| # | Endpoint | Method | Auth | FE page | Smoke ☐ |
|---|----------|--------|------|---------|---------|
| J1 | `/api/v1/admin/dashboard` | GET | Admin | `AdminDashboardPage` | ☐ |
| J2 | `/api/v1/admin/users` | GET | Admin | `AdminUserListPage` | ☐ |
| J3 | `/api/v1/admin/users/{id}` | GET | Admin | `AdminUserDetailPage` | ☐ |
| J4 | `/api/v1/admin/users/{id}` | PATCH | Admin | Ban / role / status | ☐ |
| J5 | `/api/v1/admin/users/{id}/reset-password` | POST | Admin | Reset password | ☐ |
| J6 | `/api/v1/admin/users/{id}/grant-tokens` | POST | Admin | Grant AI tokens | ☐ |
| J7 | `/api/v1/admin/exams` | GET/POST | Admin/Mod | Exam management | ☐ |
| J8 | `/api/v1/admin/exams/{id}` | GET/PUT | Admin | `AdminExamFormPage` | ☐ |
| J9 | `/api/v1/admin/exams/{id}/approve` | POST | Admin | `AdminExamPendingPage` | ☐ |
| J10 | `/api/v1/admin/exams/ocr` | POST | Admin | OCR import (mock OK dev) | ☐ |
| J11 | `/api/v1/admin/documents` | GET/POST | Admin | Document catalog + upload | ☐ |
| J12 | `/api/v1/admin/documents/{id}` | GET/DELETE | Admin | Document detail | ☐ |
| J13 | `/api/v1/admin/payments` | GET | Admin | `AdminPaymentListPage` | ☐ |
| J14 | `/api/v1/admin/payments/{id}` | GET | Admin | Payment detail | ☐ |
| J15 | `/api/v1/admin/payments/audit` | GET | Admin | Audit log tab | ☐ |
| J16 | `/api/v1/admin/payments/{orderId}/confirm` | POST | Admin | Manual confirm | ☐ |
| J17 | `/api/v1/admin/gamification/levels` | GET/PUT | Admin | `AdminGamificationConfigPage` | ☐ |
| J18 | `/api/v1/admin/gamification/badges` | GET | Admin | Badges tab | ☐ |

---

## K. Integration tests (BE quality gate)

| # | Module | Test file / cần có | Trạng thái |
|---|--------|-------------------|------------|
| K1 | Auth | `AuthEndpointsTests`, `ForgotPassword`, `GoogleAuth`, `RateLimit` | ☑ |
| K2 | Feed | `PostsEndpointsTests` | ☑ |
| K3 | Exams | `ExamQuestionsEndpointsTests` | ☑ |
| K4 | Premium | `PremiumEndpointsTests`, `PayOsWebhookTests` | ☑ |
| K5 | Documents | Preview Free vs Premium | ☐ |
| K6 | Profiles | GET/PUT profile | ☐ |
| K7 | Moderation | List + resolve report | ☐ |
| K8 | Admin users | PATCH ban | ☐ |
| K9 | Practice submissions | Submit + review | ☐ |
| K10 | Admin dashboard | GET stats | ☐ |

**Mục tiêu handoff:** K1–K4 pass + thêm ít nhất K5–K7.

---

## L. External services & production prep (P1 — không block FE dev)

| # | Dịch vụ | Dev hiện tại | Cần trước staging | Trạng thái |
|---|---------|--------------|-------------------|------------|
| L1 | Email OTP | Logging / SMTP (config trống) | SMTP thật | ☐ |
| L2 | SMS OTP | `MockSmsService` | Provider thật hoặc N/A G1 | ☐ |
| L3 | PayOS | Mock checkout URL | Webhook + signature verify | ☐ |
| L4 | AI explain | `MockAiExplanationService` | OpenAI/Azure (optional G1) | ☐ |
| L5 | OCR đề thi | Mock text parser | OCR thật (optional) | ☐ |
| L6 | File storage | Local `wwwroot/uploads` | Path ổn định + size/MIME limit | ☐ |
| L7 | Google OAuth | `ClientId` trống trên BE | ClientId/Secret staging | ☐ |

---

## M. Tài liệu bàn giao cho FE (deliverables)

| # | Deliverable | Mô tả | Trạng thái |
|---|-------------|-------|------------|
| M1 | Tài khoản test (bảng B1) | Gửi FE qua Slack/Notion, không commit password production | ☐ |
| M2 | `SEHub.API.http` hoặc Postman collection | Ít nhất 1 request mẫu / module P0 | ☐ |
| M3 | Swagger URL cố định | `http://localhost:5006/swagger` | ☐ |
| M4 | Error code map | `SEHub.Shared/Constants/ErrorCodes` → message tiếng Việt gợi ý cho FE | ☐ |
| M5 | Pagination contract | Document `PagedResult<T>` fields | ☐ |
| M6 | Upload contract | Multipart field names cho admin document upload | ☐ |
| M7 | Known gaps list | Mục N bên dưới — cập nhật khi handoff | ☐ |

---

## N. Known gaps G1 (FE cần biết)

| Gap | Ảnh hưởng FE | Hướng xử lý |
|-----|--------------|-------------|
| Không có Chat / Follow / Notifications API | `MessagesPage`, follow — giữ mock | G2 |
| Không có pre-moderation queue API | `ContentModerationPage` — mock hoặc đợi BE | BA đã cắt G1 |
| Không có question comment API | `ExamComments` — mock | G2 |
| AI / OCR / PayOS dev mock | UI chạy được, nội dung giả | OK cho dev |
| Chưa seed moderator + free student + reports | Mod/admin pages trống khi nối API | **BE fix B1/B7** |
| `SEHub.API.http` gần như trống | FE khó copy request | **BE fix M2** |

---

## O. Thứ tự nối API đề xuất cho FE

```
1. Auth (đã xong) → verify lại me/refresh
2. Feed (D1–D12)
3. Exams list + questions (E1–E3)
4. Documents (F1–F3)
5. Premium subscription check (H4) → PremiumRoute
6. Exam attempts + AI (E4–E10) — cần Premium seed
7. Moderation reports (I1–I3)
8. Admin dashboard + users (J1–J4)
9. Còn lại (practice submit, admin exams/docs/payments)
```

---

## P. Sign-off

| Vai trò | Tên | Ngày | Chữ ký |
|---------|-----|------|--------|
| BE lead | | | |
| FE lead | | | |
| QA (smoke P0) | | | |

**Điều kiện sign-off tối thiểu:**
- [ ] A1–A10 ☑
- [ ] B1–B6 ☑ (B7–B9 khuyến nghị)
- [ ] C1–C9 smoke ☑
- [ ] D1–D4 smoke ☑ (feed read + create)
- [ ] E1–E3 smoke ☑
- [ ] F1–F3 smoke ☑
- [ ] M1–M3 delivered
- [ ] `dotnet test` pass

---

_Tham chiếu: `API_COVERAGE_REPORT.md`, `AUTH_INTEGRATION_MAPPING.md`, `ARCHITECTURE-BE.md`, `SEHUB_PhanTichNghiepVu.md`_
