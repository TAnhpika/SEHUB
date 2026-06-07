# SEHub — Role & Permission Audit

> **Date:** 2026-06-06  
> **Roles (BA):** Guest · Student (Free) · Student (Premium) · Moderator · Admin  
> **Implementation:** ASP.NET Identity roles `Student`, `Moderator`, `Admin` + `RequirePremium` policy (DB subscription)

---

## Policy Registration

```9:26:SEHub.Backend/src/SEHub.API/Extensions/AuthorizationPolicies.cs
// RequireAuthenticated | RequirePremium (+ PremiumAuthorizationHandler)
// RequireModerator (Moderator OR Admin)
// RequireAdmin (Admin only)
```

**Premium:** `PremiumAuthorizationHandler` queries `Subscriptions` via `IPremiumStatusService` — not JWT-only.

**Ban:** `BannedUserMiddleware` returns 403 for banned authenticated users on all routes.

---

## Permission Matrix

| Feature (BA §6) | Guest | Free Student | Premium Student | Moderator | Admin | BE Enforcement | Issues |
|-----------------|-------|--------------|-----------------|-----------|-------|----------------|--------|
| Đăng ký / Đăng nhập | ✅ | ✅ | ✅ | ✅ | ✅ | `[AllowAnonymous]` auth endpoints | Google OAuth stub |
| Xem danh sách đề thi | ✅ | ✅ | ✅ | ✅ | ✅ | `GET /exams` Anonymous | — |
| Xem câu hỏi (no answer) | ✅ | ✅ | ✅ | ✅ | ✅ | `GET .../questions` masks answers | — |
| Xem đáp án | ❌ | ❌ | ✅ | ✅ | ✅ | `GET .../questions/{id}` `RequirePremium` + service check | Mod/Admin via `IsModeratorOrAdmin` in service |
| Làm bài TN online | ❌ | ❌ | ✅ | ✅ | ✅ | `RequirePremium` on attempts | — |
| AI giải thích | ❌ | ✅ 10/day | ✅ 1000/day | ✅ 1000/day | ✅ | `RequireAuthenticated` + token limits in service | Admin gets premium limit via `IsModeratorOrAdmin` |
| Nộp GitHub TH | ❌ | ❌ | ✅ | ✅ | ✅ | `RequirePremium` on practice submit | — |
| Xem tài liệu | ❌ | ✅ (3 trang) | ✅ Full | ✅ Full | ✅ Full | `RequireAuthenticated`; page limit in service | Guest correctly blocked |
| Tải tài liệu | ❌ | ❌ | ✅ | ✅ | ✅ | Service `HasFullAccess()` | Controller only `RequireAuthenticated` — **service blocks Free** |
| Xem bài viết | ✅ | ✅ | ✅ | ✅ | ✅ | `GET /posts` Anonymous | — |
| Tạo/sửa/xóa bài | ❌ | ✅ (own) | ✅ (own) | ✅ (any) | ✅ | `RequireAuthenticated` + `EnsureAuthorOrModerator` | — |
| Like / comment | ❌ | ✅ | ✅ | ✅ | ✅ | `RequireAuthenticated` | — |
| Báo cáo bài | ❌ | ✅ | ✅ | ✅ | ✅ | `RequireAuthenticated` | — |
| Ghim bài nổi bật | ❌ | ❌ | ❌ | ✅ | ✅ | `RequireModerator` on PATCH feature | — |
| Xử lý báo cáo | ❌ | ❌ | ❌ | ✅ | ✅ | `ModerationController` class `RequireModerator` | — |
| Khóa tài khoản tạm | ❌ | ❌ | ❌ | ✅ | ✅ | `PATCH /admin/users/{id}` `RequireModerator` + service rules | Mod cannot change roles |
| Khóa vĩnh viễn | ❌ | ❌ | ❌ | ❌ | ✅ | Admin-only permanent ban (no `BanUntil`) | — |
| Thêm đề thi | ❌ | ❌ | ❌ | ✅ | ✅ | `POST /admin/exams` `RequireModerator` | — |
| Duyệt đề / OCR | ❌ | ❌ | ❌ | ❌ | ✅ | `approve`, `ocr`, `PUT` → `RequireAdmin` | Mod cannot approve — **matches ARCH-BE** |
| Admin dashboard / payments | ❌ | ❌ | ❌ | ❌ | ✅ | Admin controllers | — |
| Follow / Chat | ❌ | ✅ (BA) | ✅ | ✅ | ✅ | **Not implemented** | Expected G2 deferral |

---

## Controller-Level Authorization Audit

| Controller | Class Policy | Notable Endpoint Policies | Assessment |
|------------|--------------|----------------------------|------------|
| `AuthController` | None | Per-action Anonymous / Authenticated | Correct |
| `PostsController` | None | Mixed Anonymous + Authenticated + Mod on feature | Correct |
| `ExamsController` | None | Anonymous reads; Premium on attempts/answers | Correct |
| `DocumentsController` | None | All `RequireAuthenticated` | Download relies on service-layer premium check |
| `PracticeSubmissionsController` | None | Premium submit; Mod list/review | Correct |
| `PremiumController` | None | Plans anonymous; orders authenticated | Correct |
| `Admin\UsersController` | Mixed | List/reset/grant Admin; PATCH Mod | Correct split |
| `Admin\ModerationController` | `RequireModerator` | All actions | Correct |
| `Admin\ExamsController` | Per-action | Create Mod; update/approve/OCR Admin | Intentional elevation |
| `Admin\DocumentsController` | `RequireAdmin` | All | Correct |
| `Admin\PaymentsController` | `RequireAdmin` | All | Mod cannot confirm payments |

---

## Service-Level Protection

| Service | Protection Pattern | File |
|---------|-------------------|------|
| `PostService` | `EnsureAuthorOrModerator` on update/delete | `PostService.cs:124,142` |
| `CommentService` | Author or Mod for delete | `CommentService.cs:98-101` |
| `DocumentService` | `EnsureAuthenticated` + `HasFullAccess` | `DocumentService.cs:113-121` |
| `ExamQueryService` | `ShouldMaskAnswers`, premium for answers | `ExamQueryService.cs:74-77,100-101` |
| `AdminUserService` | `ValidatePatchPermissions` for Mod | `AdminUserService.cs:283-338` |
| `PracticeSubmissionService` | `RequirePremiumUser`, Mod check on list/review | `PracticeSubmissionService.cs:77-79` |

---

## Risk Findings

### Privilege Escalation Risks

| Risk | Severity | Detail |
|------|----------|--------|
| Document download controller policy | **LOW** | `DocumentsController` uses `RequireAuthenticated` not `RequirePremium`; **mitigated** by `DocumentService.GetDownloadUrlAsync` throwing `ForbiddenException` for Free users |
| Google OAuth stub | **MEDIUM** | Any client can forge login by sending email-shaped `IdToken` — not production-safe |
| JWT `isPremium` claim | **LOW** | UI hint only; authorization uses DB via handler |

### Missing Authorization

| Item | Severity | Detail |
|------|----------|--------|
| Follow / Chat APIs | **N/A (G2)** | Deferred by design |
| Question comment on exams | **N/A (G2)** | Not in G1 scope |
| Notifications | **N/A (G2)** | Not implemented |

### Over-Restricted APIs

| Item | Detail |
|------|--------|
| Profiles require auth | BA allows public profile view for community; BE requires `RequireAuthenticated` on `GET /profiles/{username}` — guests cannot view profiles via API |
| Admin exam PUT | Moderator can create but not edit — may block Mod workflow for draft fixes |

---

## CodeGraph Verification

- `LikeAsync` callers: `PostsController.Like` → `PostLikeService.LikeAsync`
- `StartAttemptAsync` callers: `ExamsController.StartAttempt` → `ExamAttemptService.StartAttemptAsync`
- Premium handler: `PremiumAuthorizationHandler.HandleRequirementAsync` → `IPremiumStatusService.IsPremiumAsync`
