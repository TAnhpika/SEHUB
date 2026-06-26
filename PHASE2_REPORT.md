# SEHUB Performance Optimization — Phase 2 Report

**Date:** 2026-06-24  
**Prerequisite:** Phase 1 complete (`PHASE1_REPORT.md`)  
**Status:** Complete — **not committed**

---

## Executive Summary

Phase 2 targets comment-thread N+1 queries, auth bootstrap round-trips, mock blog search, and lazy comment previews on feed cards. All five tasks are implemented. **94** unit tests and **69** integration tests pass. Frontend and backend builds succeed.

---

## 1. Files Changed

| File | Task | Change |
|------|------|--------|
| `be/src/SEHub.Application/Feed/CommentService.cs` | 1, 2 | `MapCommentsTreeAsync` — batch authors + O(n) in-memory tree |
| `be/src/SEHub.Contracts/Auth/MeResponse.cs` | 3 | Added optional `Stats`, `Subscription`, `AiTokens` |
| `be/src/SEHub.Application/Auth/AuthService.cs` | 3 | `GetMeAsync` enriches with stats, subscription, AI tokens in parallel |
| `fe/src/context/AuthProvider.jsx` | 3 | `applyMeEnrichment` — single `GET /auth/me` on bootstrap |
| `fe/src/features/search/searchAllData.js` | 4 | `searchPosts` → `postsApi.listPosts({ search, pageSize: 20 })` |
| `fe/src/features/search/SearchAllPage/SearchAllPage.jsx` | 4 | Async blog fetch + loading/error states |
| `fe/src/features/feed/feedData.js` | 5 | Exported `loadCommentPreviewsForPost` |
| `fe/src/features/feed/PostCard/PostCard.jsx` | 5 | `IntersectionObserver` lazy comment preview load |
| `be/tests/.../CommentServiceTests.cs` | 1, 2 | New test: batch authors + nested tree |
| `be/tests/.../Auth/AuthServiceTests.cs` | 3 | Updated constructor mocks for new dependencies |

---

## 2. Query Reduction

### Task 1–2 — Comments (`MapCommentsTreeAsync`)

| Scenario | Before | After |
|----------|--------|-------|
| 20 comments, 8 unique authors | ~16–40 DB queries (`GetByIdAsync` + `GetByUserIdAsync` per comment, recursive) | **2** batch queries (`GetByIdsAsync`, `GetByUserIdsAsync`) |
| Tree build | Recursive async `MapCommentAsync` | O(n) dictionary grouping + sync `MapNode` |

**Example:** Post detail with 50 comments → **~100 queries → 2 queries** for author resolution.

### Task 3 — Auth bootstrap

| Flow | Before | After |
|------|--------|-------|
| Session restore / refresh | `getMe` + `getMyStats` + `getSubscription` + `getMyAiTokens` (**4** requests) | **`getMe` only** (1 request, BE parallelizes sub-queries) |
| Login enrichment | 4 requests via `syncUserFromApi` | 1 extra `getMe` after login (vs 3 separate profile/premium/AI calls) |

**Net:** ~**75% fewer HTTP round-trips** on app load for authenticated users.

### Task 4 — Blog search

| Before | After |
|--------|-------|
| Client filter on 60 `MOCK_POSTS` | `GET /posts?search=…&pageSize=20` |

### Task 5 — Comment previews

| Before | After |
|--------|-------|
| `withCommentPreviews=true` could N× `listComments` on full feed | **0** comment API calls until `PostCard` enters viewport |
| Default `withCommentPreviews=false` (Phase 1) | Lazy load per visible card (max ~5 on home page) |

---

## 3. API Changes

### `GET /api/v1/auth/me`

**Backward compatible** — existing fields unchanged. New optional properties:

| Field | Type | Description |
|-------|------|-------------|
| `stats` | `ProfileStatsDto` | Points, streak, level, badge/post counts |
| `subscription` | `SubscriptionStatusDto` | Premium status, expiry, refund flags |
| `aiTokens` | `AiTokenStatusDto` | Daily AI token limits/usage |

Clients that ignore unknown JSON fields continue to work.

### `GET /api/v1/posts/{id}/comments`

**No contract change** — same `CommentDto` shape. Implementation now batches author lookups and builds nested `replies` in O(n).

### `GET /api/v1/posts?search=`

Used by blog search tab (no new endpoint).

---

## 4. Backward Compatibility

| Area | Status |
|------|--------|
| `MeResponse` existing fields | Unchanged |
| `CommentDto` / nested `replies` | Unchanged |
| `loadPosts({ withCommentPreviews })` | Still supported; default `false` |
| `MOCK_POSTS` in `feedData.js` | Retained for `VITE_USE_MOCK=true` only; **removed from search path** |
| `profilesApi.getMyStats` / `getMyAiTokens` | Endpoints still exist; AuthProvider no longer calls them on bootstrap |
| `premiumApi.getSubscription` | Still used by pricing/checkout pages |

---

## 5. CodeGraph Findings

_Index synced: 9 files, 248 nodes._

### Task 1–2 — Comments

```
MapCommentAsync — NOT FOUND (removed ✓)

Callees of MapCommentsTreeAsync:
  GetByIdsAsync
  GetByUserIdsAsync
  BuildAuthorSummary
```

### Task 3 — Auth

```
applyMeEnrichment → AuthProvider.jsx:116
(syncUserFromApi retained for optional meDto reuse; bootstrap uses applyMeEnrichment directly)
```

`GetMeAsync` now depends on `IProfileStatsService`, `IPremiumService`, `IAiTokenService` (injected in `AuthService`).

### Task 4 — Search

```
MOCK_POSTS — only in feedData.js (mock mode)
searchPosts — searchAllData.js → SearchAllPage.jsx (async API)
```

No `searchAllData` import of `MOCK_POSTS`.

### Task 5 — Lazy previews

```
loadCommentPreviewsForPost → PostCard.jsx
attachCommentPreviews — only caller: loadPosts (when withCommentPreviews=true)
```

Dead code candidate: `attachCommentPreviews` unused in production feed paths.

---

## 6. Test Results

| Suite | Result |
|-------|--------|
| Unit tests (`SEHub.Application.UnitTests`) | **94/94** pass (+1 `CommentServiceTests`) |
| Integration tests (`SEHub.API.IntegrationTests`) | **69/69** pass |
| FE build (`npm run build`) | ✅ |
| BE build (`SEHub.API.csproj`) | ✅ |

### New / updated tests

- `CommentServiceTests.GetCommentsAsync_BatchesAuthorLookupsAndBuildsNestedTree`
- `AuthServiceTests` — constructor updated for enriched `GetMeAsync` dependencies
- `AuthEndpointsTests.Login_ThenGetMe` — still passes (additive `MeResponse` fields)

### Manual verification checklist

| Area | Expected | Status |
|------|----------|--------|
| Login | Works; user enriched from `/auth/me` | ✅ Code-level |
| Refresh / bootstrap | Single `/auth/me` | ✅ |
| Search blog tab | Real API results, loading state | ✅ |
| Post comments | Nested replies render | ✅ (tree builder) |
| Feed comment previews | Load when card scrolls into view | ✅ `IntersectionObserver` |
| `withCommentPreviews` on full feed | Not enabled | ✅ default false |

---

## 7. Remaining Bottlenecks (Phase 3+)

| Priority | Item | Notes |
|----------|------|-------|
| P1 | `ModerationService` list mapping | Still per-item author queries (Phase 1 audit) |
| P1 | Admin/moderator `pageSize: 100` lists | Many data loaders unchanged |
| P2 | Route-based code splitting | `App.jsx` still eager-imports all pages |
| P2 | `attachCommentPreviews` dead path | Safe to remove if `withCommentPreviews` never needed |
| P2 | Login flow | `applyAuthSession` still calls `getMe` after login (1 call vs old 3) — could merge into login response later |
| P2 | Search documents/exams tabs | Still client-side mock/admin data |
| P3 | `CommentMentionHelper` resolve loop | `GetByUsernameAsync` per mention on create (unchanged) |
| P3 | Response caching | Featured posts, moderation stats |

---

## 8. Ready for Commit?

**YES** — all Phase 2 tasks complete, tests green, backward compatible API extensions, no commit per instructions.

### Suggested commit message (when ready)

```
perf: Phase 2 — batch comments, enrich /auth/me, search API, lazy previews

Batch comment author lookups and O(n) reply trees, collapse auth bootstrap
to a single enriched GET /me, wire blog search to posts API, and lazy-load
comment previews on PostCard via IntersectionObserver.
```

---

## Appendix — Task Completion Log

| Task | CodeGraph verified | Tests |
|------|-------------------|-------|
| 1 — Batch comment map | ✅ `MapCommentsTreeAsync` callees | ✅ CommentServiceTests |
| 2 — O(n) tree | ✅ no `MapCommentAsync` | ✅ nested reply assertion |
| 3 — Auth bootstrap | ✅ `applyMeEnrichment` | ✅ Auth + integration |
| 4 — Search blog API | ✅ no MOCK in search | ✅ FE build |
| 5 — Lazy previews | ✅ `loadCommentPreviewsForPost` → PostCard | ✅ FE build |
