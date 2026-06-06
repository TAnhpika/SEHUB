# SEHUB — Frontend Architecture

> Nền tảng học tập & cộng đồng sinh viên FPT  
> Stack: React + Vite · Redux Toolkit · React Router DOM v7 · CSS Modules

---

## 1. Tech Stack

| Vai trò      | Công nghệ                                                 |
| ------------ | --------------------------------------------------------- |
| UI Framework | React 18                                                  |
| Build tool   | Vite                                                      |
| Routing      | React Router DOM v7                                       |
| Global state | Redux Toolkit                                             |
| Async/API    | Redux Thunk (createAsyncThunk)                            |
| Styling      | CSS Modules (\*.module.css per component) + CSS Variables |
| Icons        | Font Awesome 6 (react-fontawesome)                        |
| HTTP Client  | Axios                                                     |
| Auth         | JWT (lưu vào localStorage)                                |

---

## 2. Cấu trúc thư mục

```
src/
├── app/
│   ├── store.js                  # Redux store (kết hợp tất cả reducers)
│   ├── router.jsx                # Định nghĩa tất cả routes
│   └── App.jsx                   # Root component, bọc Provider + RouterProvider
│
├── features/                     # Tổ chức theo feature (QUAN TRỌNG NHẤT)
│   │
│   ├── auth/
│   │   ├── authSlice.js
│   │   ├── authThunks.js
│   │   ├── authService.js
│   │   ├── LoginPage/
│   │   │   ├── LoginPage.jsx
│   │   │   └── LoginPage.module.css
│   │   ├── RegisterPage/
│   │   │   ├── RegisterPage.jsx
│   │   │   └── RegisterPage.module.css
│   │   └── ForgotPasswordPage/
│   │       ├── ForgotPasswordPage.jsx
│   │       └── ForgotPasswordPage.module.css
│   │
│   ├── feed/
│   │   ├── feedSlice.js
│   │   ├── feedThunks.js
│   │   ├── feedService.js
│   │   ├── FeedPage/
│   │   │   ├── FeedPage.jsx
│   │   │   └── FeedPage.module.css
│   │   ├── PostCard/
│   │   │   ├── PostCard.jsx
│   │   │   └── PostCard.module.css
│   │   ├── CreatePostPage/
│   │   │   ├── CreatePostPage.jsx
│   │   │   └── CreatePostPage.module.css
│   │   └── PostDetailPage/
│   │       ├── PostDetailPage.jsx
│   │       └── PostDetailPage.module.css
│   │
│   ├── exam/
│   │   ├── examSlice.js
│   │   ├── examThunks.js
│   │   ├── examService.js
│   │   ├── ExamListPage/
│   │   │   ├── ExamListPage.jsx
│   │   │   └── ExamListPage.module.css
│   │   ├── ExamDetailPage/
│   │   │   ├── ExamDetailPage.jsx
│   │   │   └── ExamDetailPage.module.css
│   │   ├── ExamDoPage/
│   │   │   ├── ExamDoPage.jsx
│   │   │   └── ExamDoPage.module.css
│   │   └── ExamResultPage/
│   │       ├── ExamResultPage.jsx
│   │       └── ExamResultPage.module.css
│   │
│   ├── document/
│   │   ├── documentSlice.js
│   │   ├── documentThunks.js
│   │   ├── documentService.js
│   │   ├── DocumentListPage/
│   │   │   ├── DocumentListPage.jsx
│   │   │   └── DocumentListPage.module.css
│   │   └── DocumentDetailPage/
│   │       ├── DocumentDetailPage.jsx
│   │       └── DocumentDetailPage.module.css
│   │
│   ├── profile/
│   │   ├── profileSlice.js
│   │   ├── profileThunks.js
│   │   ├── profileService.js
│   │   └── ProfilePage/
│   │       ├── ProfilePage.jsx
│   │       └── ProfilePage.module.css
│   │
│   ├── premium/
│   │   ├── premiumSlice.js
│   │   ├── premiumThunks.js
│   │   ├── premiumService.js
│   │   ├── PricingPage/
│   │   │   ├── PricingPage.jsx
│   │   │   └── PricingPage.module.css
│   │   └── CheckoutPage/
│   │       ├── CheckoutPage.jsx
│   │       └── CheckoutPage.module.css
│   │
│   ├── chat/
│   │   ├── chatSlice.js
│   │   ├── chatThunks.js
│   │   ├── chatService.js        # WebSocket logic ở đây
│   │   └── ChatPage/
│   │       ├── ChatPage.jsx
│   │       └── ChatPage.module.css
│   │
│   └── admin/
│       ├── adminSlice.js
│       ├── dashboard/
│       │   └── DashboardPage/
│       │       ├── DashboardPage.jsx
│       │       └── DashboardPage.module.css
│       ├── users/
│       │   ├── UserListPage/
│       │   │   ├── UserListPage.jsx
│       │   │   └── UserListPage.module.css
│       │   └── UserDetailPage/
│       │       ├── UserDetailPage.jsx
│       │       └── UserDetailPage.module.css
│       ├── exams/
│       │   ├── AdminExamListPage/
│       │   │   ├── AdminExamListPage.jsx
│       │   │   └── AdminExamListPage.module.css
│       │   ├── AdminExamCreatePage/
│       │   │   ├── AdminExamCreatePage.jsx
│       │   │   └── AdminExamCreatePage.module.css
│       │   └── AdminExamDetailPage/
│       │       ├── AdminExamDetailPage.jsx
│       │       └── AdminExamDetailPage.module.css
│       ├── documents/
│       │   ├── AdminDocumentListPage/
│       │   │   ├── AdminDocumentListPage.jsx
│       │   │   └── AdminDocumentListPage.module.css
│       │   ├── AdminDocumentUploadPage/
│       │   │   ├── AdminDocumentUploadPage.jsx
│       │   │   └── AdminDocumentUploadPage.module.css
│       │   └── AdminDocumentDetailPage/
│       │       ├── AdminDocumentDetailPage.jsx
│       │       └── AdminDocumentDetailPage.module.css
│       ├── moderation/
│       │   ├── ModerationQueuePage/
│       │   │   ├── ModerationQueuePage.jsx
│       │   │   └── ModerationQueuePage.module.css
│       │   ├── ReportDetailPage/
│       │   │   ├── ReportDetailPage.jsx
│       │   │   └── ReportDetailPage.module.css
│       │   └── BannedAccountsPage/
│       │       ├── BannedAccountsPage.jsx
│       │       └── BannedAccountsPage.module.css
│       ├── gamification/
│       │   ├── LevelsConfigPage/
│       │   │   ├── LevelsConfigPage.jsx
│       │   │   └── LevelsConfigPage.module.css
│       │   ├── BadgesPage/
│       │   │   ├── BadgesPage.jsx
│       │   │   └── BadgesPage.module.css
│       │   └── VouchersPage/
│       │       ├── VouchersPage.jsx
│       │       └── VouchersPage.module.css
│       ├── payments/
│       │   ├── PaymentListPage/
│       │   │   ├── PaymentListPage.jsx
│       │   │   └── PaymentListPage.module.css
│       │   ├── PaymentDetailPage/
│       │   │   ├── PaymentDetailPage.jsx
│       │   │   └── PaymentDetailPage.module.css
│       │   └── AuditLogPage/
│       │       ├── AuditLogPage.jsx
│       │       └── AuditLogPage.module.css
│       └── settings/
│           ├── ChatbotPage/
│           │   ├── ChatbotPage.jsx
│           │   └── ChatbotPage.module.css
│           ├── PermissionsPage/
│           │   ├── PermissionsPage.jsx
│           │   └── PermissionsPage.module.css
│           └── DataPage/
│               ├── DataPage.jsx
│               └── DataPage.module.css
│
├── common/                       # Tất cả component dùng chung
│   ├── layout/                   # Layout wrapper — ghép header + sidebar + content
│   │   ├── GuestLayout/
│   │   │   ├── GuestLayout.jsx
│   │   │   └── GuestLayout.module.css
│   │   ├── MainLayout/
│   │   │   ├── MainLayout.jsx
│   │   │   └── MainLayout.module.css
│   │   ├── AdminLayout/
│   │   │   ├── AdminLayout.jsx
│   │   │   └── AdminLayout.module.css
│   │   └── AuthLayout/
│   │       ├── AuthLayout.jsx
│   │       └── AuthLayout.module.css
│   ├── header/                   # Các biến thể Header
│   │   ├── GuestHeader/
│   │   │   ├── GuestHeader.jsx
│   │   │   └── GuestHeader.module.css
│   │   ├── MainHeader/
│   │   │   ├── MainHeader.jsx
│   │   │   └── MainHeader.module.css
│   │   └── AdminHeader/
│   │       ├── AdminHeader.jsx
│   │       └── AdminHeader.module.css
│   ├── sidebar/                  # Các biến thể Sidebar
│   │   ├── CommunitySidebar/
│   │   │   ├── CommunitySidebar.jsx
│   │   │   └── CommunitySidebar.module.css
│   │   ├── MainSidebar/
│   │   │   ├── MainSidebar.jsx
│   │   │   └── MainSidebar.module.css
│   │   └── AdminSidebar/
│   │       ├── AdminSidebar.jsx
│   │       └── AdminSidebar.module.css
│   ├── footer/                   # Footer dùng chung (trừ Admin)
│   │   └── Footer/
│   │       ├── Footer.jsx
│   │       └── Footer.module.css
│   ├── guards/                   # Route protection
│   │   ├── PrivateRoute/
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── PrivateRoute.module.css
│   │   ├── PremiumRoute/
│   │   │   ├── PremiumRoute.jsx
│   │   │   └── PremiumRoute.module.css
│   │   └── AdminRoute/
│   │       ├── AdminRoute.jsx
│   │       └── AdminRoute.module.css
│   ├── Button/
│   │   ├── Button.jsx
│   │   └── Button.module.css
│   ├── Input/
│   │   ├── Input.jsx
│   │   └── Input.module.css
│   ├── Modal/
│   │   ├── Modal.jsx
│   │   └── Modal.module.css
│   ├── Badge/
│   │   ├── Badge.jsx
│   │   └── Badge.module.css
│   ├── Table/
│   │   ├── Table.jsx
│   │   └── Table.module.css
│   ├── Spinner/
│   │   ├── Spinner.jsx
│   │   └── Spinner.module.css
│   ├── EmptyState/
│   │   ├── EmptyState.jsx
│   │   └── EmptyState.module.css
│   └── Pagination/
│       ├── Pagination.jsx
│       └── Pagination.module.css
│
├── hooks/
│   ├── useAuth.js
│   ├── useDebounce.js
│   └── useToast.js
│
├── services/
│   └── axiosInstance.js
│
├── styles/
│   ├── variables.css             # CSS Variables — màu từ Figma, radius, shadow, font
│   ├── global.css                # Reset + import variables + typography
│   └── animations.css            # Keyframes dùng chung
│
├── img/                          # Toàn bộ ảnh tĩnh của dự án
│   ├── logo.png
│   ├── logo-white.png
│   ├── default-avatar.png
│   ├── empty-state.png
│   └── banner/
│       └── hero-banner.png
│
└── utils/
    ├── formatDate.js
    ├── formatCurrency.js
    └── roleHelpers.js
```

---

## 3. Luồng dữ liệu (Data Flow)

```
Component
  → dispatch(thunk())
    → createAsyncThunk
      → axiosInstance.get/post
        → slice (pending/fulfilled/rejected)
          → Redux store updated
            → Component re-render qua useSelector
```

---

## 4. Routing (React Router DOM v7)

```
/                            → FeedPage (Guest xem được)
/login                       → LoginPage
/register                    → RegisterPage
/forgot-password             → ForgotPasswordPage

/exams                       → ExamListPage
/exams/:id                   → ExamDetailPage
/exams/:id/do                → ExamDoPage (PremiumRoute)
/exams/:id/result            → ExamResultPage (PremiumRoute)

/documents                   → DocumentListPage (PrivateRoute)
/documents/:id               → DocumentDetailPage (PrivateRoute)

/profile/:username           → ProfilePage (PrivateRoute)
/chat                        → ChatPage (PrivateRoute)
/pricing                     → PricingPage

/admin                       → DashboardPage (AdminRoute)
/admin/users                 → UserListPage
/admin/users/:id             → UserDetailPage
/admin/exams                 → AdminExamListPage
/admin/exams/create          → AdminExamCreatePage
/admin/exams/:id             → AdminExamDetailPage
/admin/documents             → AdminDocumentListPage
/admin/documents/upload      → AdminDocumentUploadPage
/admin/documents/:id         → AdminDocumentDetailPage
/admin/moderation            → ModerationQueuePage
/admin/moderation/:id        → ReportDetailPage
/admin/moderation/banned     → BannedAccountsPage
/admin/gamification/levels   → LevelsConfigPage
/admin/gamification/badges   → BadgesPage
/admin/gamification/vouchers → VouchersPage
/admin/payments              → PaymentListPage
/admin/payments/audit        → AuditLogPage
/admin/payments/:id          → PaymentDetailPage
/admin/settings/chatbot      → ChatbotPage
/admin/settings/permissions  → PermissionsPage
/admin/settings/data         → DataPage
```

---

## 5. Auth Flow

- Sau khi login thành công → lưu `accessToken` vào `localStorage`
- `axiosInstance` tự động đính token vào header `Authorization: Bearer <token>` qua request interceptor
- Nếu API trả về `401` → interceptor tự dispatch logout và redirect về `/login`
- `authSlice` lưu: `{ user, token, role, isLoading, error }`
- Route guards đọc `role` từ Redux store để cho phép hoặc redirect

---

## 6. Layout Mapping

Mỗi Layout ghép đúng Header + Sidebar tương ứng:

| Layout            | Header                                                      | Sidebar            | Footer      |
| ----------------- | ----------------------------------------------------------- | ------------------ | ----------- |
| `GuestLayout`     | `GuestHeader` — logo + Login/Register                       | `CommunitySidebar` | ✅ `Footer` |
| `MainLayout`      | `MainHeader` — **search** + thông báo + avatar              | `MainSidebar`      | ✅ `Footer` |
| `ModeratorLayout` | `ModeratorHeader` — **search** + breadcrumb + bell/avatar   | `ModeratorSidebar` | ❌          |
| `AdminLayout`     | `AdminHeader` — **search** + breadcrumb + avatar            | `AdminSidebar`     | ❌          |
| `AuthLayout`      | ❌                                                          | ❌                 | ❌          |

Khi nào dùng layout nào:

- `common/layout/GuestLayout` — tất cả trang chưa đăng nhập: Feed, ExamList, DocumentList, Pricing
- `common/layout/MainLayout` — tất cả trang sau khi đăng nhập: Profile, Chat, ExamDo...
- `common/layout/ModeratorLayout` — toàn bộ `/moderator/*` (kiểm duyệt viên)
- `common/layout/AdminLayout` — toàn bộ `/admin/*` (quản trị hệ thống — chưa implement)
- `common/layout/AuthLayout` — `/login`, `/register`, `/forgot-password`

> **Ghi chú:** `ModeratorLayout` và `AdminLayout` là hai panel riêng. Moderator (`/moderator/*`) phục vụ nghiệp vụ kiểm duyệt cộng đồng (báo cáo, duyệt nội dung, đề thi…). Admin (`/admin/*`) dành cho quản trị hệ thống (dashboard, users, payments…) và nằm ngoài scope moderator hiện tại.

Import ví dụ:

```jsx
import GuestLayout from "@/common/layout/GuestLayout/GuestLayout";
import Button from "@/common/Button/Button";
import PrivateRoute from "@/common/guards/PrivateRoute/PrivateRoute";
```

---

## 7. CSS Convention

- **Mỗi component nằm trong subfolder riêng** chứa `TênComponent.jsx` + `TênComponent.module.css`
- **Tất cả màu sắc, radius, shadow** định nghĩa trong `styles/variables.css` dưới dạng CSS Variables
- **Không hardcode** giá trị màu, size, radius trực tiếp trong `.module.css` — luôn dùng `var(--...)`
- **Tên class trong module: kebab-case** — `.card-title`, `.submit-btn`, `.error-msg`
- **Không dùng inline style** trong JSX trừ trường hợp giá trị tính động (vd: `width: progress + '%'`)

---

## 8. Icon Convention (Font Awesome 6)

Cài đặt:

```bash
npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/react-fontawesome
```

Dùng trong component:

```jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faComment,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";

function PostCard() {
  return (
    <button className={styles["like-btn"]}>
      <FontAwesomeIcon icon={faHeart} />
      Like
    </button>
  );
}
```

- **Không dùng** emoji hay ký tự đặc biệt làm icon — luôn dùng Font Awesome
- **Không import cả thư viện** — chỉ import đúng icon cần dùng để tránh bundle lớn
- Solid icons (`free-solid-svg-icons`): các action button, trạng thái
- Regular icons (`free-regular-svg-icons`): trạng thái chưa active (tim rỗng, bookmark rỗng...)

---

## 9. Image Convention

- **Toàn bộ ảnh tĩnh** đặt trong `src/img/`
- **Ảnh từ API** (avatar user, ảnh bài viết...) dùng URL từ response, không đặt trong `img/`
- Import ảnh trong JSX:

```jsx
import logo from "../../img/logo.png";
import defaultAvatar from "../../img/default-avatar.png";

<img src={logo} alt="SEHUB Logo" className={styles.logo} />;
```

---

## 10. Giai đoạn 1 — Scope

- ✅ Auth (đăng ký, đăng nhập, quên mật khẩu)
- ✅ Feed bài viết (xem, tạo, sửa, xóa, like, comment)
- ✅ Đề thi (danh sách, xem câu hỏi, làm bài Premium, AI giải thích)
- ✅ Tài liệu (danh sách, xem giới hạn Free, full Premium)
- ✅ Admin Panel (8 phân hệ)
- ⏸ Chat real-time — Giai đoạn 2
- ⏸ Heatmap, 26 badge đầy đủ — Giai đoạn 2
- ⏸ Chatbot tư vấn — Giai đoạn 2
