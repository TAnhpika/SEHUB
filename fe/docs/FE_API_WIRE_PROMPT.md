# SEHUB — Wire Backend API vào Frontend (Cursor prompt)

> Dùng file này làm prompt cho Cursor Agent khi gắn API `be/` vào `fe/`.  
> Nguồn audit: CodeGraph · `ARCHITECTURE-BE.md` · `BACKEND_IMPLEMENTATION_PLAN.md` · `be/docs/FE_API_QUICKSTART.md`

---

## Mục tiêu

Gắn API ASP.NET Core (`be/`, base `http://localhost:5006/api/v1`) vào React FE (`fe/`) theo từng module. **Giữ nguyên** cấu trúc `features/`, routes (`App.jsx`), layouts, guards, CSS modules, component tree. **Không** refactor UI, **không** thêm Redux, **không** đổi routing.

---

## Trạng thái hiện tại (CodeGraph)

| Hạng mục | Trạng thái |
| -------- | ---------- |
| **Đã wire API** | Auth — `fe/src/api/httpClient.js`, `authApi.js`, `authMapper.js`, `AuthProvider.jsx`, Login/Register/Forgot |
| **Chưa wire (mock)** | Feed (`MOCK_POSTS` → `feedData.js`), Profile (`PROFILE_MOCK`), Exams, Documents, Premium checkout, Admin/Moderator (`*MockData.js`) |
| **BE sẵn sàng** | 81 routes — Auth, Posts, Exams, PracticeSubmissions, Documents, Premium, Profiles, Admin/*, Health |
| **Env** | `fe/.env.development` → `VITE_API_BASE_URL=http://localhost:5006` |
| **Contract** | `{ success, data, message, errors[] }` — dùng `apiRequest()` trong `httpClient.js` |

---

## Ràng buộc BẮT BUỘC

### ĐƯỢC sửa / thêm

- `fe/src/api/**` — thêm `postsApi.js`, `feedMapper.js`, … (mirror pattern `authApi.js`)
- `fe/src/features/**/**Data.js` — đổi **implementation** (mock → gọi API), **giữ export name & signature** mà pages đang import
- `fe/src/features/**/hooks/` — thêm hook mới nếu cần (optional)
- Sửa **tối thiểu** page: chỉ thêm `useEffect` fetch / loading / error nếu data layer async; **không** đổi JSX layout/className

### KHÔNG được

- Đổi `fe/src/app/App.jsx` routes, path, layout nesting
- Đổi tên/move folder `features/*`, `common/*`, `context/*`
- Thêm Redux, RTK Query, axios instance mới (dùng `httpClient.js`)
- Xóa mock file rồi inline logic vào page
- Sửa BE trừ khi phát hiện bug contract thật
- Wire Chat, Notifications, QuestionComment (G2 — không có BE)
- Wire moderator **exam contribution audit store** (local FE only — giữ mock)
- Phá guest/community pages vẫn dùng mock catalog (`reviewData`, `REVIEW_COURSES`) trừ khi có API tương ứng

---

## Pattern chuẩn (copy từ Auth)

### 1) API client (`fe/src/api/<module>Api.js`)

```javascript
import { apiRequest } from "./httpClient";

export function listPosts(params) {
  const qs = new URLSearchParams(params).toString();
  return apiRequest(`/api/v1/posts${qs ? `?${qs}` : ""}`);
}
```

### 2) Mapper (`fe/src/api/<module>Mapper.js`)

Map BE DTO → shape mà UI đang dùng (PostCard, ProfileCard, …). **Không** đổi component props.

Ví dụ PostCard expect: `{ id, title, author, tags, likes, comments, time, … }` — mapper tạo đúng field names từ `PostDto`.

### 3) Data layer (`fe/src/features/<module>/*Data.js`)

- **Giữ** export mà pages đang import
- Thêm `export async function loadPosts(filters)` gọi API
- Page đổi `useState(MOCK_POSTS)` → `useEffect` gọi `loadPosts` — **giữ cùng state shape**
- Mock constants: giữ làm **fallback dev** chỉ khi `import.meta.env.VITE_USE_MOCK === "true"` (optional, default off)

### 4) Error handling

- Dùng `ApiError` từ `httpClient.js`
- 401: `httpClient` đã refresh/logout — page chỉ catch hiển thị toast
- 400 validation: map `errors[].field` → form field (camelCase)
- Loading: spinner/null skeleton — **không** đổi page structure

---

## Thứ tự wire (1 PR / 1 module)

### Phase 0 — Verify (regression)

- [ ] Login/logout/me/refresh
- [ ] Register → redirect login
- [ ] `PrivateRoute` dùng `isAuthenticated` (không `authed`)
- [ ] `npm run build` pass

### Phase 1 — Feed (`PostsController`, 13 routes)

**Pages:** `FeedPage`, `HomePage`, `PostDetailPage`, `CreatePostPage`, `PostDetailModal`, `ReportPostModal`  
**Data:** `feedData.js`, `feedFilterData.js`, `reportData.js`  
**API:** GET/POST/PUT/DELETE `/posts`, like, comments, report, featured, PATCH feature  
**Mapper:** `feedMapper.js`  
**Test:** list feed, create post, like, comment, report; guest xem `/community` không crash

### Phase 2 — Profile (`ProfilesController`, 3 routes)

**Pages:** `ProfilePage`, `EditProfilePage`  
**Data:** `profileData.js`, `profileFormData.js`  
**API:** GET `/profiles/{username}`, PUT `/profiles/me`, GET `/profiles/me/stats`  
**Giữ mock:** `ActivityHeatmap`, `BADGES`, `RECENT_POSTS` nếu BE chưa có  
**Test:** xem profile owner/guest, edit profile

### Phase 3 — Exams (`ExamsController`, 11 routes)

**Pages:** `ExamDetailPage`, `ExamDoPage`, `ExamResultPage`, `PracticeDoPage`  
**Data:** `examDetailData.js`, `examCommentsData.js` (comments mock nếu không có BE)  
**API:** list, questions, attempts, answers, submit, result, `attempts/current`, ai-explain  
**PremiumRoute:** giữ guard — BE trả 403 `PREMIUM_REQUIRED`  
**Test:** free user mask answers; premium làm bài + submit

### Phase 4 — Practice GitHub (`PracticeSubmissionsController`, 4 routes)

**Pages:** `ExamDetailPage` (practice tab), mod review pages  
**API:** POST/GET/PATCH practice-submissions  
**Giữ mock:** moderator contribution history (local store)

### Phase 5 — Documents (`DocumentsController`, 4 routes)

**Pages:** `DocumentsPage`, `StudentDocumentViewer`  
**Data:** `documentPageContent.js`, `documentDownload.js`, `documentAccessPolicy.js`  
**API:** list, detail, preview, download  
**Test:** free preview ≤3 pages; premium download

### Phase 6 — Premium (`PremiumController`, 5 routes)

**Pages:** `PremiumPage`, `CheckoutPage`, `PaymentSuccessPage`  
**Data:** `pricingData.js`  
**API:** plans, orders, subscription poll  
**Sau webhook:** refresh `/auth/me` hoặc `AuthProvider.activatePremium()`

### Phase 7 — Admin (`Admin/*`, 28 routes)

**Wire từng sub-area:** dashboard → users → exams → documents → moderation → payments → gamification  
**Data:** `adminMockData.js`, `adminExamData.js`, …  
**Giữ mock:** vouchers, permissions, activity log (P1/P2)

### Phase 8 — Moderator reports (subset Admin)

**Pages:** `ReportsPage`, `AdminModerationPage`  
**API:** `/admin/moderation/reports`, PATCH resolve  
**Giữ mock:** content queue, violations, featured

---

## Mapping FE feature → BE

| FE feature | Mock file chính | BE Controller | Routes |
| ---------- | --------------- | ------------- | ------ |
| auth | ✅ wired | AuthController | 14 |
| feed | feedData.js | PostsController | 13 |
| profile | profileData.js | ProfilesController | 3 |
| exam | examDetailData.js | ExamsController | 11 |
| practice | practiceExamData.js | PracticeSubmissionsController | 4 |
| document | documentPageContent.js | DocumentsController | 4 |
| premium | pricingData.js | PremiumController | 6 |
| admin | adminMockData.js | Admin/* | 28 |
| moderator reports | reportsData.js | Admin/ModerationController | 4 |

---

## Checklist mỗi phase

1. `codegraph sync` + verify imports
2. BE: `cd be && dotnet run --project src/SEHub.API --launch-profile http`
3. FE: `cd fe && npm run dev`
4. Smoke seed: `admin@sehub.local` / `Admin@123`, `demo.student@sehub.local` / `Demo@12345`
5. `npm run build` — no errors
6. Regression auth + guest routes
7. Không commit secrets; không sửa `App.jsx` routes

---

## CodeGraph commands

```bash
codegraph sync
codegraph query "PostsController" --kind route
codegraph query "feedData"
codegraph impact "feedData.js"
codegraph query "authApi"
```

---

## Tài liệu tham chiếu

- [be/docs/FE_API_QUICKSTART.md](../../be/docs/FE_API_QUICKSTART.md)
- [ARCHITECTURE-BE.md](../../ARCHITECTURE-BE.md) §4
- [be/postman/SEHub-FE.postman_collection.json](../../be/postman/SEHub-FE.postman_collection.json)
- Swagger: `http://localhost:5006/swagger`

---

## Nguyên tắc diff tối thiểu

- Một phase = một module = diff tập trung `fe/src/api/` + `fe/src/features/<module>/`
- Mapper xử lý khác biệt field BE↔UI — **không** sửa PostCard/ProfileCard props
- Nếu API thiếu field UI cần: mapper fill default (`streak: 0`, `time: formatRelative(createdAt)`)

**Bắt đầu Phase 1 (Feed).** Đọc `FeedPage.jsx`, `feedData.js`, `PostCard.jsx` và Swagger `/api/v1/posts` trước khi viết code. Báo cáo file sẽ sửa trước khi apply changes.
