# Featured Posts (Moderator) — Performance Investigation

**Date:** 2026-07-09  
**Page:** `/moderator/featured`  
**API:** `GET /api/v1/admin/moderation/featured-posts`

## Symptoms

Moderator trang "Bài viết nổi bật" load chậm — spinner "Đang tải bài viết…" kéo dài, đặc biệt trên Supabase remote.

## Hypothesis results

| ID | Hypothesis | Status | Evidence |
|----|-----------|--------|----------|
| H1 | N+1 query khi map từng bài | **Confirmed** | `MapFeaturedModeratorItemAsync` gọi 4 query/post (user, profile, like count, comment count) trong vòng `foreach` |
| H2 | FE gọi API trùng khi mount | **Confirmed** | `useEffect([])` + `useEffect([query])` debounce 350ms với `query=""` → 2 request giống nhau |
| H3 | Payload lớn (`pageSize=50`) | **Confirmed** | FE gửi 50 candidates; tăng số vòng N+1 |
| H4 | `CountAsync` + `Content.Contains` trên candidate query | **Confirmed** | Repository chạy count toàn bộ + scan content; UI không dùng total |
| H5 | Latency DB remote nhân query count | **Likely** | Supabase pooler ~100ms/query; 220+ queries/request → 20s+ |
| H6 | Lazy JS chunk | Rejected (minor) | Chỉ ảnh hưởng first paint, không phải API wait |

## Query count (before fix)

Với `pageSize=50`, `pinned=5`, `candidates=20` (sau khi giảm pageSize):

```
Per request (old):
  1  GetFeaturedAsync
  1  GetPublishedCandidatesForFeaturingAsync (list)
  1  CountAsync (candidates) — removed
  N × 4  MapFeaturedModeratorItemAsync  (N = pinned + candidates)

Example N=25 → ~103 SQL round-trips/request
FE mount → 2 requests → ~206 round-trips
```

## Query count (after fix)

```
Per request (new):
  1  GetFeaturedAsync
  1  GetPublishedCandidatesForFeaturingAsync
  4  batch per MapFeaturedModeratorItemsAsync call (likes, comments, users, profiles)
       × 2 lists (pinned batch + candidates batch) = 8 queries max

Example → ~10 SQL round-trips/request
FE mount → 1 request → ~10 round-trips
```

## Fixes applied

| Fix | File | Change |
|-----|------|--------|
| A — Batch map | `PostService.cs` | `MapFeaturedModeratorItemsAsync` dùng `CountByPostIdsAsync`, `GetByIdsAsync` |
| B — Single fetch | `FeaturedPostsPage.jsx` | Gộp 2 `useEffect`; debounce chỉ khi có search text |
| C — Smaller page | `featuredPostsData.js` | `pageSize: 50` → `20` |
| D — Lighter query | `PostRepository.cs` | Bỏ `CountAsync`; search title + author (bỏ `Content.Contains`); subquery author IDs |

## Verification

- Integration: `FeaturedPostsIntegrationTests` — 200 response + latency < 5s in-memory DB
- Manual: Network tab → 1 `featured-posts` request on page open
- Regression: `dotnet test --filter FeaturedPosts`

## Not in scope

- Cache `IMemoryCache` (Fix E) — defer unless still slow after batch
- `loadFeaturedPostDetail` extra `GET /posts/{id}` on card select — không ảnh hưởng initial load
