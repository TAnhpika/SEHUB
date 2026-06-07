# SEHub — Backend Demo (Guest + Authenticated Student)

> **Ngày chuẩn bị:** 2026-06-06  
> **Phạm vi:** Chỉ **Guest** và **Student** — không demo Admin/Moderator  
> **Công cụ:** Swagger UI (Development) + SQL Server `SEHubDb`  
> **Nguyên tắc:** Chỉ dùng API đã implement — không tạo tính năng mới

---

# Tổng quan

Backend SEHub là **ASP.NET Core 8 Web API** theo Clean Architecture, response envelope `ApiResponse<T>`, JWT Bearer auth.

**Lưu ý quan trọng trước buổi demo:**

| Hạng mục | Trạng thái DB hiện tại (`SEHubDb`) |
|----------|-------------------------------------|
| Student account | ❌ Chưa có (chỉ có Admin) |
| Posts | ❌ 0 |
| Exams (Published) | ❌ 0 |
| Documents | ❌ 0 |
| Active subscriptions | ❌ 0 |

→ **Bắt buộc** chuẩn bị dữ liệu theo [DEMO_DATA_CHECKLIST.md](DEMO_DATA_CHECKLIST.md) **trước** buổi báo cáo, hoặc tạo dữ liệu **trong lúc demo** (Register → Create Post) và chấp nhận một số bước trả danh sách rỗng.

---

# Phase 1 — Environment Check

## 1.1 Khởi động API

```powershell
cd SEHub.Backend\src\SEHub.API
dotnet run --launch-profile http
```

| Kiểm tra | Kỳ vọng |
|----------|---------|
| Environment | `Development` (Swagger chỉ bật khi Development — `Program.cs` L17-21) |
| HTTP base URL | `http://localhost:5006` |
| HTTPS base URL | `https://localhost:7161` (profile `https`) |
| Connection string | `appsettings.Development.json` → `DESKTOP-AN9LFU8\SQL2019` / `SEHubDb` |

## 1.2 Swagger

| Mục | Giá trị |
|-----|---------|
| **Swagger UI** | [http://localhost:5006/swagger](http://localhost:5006/swagger) |
| **OpenAPI JSON** | [http://localhost:5006/swagger/v1/swagger.json](http://localhost:5006/swagger/v1/swagger.json) |
| JWT scheme | `Bearer` — nút **Authorize** góc phải Swagger |

## 1.3 Database

| Kiểm tra | Kết quả verify |
|----------|----------------|
| Database tồn tại | ✅ `SEHubDb` |
| Migration | ✅ `20260605033348_InitialCreate` (1 migration) |
| Seeder tự động (khi API start) | ✅ Roles (3), LevelConfigs (4), SubscriptionPlans (3), Admin user |

### Dữ liệu seed có sẵn (không cần tạo thêm)

| Loại | Chi tiết |
|------|----------|
| **Roles** | `Student`, `Moderator`, `Admin` |
| **LevelConfigs** | Bronze (0), Silver (100), Gold (500), Platinum (2000) |
| **SubscriptionPlans** | `1m` (99.000đ), `8m` (599.000đ), `4y` (1.999.000đ) |
| **Admin** *(không dùng trong demo)* | `admin@sehub.local` / `Admin@123` |

### Tài khoản demo đề xuất (Student)

Sau khi seed theo checklist:

| Field | Giá trị đề xuất |
|-------|-----------------|
| Email | `demo.student@sehub.local` |
| Username | `demo_student` |
| Password | `Demo@12345` |
| Role | Student |
| Premium | Có subscription active *(bắt buộc cho Demo 12, 13)* |

> Có thể **Register trực tiếp trên Swagger** trong buổi demo thay vì dùng tài khoản pre-seed.

## 1.4 Response envelope

Hầu hết endpoint trả:

```json
{
  "success": true,
  "data": { },
  "message": null,
  "errors": []
}
```

**Ngoại lệ (không bọc envelope):**

- `GET /health`
- `POST /api/v1/premium/webhooks/payos`

## 1.5 Map endpoint thực tế (khác tài liệu draft)

| Draft trong yêu cầu | Endpoint thực tế trong code |
|---------------------|----------------------------|
| `GET /profile` | `GET /api/v1/auth/me` hoặc `GET /api/v1/profiles/{username}` |
| `PUT /profile` | `PUT /api/v1/profiles/me` |
| `POST /exam-attempts` | `POST /api/v1/exams/{id}/attempts` |
| `POST /practice-submissions` | `POST /api/v1/exams/{examId}/practice-submissions` |

---

# Phase 2 — Guest Demo

> Guest = **không** gửi header `Authorization`.

## Demo 1 — Health Check

**`GET /health`**

| | |
|---|---|
| **Mục tiêu** | Chứng minh Backend đang chạy |
| **Auth** | Không cần |
| **Envelope** | Không — trả plain JSON |

**Response mẫu:**

```json
{
  "status": "healthy",
  "timestamp": "2026-06-06T14:30:00.0000000Z"
}
```

**Swagger:** không nằm trong group `api/v1` — gõ trực tiếp URL hoặc dùng browser/curl.

---

## Demo 2 — Register

**`POST /api/v1/auth/register`**

| | |
|---|---|
| **Auth** | `AllowAnonymous` |
| **Validation** | FluentValidation `RegisterRequestValidator` |

**Request mẫu (thành công):**

```json
{
  "email": "demo.student@sehub.local",
  "username": "demo_student",
  "password": "Demo@12345",
  "displayName": "Demo Student"
}
```

**Response mẫu (`200 OK`):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "username": "demo_student",
      "email": "demo.student@sehub.local",
      "displayName": "Demo Student",
      "role": "Student",
      "isPremium": false,
      "avatarUrl": null,
      "points": 0,
      "levelName": "Bronze"
    }
  },
  "message": null,
  "errors": []
}
```

**Validation demo (gửi request sai):**

```json
{
  "email": "not-an-email",
  "username": "ab",
  "password": "short"
}
```

**Response (`400 Bad Request`):**

```json
{
  "success": false,
  "data": null,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    { "field": "Email", "message": "'Email' is not a valid email address." },
    { "field": "Username", "message": "The length of 'Username' must be at least 3 characters." },
    { "field": "Password", "message": "The length of 'Password' must be at least 8 characters." }
  ]
}
```

**Business rules:**

- Email trùng → `409 Conflict` — `"Email is already registered."`
- Username trùng → `409 Conflict` — `"Username is already taken."`
- Tự tạo `UserProfile` + gán role `Student` + level Bronze

---

## Demo 3 — Login

**`POST /api/v1/auth/login`**

**Request:**

```json
{
  "emailOrUsername": "demo_student",
  "password": "Demo@12345"
}
```

**Response (`200 OK`):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "...",
      "username": "demo_student",
      "email": "demo.student@sehub.local",
      "displayName": "Demo Student",
      "role": "Student",
      "isPremium": false,
      "points": 0,
      "levelName": "Bronze"
    }
  }
}
```

### JWT Access Token

- Thuật toán: **HS256**
- Claims: `sub`, `name`, `email`, `role`, `isPremium` *(UI hint — authorization Premium đọc DB)*
- TTL: **60 phút** (`Jwt:ExpirationMinutes` trong `appsettings.json`)

### Refresh Token — lưu ý cho presenter

| Thực tế trong code | Chi tiết |
|--------------------|----------|
| `LoginResponse` | Chỉ trả `accessToken` + `expiresIn` + `user` |
| `RefreshTokens` table | Tồn tại; dùng khi `logout` / `reset-password` revoke |
| Endpoint refresh | ❌ **Chưa có** `POST /auth/refresh` |

→ Trong demo: nói rõ **chỉ demo Access Token JWT**; Refresh Token là backlog (MIN backlog).

**Lưu token:** copy `data.accessToken` → Swagger **Authorize** → `Bearer {token}`

---

## Demo 4 — Browse Feed (Guest)

### 4a. Danh sách bài viết

**`GET /api/v1/posts?page=1&pageSize=10`**

| | |
|---|---|
| **Auth** | `AllowAnonymous` |
| **Query** | `page`, `pageSize`, `search`, `tag` *(semester/major filter — backlog)* |

**Response mẫu:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "post-guid",
        "title": "Chia sẻ kinh nghiệm học SQL",
        "excerpt": "...",
        "author": { "username": "demo_student", "displayName": "Demo Student" },
        "likeCount": 3,
        "commentCount": 1,
        "createdAt": "2026-06-06T10:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 10,
    "totalCount": 5
  }
}
```

> Nếu DB chưa seed posts → `items: []`, `totalCount: 0`. Tạo posts trong Phase 3 Demo 9 rồi quay lại bước này.

### 4b. Chi tiết bài viết

**`GET /api/v1/posts/{id}`**

- Tăng `viewCount` mỗi lần gọi
- Guest xem được nội dung `Published`

---

## Demo 5 — Browse Exams (Guest)

### 5a. Danh sách đề

**`GET /api/v1/exams?type=Final&page=1&pageSize=10`**

| Query | Ý nghĩa |
|-------|---------|
| `type` | `Final` hoặc `Practice` |
| `semester` | Lọc học kỳ |
| `major` | Lọc ngành |

**Auth:** `AllowAnonymous` — chỉ trả đề `Status = Published`.

### 5b. Chi tiết đề

**`GET /api/v1/exams/{id}`**

Metadata: `code`, `title`, `examType`, `semester`, `major`, `questionCount`, `description`.

### 5c. Danh sách câu hỏi (mask đáp án)

**`GET /api/v1/exams/{id}/questions`**

| Business rule | Guest / Free user |
|---------------|-------------------|
| Trả câu hỏi + options | ✅ |
| `correctOptionId` | ❌ **Không expose** (mask) |
| Xem đáp án từng câu | `GET .../questions/{questionId}` — **RequirePremium** |

---

## Demo 6 — Browse Documents (Guest)

> ⚠️ **Khác kỳ vọng draft:** Documents **không** cho Guest.

**`GET /api/v1/documents`** — policy `RequireAuthenticated`

| Actor | Kết quả |
|-------|---------|
| Guest (không token) | **`401 Unauthorized`** |
| Student đã login | ✅ Danh sách tài liệu |

### Cách demo đúng spec

**Bước A — Guest (chứng minh bảo vệ tài nguyên):**

```
GET /api/v1/documents   → 401
```

**Bước B — chuyển sang Phase 3** sau khi Login + Authorize, gọi lại:

```
GET /api/v1/documents
GET /api/v1/documents/{id}
GET /api/v1/documents/{id}/preview?page=1
```

| Business rule | Free Student |
|---------------|--------------|
| Preview | Tối đa **3 trang** (`DocumentService.FreePreviewPageLimit`) |
| Download | ❌ `canDownload: false` — cần Premium |

---

# Phase 3 — Authenticated Student Demo

> Login → copy `accessToken` → Swagger **Authorize** → `Bearer {token}`

**Tài khoản:** `demo_student` / `Demo@12345` *(hoặc user vừa Register)*

---

## Demo 7 — View Profile

### 7a. Session hiện tại (khuyến nghị)

**`GET /api/v1/auth/me`**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "username": "demo_student",
    "email": "demo.student@sehub.local",
    "displayName": "Demo Student",
    "role": "Student",
    "isPremium": false,
    "avatarUrl": null,
    "points": 10,
    "levelName": "Bronze"
  }
}
```

### 7b. Profile công khai

**`GET /api/v1/profiles/{username}`** — ví dụ `demo_student`

Trả thêm: `bio`, `major`, `semester`, `badges[]`.

### 7c. Subscription status

**`GET /api/v1/premium/subscription`**

```json
{
  "success": true,
  "data": {
    "isActive": false,
    "expiresAt": null,
    "planName": null
  }
}
```

> Sau khi kích hoạt Premium (xem mục **Prep Premium** bên dưới): `isActive: true`.

### 7d. Stats

**`GET /api/v1/profiles/me/stats`** — streak, badges, activity summary.

---

## Demo 8 — Update Profile

**`PUT /api/v1/profiles/me`**

**Request:**

```json
{
  "displayName": "Demo Student SE",
  "bio": "Sinh viên năm 3 — chuyên ngành SE",
  "major": "SE",
  "semester": "HK2-2026",
  "avatarUrl": "https://example.com/avatar.png"
}
```

**Response:** `ProfileDto` cập nhật.

---

## Demo 9 — Create Post

**`POST /api/v1/posts`**

**Request:**

```json
{
  "title": "Bài demo buổi báo cáo Backend",
  "content": "Nội dung Markdown demo **SEHub**.",
  "tags": ["demo", "backend", "sehub"]
}
```

**Business rules:**

- Status mặc định: **`Published`** (hiển thị ngay trên feed)
- Gamification: tác giả **+10 điểm** (`GamificationService.PointsPerPost`)
- Response: `201 Created` + `PostDetailDto`

---

## Demo 10 — Like Post

**`POST /api/v1/posts/{id}/like`**

**Response:**

```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likeCount": 1
  }
}
```

**Business rules:**

- Toggle: like lần 2 → vẫn `isLiked: true` (idempotent, không duplicate)
- Unlike: `DELETE /api/v1/posts/{id}/like`
- **Điểm thưởng:** tác giả bài viết **+2 điểm** mỗi like mới (`PointsPerLike = 2`) — kiểm tra qua `GET /api/v1/auth/me` của **tác giả**

---

## Demo 11 — Comment Post

**`POST /api/v1/posts/{id}/comments`**

**Request:**

```json
{
  "content": "Bài viết rất hữu ích, cảm ơn bạn!",
  "parentCommentId": null
}
```

**Reply (nếu muốn):**

```json
{
  "content": "Đồng ý!",
  "parentCommentId": "comment-guid-của-comment-cha"
}
```

**Xem comments (Guest cũng được):** `GET /api/v1/posts/{id}/comments?page=1&pageSize=20`

---

## Demo 12 — Take Exam (Final)

> ⚠️ **RequirePremium** — Student Free sẽ nhận `403 PREMIUM_REQUIRED`.  
> Chuẩn bị Premium trước (xem **Prep Premium**).

### Luồng đầy đủ

```
GET  /api/v1/exams?type=Final
  ↓ lấy examId
GET  /api/v1/exams/{examId}
GET  /api/v1/exams/{examId}/questions
  ↓ lấy questionId + optionId
POST /api/v1/exams/{examId}/attempts
  ↓ lấy attemptId
PUT  /api/v1/exams/{examId}/attempts/{attemptId}/answers
POST /api/v1/exams/{examId}/attempts/{attemptId}/submit
GET  /api/v1/exams/{examId}/attempts/{attemptId}/result
```

### Bước 1 — Tạo attempt

**`POST /api/v1/exams/{examId}/attempts`** (body rỗng)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "attempt-guid",
    "examId": "exam-guid",
    "status": "InProgress",
    "startedAt": "2026-06-06T14:35:00Z",
    "submittedAt": null,
    "score": null
  }
}
```

### Bước 2 — Lưu đáp án (autosave)

**`PUT /api/v1/exams/{examId}/attempts/{attemptId}/answers`**

```json
{
  "answers": {
    "question-guid-1": "option-guid-a",
    "question-guid-2": "option-guid-c"
  }
}
```

> `answers`: map `questionId → selectedOptionId`

### Bước 3 — Nộp bài

**`POST /api/v1/exams/{examId}/attempts/{attemptId}/submit`**

**Response (`ExamResultDto`):**

```json
{
  "success": true,
  "data": {
    "score": 50.0,
    "totalQuestions": 2,
    "correctCount": 1,
    "answers": [
      {
        "questionId": "...",
        "selectedOptionId": "...",
        "correctOptionId": "...",
        "isCorrect": true
      }
    ]
  }
}
```

### Business rules cần nhấn mạnh

| Rule | Hành vi |
|------|---------|
| Chỉ **Final exam** | Practice exam → `403` khi tạo attempt |
| Một attempt `InProgress` / user / exam | Tạo lần 2 → **`409 ACTIVE_ATTEMPT_EXISTS`** |
| Sau submit | `status = Submitted` — có thể tạo attempt mới (làm lại) |
| Chấm điểm | Server-side: `Score = correctCount / totalQuestions × 100` |
| Resume sau F5 | `GET /api/v1/exams/{examId}/attempts/current` |

### Demo Free user (không Premium) — tùy chọn

```
POST /api/v1/exams/{examId}/attempts  → 403 PREMIUM_REQUIRED
```

Giải thích: Premium đọc từ bảng `Subscriptions` (DB-backed), không tin JWT claim.

---

## Demo 13 — Practice Submission

> Route thực tế: `/api/v1/exams/{examId}/practice-submissions`  
> **RequirePremium** + exam `type = Practice`

### Nộp bài

**`POST /api/v1/exams/{examId}/practice-submissions`**

```json
{
  "githubRepoUrl": "https://github.com/demo_student/sehub-practice-lab01"
}
```

**Response (`201 Created`):**

```json
{
  "success": true,
  "data": {
    "id": "submission-guid",
    "githubRepoUrl": "https://github.com/demo_student/sehub-practice-lab01",
    "status": "Submitted",
    "isLatest": true,
    "submittedAt": "2026-06-06T14:40:00Z",
    "reviewerComment": null
  }
}
```

### Lịch sử bài nộp của tôi

**`GET /api/v1/exams/{examId}/practice-submissions/me`**

### Business rules

| Rule | Hành vi |
|------|---------|
| Chỉ **Practice exam** | Final exam → `403` |
| Nộp lại (Premium) | Bản mới `isLatest=true`, bản cũ `isLatest=false` |
| Mod review | `PATCH .../{submissionId}` — **không demo** (Moderator) |

---

# Prep Premium (không dùng Admin — chỉ Student API)

Cần cho Demo 12 & 13. Thực hiện **một lần** sau khi Login:

### Bước 1 — Tạo order

**`POST /api/v1/premium/orders`**

```json
{ "planCode": "1m" }
```

Lưu `data.id` (orderId) và `data.payOsOrderCode` từ response.

### Bước 2 — Giả lập webhook PayOS (Dev mock)

**`POST /api/v1/premium/webhooks/payos`** *(không cần JWT)*

```json
{
  "code": "00",
  "desc": "success",
  "data": {
    "orderCode": 9876543210,
    "amount": 99000,
    "description": "SEHub Premium",
    "reference": "demo-ref-001"
  },
  "signature": "mock-mock-checksum-key-dev"
}
```

> Thay `orderCode` bằng `payOsOrderCode` thực tế (kiểu `long`).  
> Dev checksum key: `mock-checksum-key-dev` → signature = `mock-mock-checksum-key-dev`

### Bước 3 — Xác nhận

**`GET /api/v1/premium/subscription`** → `isActive: true`

**Lưu ý:** Sau webhook, JWT cũ vẫn có `isPremium=false` trong claim — nhưng API Premium/Attempt đọc **DB** (`IPremiumStatusService`) → hoạt động đúng mà không cần login lại.

---

# Phase 4 — Swagger Presentation Script (10–15 phút)

| # | Thời gian | Nội dung | Swagger / API |
|---|-----------|----------|---------------|
| 1 | 1 phút | Giới thiệu kiến trúc: Clean Architecture 6 project, EF Core, JWT, `ApiResponse<T>` | — |
| 2 | 0.5 phút | Mở Swagger `http://localhost:5006/swagger` | Swagger UI |
| 3 | 0.5 phút | Health check — backend sống | `GET /health` |
| 4 | 1.5 phút | Register + show validation error | `POST /api/v1/auth/register` |
| 5 | 1 phút | Login — nhận JWT Access Token | `POST /api/v1/auth/login` |
| 6 | 0.5 phút | Authorize Bearer token | Nút Authorize |
| 7 | 1.5 phút | Feed: list + detail *(hoặc tạo post trước nếu DB trống)* | `GET /api/v1/posts` |
| 8 | 1 phút | Profile + subscription | `GET /api/v1/auth/me`, `GET /api/v1/premium/subscription` |
| 9 | 1 phút | Create post (+10 điểm) | `POST /api/v1/posts` |
| 10 | 1 phút | Like (+2 điểm tác giả) + Comment | `POST .../like`, `POST .../comments` |
| 11 | 2 phút | Exam: questions → attempt → answers → submit → result | Chuỗi `/api/v1/exams/...` |
| 12 | 1.5 phút | Practice: submit GitHub + xem `me` | `POST/GET practice-submissions` |
| 13 | 1 phút | Tổng kết: Guest vs Auth, Premium DB policy, envelope, business rules | — |

**Script nói nhanh (mở đầu):**

> "Frontend chưa wire API — hôm nay demo trực tiếp contract Backend qua Swagger. Toàn bộ endpoint dưới `/api/v1`, response thống nhất envelope `success/data/errors`. Phân quyền: Guest xem feed và đề thi; tài liệu và thao tác ghi cần đăng nhập; làm bài và nộp practice cần Premium đọc từ database."

**Script kết (Demo 13):**

> "Backend G1 đã có Auth, Feed, Exam attempt với chấm điểm server-side, Practice GitHub submit, Premium PayOS webhook idempotent. Admin/Moderator có API riêng nhưng ngoài phạm vi demo hôm nay. Bước tiếp theo của dự án là FE tích hợp axios theo contract này."

---

# Phase 5 — Demo Data Verification

Kết quả kiểm tra `SEHubDb` ngày 2026-06-06:

| Tiêu chí | Yêu cầu | Thực tế | PASS? |
|----------|---------|---------|-------|
| Student account | ≥ 1 | 0 *(chỉ Admin)* | ❌ |
| Posts | ≥ 5 | 0 | ❌ |
| Exam (Published) | ≥ 1 Final + khuyến nghị 1 Practice | 0 | ❌ |
| Document | ≥ 1 | 0 | ❌ |
| Premium subscription (cho exam demo) | ≥ 1 active | 0 | ❌ |

**Kết luận:** Dữ liệu demo **chưa đủ** — xem [DEMO_DATA_CHECKLIST.md](DEMO_DATA_CHECKLIST.md).

### Workaround không cần seed (chấp nhận rủi ro)

| Bước | Có thể làm live |
|------|-----------------|
| Student | Register trong Demo 2 |
| Posts | Create Post trong Demo 9 *(chưa đủ 5 cho feed guest)* |
| Exam / Document / Premium | ❌ Không thể tạo qua Student API — **cần seed** |

---

# Phụ lục — Endpoint Student/Guest dùng trong demo

| Method | Endpoint | Guest | Student | Premium |
|--------|----------|-------|---------|---------|
| GET | `/health` | ✅ | ✅ | ✅ |
| POST | `/api/v1/auth/register` | ✅ | — | — |
| POST | `/api/v1/auth/login` | ✅ | — | — |
| GET | `/api/v1/posts` | ✅ | ✅ | ✅ |
| GET | `/api/v1/posts/{id}` | ✅ | ✅ | ✅ |
| GET | `/api/v1/exams` | ✅ | ✅ | ✅ |
| GET | `/api/v1/exams/{id}` | ✅ | ✅ | ✅ |
| GET | `/api/v1/exams/{id}/questions` | ✅ | ✅ | ✅ |
| GET | `/api/v1/documents` | ❌ 401 | ✅ | ✅ |
| GET | `/api/v1/auth/me` | ❌ | ✅ | ✅ |
| PUT | `/api/v1/profiles/me` | ❌ | ✅ | ✅ |
| POST | `/api/v1/posts` | ❌ | ✅ | ✅ |
| POST | `/api/v1/posts/{id}/like` | ❌ | ✅ | ✅ |
| POST | `/api/v1/posts/{id}/comments` | ❌ | ✅ | ✅ |
| POST | `/api/v1/exams/{id}/attempts` | ❌ | ❌ 403 | ✅ |
| POST | `/api/v1/exams/{examId}/practice-submissions` | ❌ | ❌ 403 | ✅ |
| POST | `/api/v1/premium/orders` | ❌ | ✅ | ✅ |
| GET | `/api/v1/premium/subscription` | ❌ | ✅ | ✅ |

---

# Tài liệu tham chiếu

- [ARCHITECTURE-BE.md](ARCHITECTURE-BE.md) — API contract §4
- [DATABASE_CONFIGURATION_REPORT.md](DATABASE_CONFIGURATION_REPORT.md) — DB setup
- [COMPLIANCE_RECHECK_REPORT.md](COMPLIANCE_RECHECK_REPORT.md) — Business rules đã verify
- [DEMO_DATA_CHECKLIST.md](DEMO_DATA_CHECKLIST.md) — Dữ liệu cần seed trước demo
