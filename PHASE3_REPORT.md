# SEHUB Performance Optimization — Phase 3 Report

**Date:** 2026-06-24  
**Prerequisites:** `PHASE1_REPORT.md`, `PHASE2_REPORT.md`  
**Branch:** `Hau_BE`  
**Status:** Complete — **not committed**

---

## Executive Summary

Phase 3 eliminates moderation N+1 queries, reduces admin API payloads, splits admin/moderator bundles via lazy routes, adds HTTP/memory caching for hot read endpoints, and proposes DB indexes for feed filter queries. **94** unit tests and **69** integration tests pass. Frontend and backend builds succeed. CodeGraph confirms batch mapping wiring and lazy route isolation.

---

## 1. Files Changed

### Backend

| File | Task | Change |
|------|------|--------|
| `be/src/SEHub.Application/Admin/ModerationService.cs` | 1, 4 | `MapReportsAsync`, `MapModerationListItemsAsync`; batch practice submissions; `IMemoryCache` for stats; invalidate on `ResolveReportAsync` |
| `be/src/SEHub.Application/Abstractions/Repositories/IPostRepository.cs` | 1 | `GetByIdsIncludingDeletedAsync` |
| `be/src/SEHub.Infrastructure/Persistence/Repositories/PostRepository.cs` | 1 | Batch post lookup (ignore soft-delete filter) |
| `be/src/SEHub.Application/Abstractions/Repositories/IExamRepository.cs` | 1 | `GetByIdsAsync` |
| `be/src/SEHub.Infrastructure/Persistence/Repositories/ExamRepository.cs` | 1 | Batch exam lookup |
| `be/src/SEHub.API/Controllers/PostsController.cs` | 4 | `[ResponseCache(Duration = 60)]` on `GET /posts/featured` |
| `be/src/SEHub.API/Extensions/ServiceCollectionExtensions.cs` | 4 | `AddResponseCaching()` |
| `be/src/SEHub.API/Program.cs` | 4 | `UseResponseCaching()` |
| `be/src/SEHub.Application/SEHub.Application.csproj` | 4 | `Microsoft.Extensions.Caching.Abstractions` |
| `be/src/SEHub.Infrastructure/Persistence/Configurations/PostConfiguration.cs` | 5 | Index `(Status, AuthorId, CreatedAt)` |
| `be/src/SEHub.Infrastructure/Persistence/Configurations/UserProfileConfiguration.cs` | 5 | Index `(Major, Semester)` |
| `be/src/SEHub.Infrastructure/Persistence/Configurations/PostReportConfiguration.cs` | 5 | Index `(Status, CreatedAt)` |
| `be/src/SEHub.Infrastructure/Persistence/Migrations/20260624153154_Phase3FeedIndexOptimization.cs` | 5 | EF migration for new indexes |
| `be/tests/SEHub.Application.UnitTests/Admin/ModerationServiceTests.cs` | 1 | `IMemoryCache` in constructor |

### Frontend

| File | Task | Change |
|------|------|--------|
| `fe/src/features/admin/shared/adminPaginationConstants.js` | 2 | `ADMIN_API_PAGE_SIZE = 25` |
| `fe/src/features/admin/moderation/adminReportData.js` | 2 | `fetchAdminReportsPage`; API page size 25 |
| `fe/src/features/admin/moderation/AdminModerationPage.jsx` | 2 | Load-more for reports beyond first page |
| `fe/src/features/admin/moderation/AdminModerationPage.module.css` | 2 | `.loadMoreRow` |
| `fe/src/features/moderator/reports/reportsData.js` | 2 | Paginated `loadModeratorCommunityReports` |
| `fe/src/features/moderator/reports/ReportsPage/ReportsPage.jsx` | 2 | Load-more UI |
| `fe/src/features/moderator/reports/ReportsPage/ReportsPage.module.css` | 2 | `.loadMoreRow` |
| `fe/src/features/admin/payments/adminPaymentData.js` | 2 | `pageSize: 25` |
| `fe/src/features/admin/documents/adminDocumentData.js` | 2 | `pageSize: 25` |
| `fe/src/features/admin/exams/adminExamData.js` | 2 | `pageSize: 25` |
| `fe/src/features/admin/adminNavBadges.js` | 2 | Removed unused `listPayments(100)` call |
| `fe/src/features/moderator/content/contentModerationData.js` | 2 | `pageSize: 25` |
| `fe/src/features/moderator/content/contentModerationService.js` | 2 | Queue/history `pageSize: 25` |
| `fe/src/features/moderator/featured/featuredPostsData.js` | 2 | `pageSize: 25` |
| `fe/src/features/moderator/exams/moderatorExamService.js` | 2 | `pageSize: 25` |
| `fe/src/features/exams/examQuestionReportStore.js` | 2 | `pageSize: 25` |
| `fe/src/features/exams/practiceExamSubmissions.js` | 2 | Admin submission paths `pageSize: 25` |
| `fe/src/app/App.jsx` | 3 | `lazy()` for 20 admin + 12 moderator pages; `<Suspense>` wrapper |

---

## 2. Query Reduction

### Task 1 — Moderation batch mapping

| Endpoint / method | Before (per page of N items) | After |
|-------------------|------------------------------|-------|
| `GetReportsAsync` | N × (`GetByIdIncludingDeleted` + `GetById` reporter + `GetById` author) ≈ **3N** | 1 paged reports + 1 batch posts + 1 batch users ≈ **3** |
| `GetPostsAsync` (moderation) | N × (`GetById` author + `GetById` moderator + `GetByUserId` profile) ≈ **3N** | 1 paged posts + 1 batch users + 1 batch profiles ≈ **3** |
| `GetPracticeSubmissionsAsync` | N × (`GetById` user + `GetById` exam) ≈ **2N** | 1 paged + 1 batch users + 1 batch exams ≈ **3** |

**Example (25 reports):** ~75 DB round-trips → **3** batch queries.

Pattern mirrors Phase 1/2 `MapListItemsAsync` / `MapCommentsTreeAsync`.

### Task 2 — Admin pagination

| Area | Before | After |
|------|--------|-------|
| Admin/moderator list API calls | `pageSize: 100` (up to 100 rows per request) | `ADMIN_API_PAGE_SIZE = 25` |
| Reports (admin + moderator) | Single 100-row fetch | First page 25 + **“Tải thêm”** load-more |
| Nav badges | Extra `listPayments(100)` (unused) | Removed; stats from `getModerationStats` |

**Payload reduction:** up to **75%** fewer rows per initial admin list request.

---

## 3. Bundle Reduction

### Task 3 — Route-based code splitting

All admin (`/admin/*`) and moderator (`/moderator/*`) page components converted to `lazy(() => import(...))` with global `<Suspense fallback="Đang tải…">`.

**Vite production build (post-Phase 3):**

| Chunk | Size (min) | Gzip | Loaded when |
|-------|------------|------|-------------|
| `index-*.js` (main) | 789.7 kB | 228.2 kB | Every user |
| `AdminDashboardPage-*.js` | 395.4 kB | 115.4 kB | Admin only |
| `AdminGamificationConfigPage-*.js` | 28.1 kB | 5.8 kB | Admin only |
| `ReportsPage-*.js` | 19.5 kB | 5.2 kB | Moderator only |
| `ContentModerationPage-*.js` | 9.5 kB | 3.3 kB | Moderator only |
| … + ~30 more admin/mod chunks | — | — | Role-gated |

**Impact:** Regular students/guests no longer download ~**500–600 kB+** of admin/moderator JS on first paint. Admin dashboard chart bundle (~395 kB) is the largest deferred chunk.

---

## 4. Cache Impact

### Task 4 — Response caching

| Endpoint | Mechanism | TTL | Invalidation |
|----------|-----------|-----|--------------|
| `GET /api/v1/posts/featured` | ASP.NET `[ResponseCache]` + `UseResponseCaching()` | **60 s** | HTTP cache expiry |
| `GET /api/v1/admin/moderation/stats` | `IMemoryCache` in `ModerationService.GetStatsAsync` | **60 s** | `InvalidateModerationStatsCache()` on `ResolveReportAsync` |

**Expected effect:** Sidebar featured posts and moderator nav badges hit memory/HTTP cache instead of 5 parallel count queries per poll within the 60 s window.

**Note:** Featured cache is safe for anonymous reads; authenticated like-state is not on this endpoint.

---

## 5. DB Findings (Task 5)

### `PostRepository.GetPagedAsync` filters

```csharp
// semester / major — correlated subquery on UserProfiles
_context.UserProfiles.Any(up => up.UserId == p.AuthorId && up.Major == major)
_context.UserProfiles.Any(up => up.UserId == p.AuthorId && up.Semester == semester)
// status
p.Status == PostStatus.Published
```

### Existing indexes (pre-Phase 3)

- `Posts`: `CreatedAt`, `(Status, IsFeatured)`, `(Status, IsPinned)`
- `UserProfiles`: unique `UserId`
- `PostReports`: `Status`

### Gap analysis

| Query pattern | Issue | Migration added |
|---------------|-------|-----------------|
| Feed by `Status` + sort `CreatedAt` + author filters | `(Status, AuthorId, CreatedAt)` supports published feed ordering per author | `IX_Posts_Status_AuthorId_CreatedAt` |
| `UserProfiles` lookup by `Major` + `Semester` in EXISTS | No composite on filter columns | `IX_UserProfiles_Major_Semester` |
| Moderation reports by `Status` + date sort | Single-column `Status` index only | `IX_PostReports_Status_CreatedAt` |

**Migration:** `20260624153154_Phase3FeedIndexOptimization.cs` — apply with `dotnet ef database update` on deploy.

**Execution plan:** Live `EXPLAIN` against Supabase pooler was not run in this session; indexes align with EF filter predicates. Recommend verifying with `EXPLAIN ANALYZE` on production-like data after migration.

---

## 6. CodeGraph Findings

**Sync:** 32 changed files indexed (796 nodes).

| Query | Finding |
|-------|---------|
| `ModerationService` | `GetReportsAsync` → `MapReportsAsync`; `GetPostsAsync` → `MapModerationListItemsAsync` |
| `MapReportsAsync` | New batch method; replaces per-item `MapReportAsync` loop |
| `MapListItemsAsync` | Reference pattern in `PostService.cs:411` — same batch author/profile approach |
| `adminPaginationConstants` | `ADMIN_API_PAGE_SIZE` imported by 10+ admin/moderator data modules |
| `impact App.jsx` | Lazy imports isolate admin/mod bundles from main entry |
| `GetPagedAsync` | Multiple repositories; feed path uses `PostRepository.GetPagedAsync` |

### Dependency graph (moderation read path)

```
ModerationController
  → IModerationService.GetReportsAsync / GetPostsAsync / GetStatsAsync
    → IPostReportRepository.GetPagedAsync
    → IPostRepository.GetModerationPagedAsync / GetByIdsIncludingDeletedAsync
    → IUserRepository.GetByIdsAsync
    → IUserProfileRepository.GetByUserIdsAsync
    → IMemoryCache (stats only)
```

### Unused / dead code

| Item | Status |
|------|--------|
| `BuildModerationAuthorAsync` | **Removed** — replaced by sync `BuildModerationAuthor` |
| `attachCommentPreviews` default path (`feedData.js`) | Still dead for production feed (Phase 1) |
| `adminNavBadges` `listPayments(100)` | **Removed** (unused variable) |

### Duplicate mapping logic

| Pattern | Locations | Recommendation |
|---------|-----------|----------------|
| Batch list mapping | `PostService.MapListItemsAsync`, `CommentService.MapCommentsTreeAsync`, `ModerationService.MapReportsAsync` / `MapModerationListItemsAsync` | Future: shared `UserBatchResolver` helper (not done — minimize scope) |
| Admin report → moderator report | `adminReportData.js`, `reportsData.js` (`mapAdminReportToModeratorCommunityReport`) | Intentional FE adapter duplication |

### Performance hotspots (remaining)

| Hotspot | Severity | Notes |
|---------|----------|-------|
| `GetBannedUsersAsync` | Medium | Still N+1 per ban row |
| `GetViolatingUsersAsync` / `MapViolatingUserAsync` | Medium | Per-user ban/profile queries |
| `MapViolationHistoryAsync` | Low | Per-record actor lookup |
| `GetBannedUsersAsync` in list endpoints | Low | Typically small sets |

---

## 7. Regression Results

### Automated

| Suite | Result |
|-------|--------|
| Unit (`SEHub.Application.UnitTests`) | **94 / 94** pass |
| Integration (`SEHub.API.IntegrationTests`) | **69 / 69** pass |
| FE `npm run build` | ✅ Success |
| BE build (`dotnet build`) | ✅ Success (API process stopped for build) |

### Smoke test checklist (manual)

| Role | Area | Expected | Verified |
|------|------|----------|----------|
| Guest | `/` landing, `/community` feed | No admin JS chunks loaded; featured sidebar works | Build + routing ✅ |
| Student | `/home`, post detail | Main bundle only; comments lazy-load (Phase 2) | Tests ✅ |
| Premium | Premium routes | No regression | Tests ✅ |
| Moderator | `/moderator/reports`, content, featured | Lazy chunk load + 25-row pages + load-more | Implemented ✅ |
| Admin | `/admin`, moderation, payments | Lazy chunks + pagination footer + load-more | Implemented ✅ |

**Moderation resolve:** `ResolveReportAsync` clears stats cache — badge counts refresh within 60 s max stale window.

**Featured posts:** Second request within 60 s should return `304` / cached body (ResponseCache).

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Reports/payments lists show max 25 until “Tải thêm” | Load-more on admin + moderator reports; other lists use existing client pagination on first 25 rows |
| Featured `ResponseCache` may serve stale featured set for 60 s | Acceptable for sidebar; pin/unpin visible after TTL |
| Moderation stats cache stale up to 60 s after resolve | Invalidated on `ResolveReportAsync`; other actions (e.g. post approve) not invalidated — badge may lag |
| Migration on large `Posts` table | Index creation may lock briefly — run in maintenance window |
| `AdminDashboardPage` chunk still large (395 kB) | Deferred until admin visit; consider chart library split in Phase 4 |

---

## 9. Recommended Next Optimizations

1. **Batch `GetBannedUsersAsync` / `GetViolatingUsersAsync`** — same pattern as Task 1.
2. **Server-side pagination for payments/exams** — replace “first 25 + client slice” with page param wired to `AdminTableFooter`.
3. **Invalidate moderation stats** on `ModeratePostAsync` (pending posts count).
4. **CDN cache headers** for `GET /posts/featured` behind reverse proxy.
5. **Split Recharts** out of admin dashboard entry chunk.
6. **Run `EXPLAIN ANALYZE`** post-migration on feed queries with `major` + `semester` filters.
7. **Shared batch-mapping utility** in Application layer to reduce duplicate author/profile resolution code.

---

## Task Completion Matrix

| Task | CodeGraph verified | Tests | Status |
|------|-------------------|-------|--------|
| 1 — Moderation batch mapping | ✅ `MapReportsAsync`, `MapModerationListItemsAsync` | 94/94 | ✅ |
| 2 — Admin pagination 25 + UI | ✅ `ADMIN_API_PAGE_SIZE` imports | FE build | ✅ |
| 3 — Lazy admin/mod routes | ✅ `App.jsx` impact | FE build (40+ chunks) | ✅ |
| 4 — Response + memory cache | ✅ `ModerationService` + `PostsController` | 69/69 integration | ✅ |
| 5 — DB index audit + migration | ✅ `GetPagedAsync` + configs | Migration file | ✅ |

**Not committed** per instructions.
