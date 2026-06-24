# SEHUB Performance Optimization — Phase 1 Report

**Date:** 2026-06-08  
**Branch:** `Hau_BE`  
**Status:** Complete — **not committed** (per instructions)

---

## Executive Summary

Phase 1 delivered four quick wins targeting feed load time and redundant API/storage calls. All unit and integration tests pass. Frontend and backend builds succeed. CodeGraph confirms callers, dependency changes, and removal of list-endpoint signed-URL generation.

---

## 1. Files Changed

| File | Task | Change |
|------|------|--------|
| `fe/src/features/feed/FeedPage/FeedPage.jsx` | 1 | Server-side pagination; refetch on page/semester/major; removed `filterPosts` |
| `fe/src/common/Sidebar/HomeSidebar/HomeSidebar.jsx` | 2 | Replaced `FEATURED_POSTS` mock with `FeaturedPostsPanel` |
| `fe/src/common/Sidebar/CommunitySidebar/CommunitySidebar.jsx` | 2 | Replaced `FEATURED_POSTS` mock with `FeaturedPostsPanel` |
| `be/src/SEHub.Application/Feed/PostService.cs` | 3, 4 | Batch `GetFeaturedAsync`; `ResolveListCoverImageUrl` for list mapping |
| `be/tests/SEHub.Application.UnitTests/Feed/PostServiceTests.cs` | 3, 4 | Added tests for list cover path + featured batch authors |

**Unchanged but verified:** `fe/src/features/home/HomePage/HomePage.jsx` (already on correct pattern — no regression).

---

## 2. APIs Affected

| Endpoint | Contract changed? | Behavior change |
|----------|-------------------|-----------------|
| `GET /api/v1/posts` | **No** (same DTO fields) | `coverImageUrl` on **list** items returns public path (`/uploads/...` or absolute URL) instead of async signed URL generation per item |
| `GET /api/v1/posts/{id}` | **No** | Detail still uses `ResolveCoverImageUrlAsync` for covers that need signing |
| `GET /api/v1/posts/featured` | **No** | Same response shape; fewer DB round-trips (batch author lookup) |
| `GET /api/v1/posts/images/{imageId}` | **No** | Unchanged; inline post images still use this path via `PostImageDto.ImagePath` |

---

## 3. Performance Improvements

### Task 1 — FeedPage aligned with HomePage

**Before**
- `loadPosts({ pageSize: 100 })` once on mount
- Client-side `filterPosts()` + slice pagination
- Up to **100 posts** transferred per visit; filters did not hit API

**After**
- `loadPosts({ page, pageSize: POSTS_PER_PAGE, semester, major })`
- Refetch when `currentPage`, `semesterFilter`, or `majorFilter` changes
- **5 posts** per request; filters applied server-side

**Impact:** ~**95%** reduction in feed payload for `/community`; eliminates wasted client filtering.

### Task 2 — Sidebar real data

**Before**
- `HomeSidebar` / `CommunitySidebar` rendered static `FEATURED_POSTS` mock (external URLs)

**After**
- Both use `FeaturedPostsPanel` → `loadFeaturedSidebarPosts()` → `GET /posts/featured` (max 10 items from BE)
- One request per sidebar mount; layouts are mutually exclusive (`MainLayout` vs `CommunityLayout`), so **no duplicate request on a single screen**

### Task 3 — Batch `GetFeaturedAsync`

**Before**
- Loop: `BuildAuthorAsync` per featured post → **2N** queries (user + profile per post)

**After**
- `GetByIdsAsync(authorIds)` + `GetByUserIdsAsync(authorIds)` once
- In-memory `BuildAuthorSummary` per post

**Impact:** **10 featured posts:** ~20 queries → **2** batch queries.

### Task 4 — Signed URL optimization (Option A)

**Before**
- `MapListItemsAsync`: `Task.WhenAll` × N → `ResolveCoverImageUrlAsync` → `IFileStorageService.GetSignedUrlAsync` per post with storage path

**After**
- `ResolveListCoverImageUrl` (sync): returns `https://...`, `/uploads/...`, or `/uploads/{relativePath}`
- `ResolveCoverImageUrlAsync` retained only for **post detail** (`MapDetailAsync`)

**Impact:** **0** storage signing calls on list endpoint; FE `resolveAssetUrl()` serves static `/uploads` paths via API host.

---

## 4. Remaining Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Covers stored only on non-local storage with path requiring signing | Low | Detail view still signs; list assumes `/uploads` or absolute CDN URL (matches current Cloudinary upload flow) |
| `FEATURED_POSTS` mock still in `feedData.js` | Low | Used only for `VITE_USE_MOCK=true` and moderator event constant — sidebars no longer import it |
| Running API locks DLLs during full solution build | Ops | Stop `SEHub.API` before `dotnet build` on full solution; unit test project builds independently |
| `filterPosts` in `feedFilterData.js` unused by feed pages | Low | Dead code for feed; safe to remove in a later cleanup |
| Post detail with legacy `posts/covers/` path on non-local storage | Low | Detail path unchanged; list now exposes `/uploads/posts/covers/...` which static files middleware serves locally |

---

## 5. CodeGraph Findings

_Index synced after changes (5 files, 134 nodes updated)._

### Task 1 — `loadPosts`

```
Callers of "loadPosts" (2):
  HomePage.jsx → fetchPosts
  FeedPage.jsx → fetchPosts
```

- `codegraph impact FeedPage.jsx` → isolated to FeedPage file only
- HomePage caller unchanged; same `loadPosts` signature and deps

### Task 2 — Featured sidebar

```
loadFeaturedSidebarPosts → FeaturedPostsPanel.jsx
```

- `FEATURED_POSTS` constant: no longer imported by `HomeSidebar` or `CommunitySidebar` (grep verified)
- Remaining references: `feedData.js` (mock mode), `FeaturedPostsPanel`, `featuredPostsData.js` (event only)

### Task 3 — `GetFeaturedAsync`

**Before sync:** callees included `BuildAuthorAsync` (N+1)  
**After sync:**

```
Callees of "GetFeaturedAsync":
  GetFeaturedAsync (PostRepository)
  GetByIdsAsync
  GetByUserIdsAsync
  BuildAuthorSummary
```

### Task 4 — Cover image flow

```
Callers of "ResolveCoverImageUrlAsync" (1):
  MapDetailAsync only

ResolveListCoverImageUrl → MapListItemsAsync (list endpoint)
```

`MapListItemsAsync` callees no longer include `ResolveCoverImageUrlAsync`.

---

## 6. Regression Test Results

### Per-task builds/tests

| Step | Backend build | Frontend build | Unit tests | Integration tests |
|------|---------------|----------------|------------|-------------------|
| After all tasks | `SEHub.API.csproj` ✅ | `npm run build` ✅ | **93/93** ✅ | **69/69** ✅ |

### Manual verification checklist

| Area | Expected behavior | Code-level status |
|------|-------------------|-------------------|
| HomePage | Server pagination 5/page, filter refetch | ✅ Already correct; unchanged |
| FeedPage (`/community`) | Same pattern as HomePage | ✅ Implemented |
| CommunityPage | Same as FeedPage (route index) | ✅ `/community` → `FeedPage` |
| Featured sidebar | API data, max 10 | ✅ `GetFeaturedAsync(10)` + `FeaturedPostsPanel` |
| Image rendering | `resolveAssetUrl` on `/uploads/...` and https | ✅ `feedMapper.js` unchanged |
| Pagination | Server `totalPages` | ✅ Both pages |
| Semester filter | API `semester` param | ✅ |
| Major filter | API `major` param | ✅ |

**Note:** Integration tests required stopping a running `SEHub.API` process (PID 10168) that locked output DLLs.

---

## 7. Estimated Latency Reduction

| Scenario | Before (est.) | After (est.) | Improvement |
|----------|---------------|--------------|-------------|
| `/community` first load | 100 posts + heavy BE mapping | 5 posts + batch mapping | **~80–95%** faster TTFB/payload |
| `/community` filter change | Client filter on 100 cached posts | 1 API call, 5 posts | Correctness + smaller response |
| Featured sidebar | Mock (0ms but wrong data) | 1 × `GET /featured` (~50–150ms) | Real data; 2 batch DB queries vs 20 |
| `GET /posts` list (5 items, storage covers) | 5 × `GetSignedUrlAsync` | 0 async storage calls | **~5–50ms** saved per list (env-dependent) |

**Overall user-visible:** Feed pages should move from multi-second (or ~1 min under load) toward **< 2s** on typical dev/staging network, assuming Supabase latency unchanged.

---

## 8. Ready for Commit?

**YES**

- All four tasks complete per spec
- No API contract breaking changes (field names unchanged)
- Business logic preserved (pagination, filters, featured limit, detail cover signing)
- **93** unit + **69** integration tests passing
- Frontend production build successful
- CodeGraph analysis documented
- **Not committed** — awaiting explicit commit request

### Suggested commit message (when ready)

```
perf(feed): Phase 1 quick wins — server pagination, featured batch, list cover paths

Align FeedPage with HomePage server-side filters/pagination, wire sidebars to
featured API, batch GetFeaturedAsync author lookups, and skip per-item signed
URL generation on post list responses.
```

---

## Appendix — Task Completion Log

| Task | CodeGraph verified | Tests run |
|------|-------------------|-----------|
| 1 — FeedPage sync | ✅ callers/impact | ✅ FE build |
| 2 — Sidebar API | ✅ loadFeaturedSidebarPosts trace | ✅ FE build |
| 3 — Batch featured | ✅ GetFeaturedAsync callees | ✅ +2 unit tests |
| 4 — List cover paths | ✅ ResolveCoverImageUrlAsync callers | ✅ +1 unit test, integration suite |
