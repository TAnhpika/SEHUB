# Guest Integration Audit

Maps guest-accessible features to backend endpoints and frontend implementation.

**Legend:** PASS = FE page + BE endpoint aligned | PARTIAL = page exists but mock/partial API | FAIL = missing or blocked

---

| Feature | Backend Endpoint | Frontend Page | Frontend Service | Status |
|---------|------------------|---------------|------------------|--------|
| **Home Feed** | `GET /api/v1/posts` (AllowAnonymous) | `/community` → `FeedPage.jsx` | None — `feedData.js` mock | **PARTIAL** |
| **Post Details** | `GET /api/v1/posts/{id}` (AllowAnonymous) | `/home/posts/:postId` (auth only); no public detail route | `feedData.js` mock | **PARTIAL** |
| **Search Posts** | `GET /api/v1/posts?search=` (AllowAnonymous) | `MainHeader` search UI — no handler | None | **FAIL** |
| **View Documents** | `GET /api/v1/documents` (**RequireAuthenticated**) | `/community/documents/*` (guest route) | `reviewData.js` mock | **PARTIAL** |
| **View Exams** | `GET /api/v1/exams`, `GET /api/v1/exams/{id}`, `GET .../questions` (AllowAnonymous) | `/community/final-exam/*`, `/community/pratical-exam/*` | `subjectDetailData.js`, `examDetailData.js` mock | **PARTIAL** |
| **Login** | `POST /api/v1/auth/login` | `/login` → `LoginPage.jsx` | `authApi.login` | **PASS** |
| **Register** | `POST /api/v1/auth/register` | `/register` → `RegisterPage.jsx` | `authApi.register` | **PASS** |
| **Forgot Password** | `POST forgot-password`, `verify-otp`, `reset-password` | `/forgot-password` → `ForgotPasswordPage.jsx` | `authApi.forgotPassword`, `verifyOtp`, `resetPassword` | **PASS** (email only) |
| **Google Login** | `POST /api/v1/auth/google` | `/login`, `/register` Google buttons | `authApi.googleLogin` + `googleAuth.js` (requires `VITE_GOOGLE_CLIENT_ID`) | **PARTIAL** |

---

## Summary

| Status | Count |
|--------|-------|
| PASS | 3 |
| PARTIAL | 5 |
| FAIL | 1 |

### Key Gaps

1. **Posts/Documents/Exams** — Guest pages render mock data; no `postsApi`, `documentsApi`, `examsApi` clients exist.
2. **Documents** — Backend requires JWT; guest `/community/documents` cannot call API without login.
3. **Post details** — No guest-accessible post detail route (only `/home/posts/:id` behind `PrivateRoute`).
4. **Search** — Backend supports `search` query param; frontend has no integration.
5. **Google Login** — API wired in Phase 6; needs `VITE_GOOGLE_CLIENT_ID` + Google Cloud OAuth setup.
