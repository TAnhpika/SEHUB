# Kết quả kiểm tra: Xử lý báo cáo & Khóa tài khoản

**Ngày:** 2026-07-07  
**Phương pháp:** Automated integration/unit tests (API E2E) + sửa test flaky  
**Lệnh chạy:**

```powershell
cd be
dotnet test --filter "FullyQualifiedName~Moderation|FullyQualifiedName~SocialPhase3|FullyQualifiedName~BanStatus|FullyQualifiedName~AuthServiceTests"
```

**Kết quả tổng:** 48/48 PASS (32 integration + 16 unit)

---

## Ma trận kết quả

### Bước 1 — Automated tests hiện có

| Test file | Kết quả | Ghi chú |
|-----------|---------|---------|
| `ReportIntegrationTests` | PASS (3) | Đã sửa `EscalateUserReport`: `Source=chat` → `profile`, dùng target user riêng |
| `ViolationsIntegrationTests` | PASS (3) | Warn → ban → login 403 → unban |
| `ModerationIntegrationTests` | PASS (4) | Post moderation queue |
| `SocialPhase3EndpointsTests` | PASS (5) | Conversation report + resolve |
| `ModerationE2EIntegrationTests` | PASS (17) | **Mới** — cover gap từ kế hoạch |
| `PostsIntegrationTests` | PASS* | Post report + duplicate 409 (*chạy riêng, ngoài filter) |
| `AuthServiceTests` / `BanStatusServiceTests` | PASS (16) | Login banned, ban expiry |

### Bước 2 — Gửi báo cáo (R1–R5)

| Case | API test | Kết quả |
|------|----------|---------|
| R1 Post report → mod queue | `ReportPost_AppearsInModeratorCommunityQueue` | PASS |
| R2 Comment report → mod queue | `ReportComment_Submitted_AppearsInModeratorCommunityReports` | PASS |
| R3 User profile report | `ReportUser_Profile_AppearsInUserReportsQueue` | PASS |
| R4 Conversation report | `ReportConversation_CreatesPendingReport` | PASS |
| R5 Exam question report | `ReportQuestion_AppearsInQuestionReportsQueue` | PASS |
| Báo cáo chính mình | `ReportSelf_ReturnsForbidden` | PASS |
| Báo cáo trùng | `ReportPost_Duplicate_ReturnsConflict` | PASS |

### Bước 3 — Moderator xử lý báo cáo

| Action | API test | Kết quả |
|--------|----------|---------|
| Bỏ qua community | `Moderator_DismissCommunityReport_ResolvesReport` | PASS |
| Xóa bài từ report | `Moderator_DeletePostFromReport_SoftDeletesPost` | PASS |
| Bỏ qua user report | `Moderator_DismissUserReport_ResolvesReport` | PASS |
| Escalate → violations | `EscalateUserReport_AddsUserToViolationsQueue` | PASS |
| Resolve conversation | `Moderator_CanListAndResolveConversationReports` | PASS |

### Bước 4 — Khóa tài khoản (L1–L12)

| Case | API test | Kết quả |
|------|----------|---------|
| L1 Cảnh báo + notification | `WarnUser_CreatesModerationNotificationForTarget` | PASS |
| L2 Khóa 7 ngày | `Moderator_Ban7Days_BlocksLogin` | PASS |
| L3 Login bị chặn | `Moderator_Ban7Days_BlocksLogin` + `WarnBanAndUnban_FullViolationFlow` | PASS |
| L4 Middleware session | `BannedUserMiddleware_BlocksApiCallWithExistingToken` | PASS |
| L5 Unban | `Moderator_Unban_RestoresLogin` | PASS |
| L6 Admin ban từ report | `Admin_Ban7Days_WhileResolvingUserReport` | PASS |
| L7–L8 Permanent ban | `Admin_PermanentBan_AppearsInBannedList` | PASS |
| L9 Admin unban | `Admin_Unban_RemovesFromActiveBannedList` | PASS |
| L10 Mod không khóa admin | `Moderator_CannotBanAdmin_ReturnsForbidden` | PASS |
| L11 Mod không unban permanent | `Moderator_CannotUnbanPermanentBan_ReturnsForbidden` | PASS |
| L12 Ban không lý do | `BanWithoutReason_ReturnsBadRequest` | PASS |

### Bước 5 — Thông báo

| Sự kiện | Test | Kết quả |
|---------|------|---------|
| Cảnh cáo → notification SV | `WarnUser_CreatesModerationNotificationForTarget` | PASS |
| SV gửi báo cáo → mod stats | `ReportComment_Submitted` (pending count) | PASS |

---

## Bug đã sửa trong quá trình kiểm tra

1. **`ReportIntegrationTests.EscalateUserReport`** — `Source = "chat"` không hợp lệ (BE chỉ chấp nhận `post` / `profile` / `question_comment`). Test pass khi chạy cùng suite do dùng report cũ của test khác; fail khi chạy riêng.
2. **Test isolation** — Các test E2E mới dùng post/user riêng và reset trạng thái ban của target user giữa các case.

---

## Gap / đề xuất tiếp theo

| Mục | Trạng thái | Ghi chú |
|-----|------------|---------|
| Post report E2E | Đã cover | `ModerationE2EIntegrationTests` + `PostsIntegrationTests` |
| Permanent ban | Đã cover | `Admin_PermanentBan_AppearsInBannedList` |
| BannedUserMiddleware | Đã cover | `BannedUserMiddleware_BlocksApiCallWithExistingToken` |
| Mod không khóa mod | Chưa test | Chỉ test không khóa admin (L10) |
| UI manual (toast, modal, routing) | Đã cập nhật route | QA: matrix route Admin/Mod bên dưới |
| `GET /banned` hiển thị ban record cũ sau unban | Quan sát | `GetActiveBansAsync` lọc theo `Until`, không theo `User.IsBanned` — có thể hiển thị ban tạm đã unban trong danh sách |

### Manual UI checklist (khuyến nghị QA)

**Ma trận route sau refactor Admin/Mod UI (2026-07-09):**

| Nghiệp vụ | Moderator (primary) | Admin (full power, shared component) |
|-----------|---------------------|--------------------------------------|
| Báo cáo | `/moderator/reports` | `/admin/moderation` |
| Duyệt bài | `/moderator/content` | `/admin/moderation/content` |
| Chấm TH | `/moderator/practice-submissions` | `/admin/moderation/practice-submissions` |
| Duyệt đề Mod | — | `/admin/exams/pending` |
| Legacy redirect | — | `/admin/exams/submissions` → practice-submissions |

1. SV: báo cáo bài / comment / profile / chat / câu hỏi → toast xác nhận
2. Mod: `/moderator/reports` — bỏ qua, xóa bài, escalate user
3. Mod: `/moderator/content` — duyệt / từ chối bài pending
4. Mod: `/moderator/violations` — cảnh cáo, khóa 1/7/30 ngày, mở khóa
5. Admin: `/admin/moderation` — xử lý báo cáo (cùng workspace với Mod)
6. Admin: `/admin/moderation/content` — duyệt bài (trước đây chỉ có trên Mod)
7. Admin: `/admin/moderation/practice-submissions` — chấm TH + highlight từ notification
8. Admin: `/admin/moderation/banned` — danh sách + mở khóa
9. SV bị khóa: `AccountPenaltyModal` khi login + notification

**Tài khoản:** `free@test.local` / `moderator@sehub.local` / `admin@sehub.local`

---

## File thay đổi

- `fe/src/features/moderation/reports/ReportsWorkspace.jsx` — shared báo cáo (admin + mod)
- `fe/src/features/moderation/practice/PracticeSubmissionsWorkspace.jsx` — shared chấm TH
- `fe/src/features/admin/adminNavData.js` — subgroup Kiểm duyệt
- `fe/src/app/App.jsx` — routes `/admin/moderation/content`, `/admin/moderation/practice-submissions`
- `be/src/SEHub.Infrastructure/.../AdminActivityReadRepository.cs` — audit `admin`/`mod` trên REPORT_RESOLVED
- `be/tests/SEHub.API.IntegrationTests/Moderation/ReportIntegrationTests.cs` — fix escalate test
- `be/tests/SEHub.API.IntegrationTests/Moderation/ModerationE2EIntegrationTests.cs` — **mới**, 17 test cases
