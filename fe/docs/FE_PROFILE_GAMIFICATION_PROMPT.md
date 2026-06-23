# SEHUB — Hoàn thiện Profile & Gamification (Cursor prompt)

> Dùng file này làm prompt cho Cursor Agent khi **bổ sung wire còn thiếu** cho module Profile/Gamification.  
> Nguồn: CodeGraph · `SEHUB_PhanTichNghiepVu.md` §3.6 · `ARCHITECTURE-BE.md` · audit branch `Hau_Authen_BE`

---

## Mục tiêu

Hoàn thiện **Giai đoạn 1 — P1** (trang cá nhân cơ bản, điểm + cấp độ, danh hiệu cơ bản, streak hiển thị) bằng cách gắn dữ liệu BE còn thiếu vào UI **đã có sẵn**.  
**Không** refactor layout, **không** phá các module đã wire (Auth, Feed, Exams, Documents, Premium, Admin).

---

## Trạng thái hiện tại

| Hạng mục | Trạng thái |
| -------- | ---------- |
| **Đã wire** | `loadProfileByUsername`, `loadProfileForm`, `saveMyProfile` → `profilesApi.js` khi `VITE_USE_MOCK !== "true"` |
| **Mapper một phần** | `profileMapper.js` — points/level/progress từ `ProfileDto` + `ProfileStatsDto`; hardcode `followers/following: 0`, `stats.exams/comments/posts: 0`, `joinedAgo/updatedAgo: "—"` |
| **Vẫn mock/static trên UI** | `ProfilePage` import `BADGES`, `RECENT_POSTS` cố định; `ActivityHeatmap` dùng `HEATMAP_DATA` giả |
| **BE sẵn sàng (không cần sửa trừ bug contract)** | `GET /api/v1/profiles/{username}`, `PUT /api/v1/profiles/me`, `GET /api/v1/profiles/me/stats` |
| **BE chưa có (P2 — không làm)** | Heatmap 6 tháng, Followers/Following, filter posts theo author, badge auto-award engine |
| **Admin gamification** | `adminGamificationData.js` đã có `hydrateGamificationFromApi()` cho levels/badges catalog (admin only) |

### Contract BE (tham chiếu)

```csharp
// ProfileDto
{ username, displayName, bio, avatarUrl, major, semester, points, levelName, badges[] }

// BadgeDto (chỉ badge đã đạt)
{ code, name, earnedAt }

// ProfileStatsDto (chỉ /profiles/me/stats — owner)
{ points, levelName, streakCount, nextLevelPoints, badgesCount }
```

**Lưu ý:** `GET /profiles/{username}` **yêu cầu đăng nhập** (`ForbiddenException` nếu guest). ProfilePage phải xử lý 401/403 (redirect login hoặc thông báo), không crash.

---

## Phạm vi IN / OUT

### ✅ IN (làm trong task này)

1. **BadgesSection** — merge catalog UI + badge đã đạt từ `ProfileDto.badges`
2. **RecentPosts** — load từ Feed API, lọc theo `author.username` (client-side)
3. **ProfileCard stats** — dùng `ProfileStatsDto` khi owner; cải thiện `totalActivities` / streak subtitle
4. **ActivityHeatmap** — **tắt lưới giả** khi không mock; empty state trung thực (P2)
5. **Auth context (tùy chọn, khuyến nghị)** — sau login/refresh, gọi `/profiles/me/stats` cập nhật `points`, `level`, `streak`, `levelProgress`, `pointsToNext` trên header/sidebar user menu
6. **Mock fallback** — giữ `VITE_USE_MOCK=true` hoạt động như hiện tại

### ❌ OUT (không làm — tránh regression)

| Không làm | Lý do |
| --------- | ----- |
| Sửa `fe/src/app/App.jsx` routes | Ràng buộc dự án |
| Thêm Redux / axios mới | Dùng `httpClient.js` + pattern hiện có |
| Wire heatmap 6 tháng thật | BE chưa có API (P2) |
| Wire Followers/Following | BE chưa có (P2) |
| Badge engine tự động trên BE | Chưa có `AwardBadge`; chỉ hiển thị badge có trong DB |
| 26 danh hiệu đầy đủ + mô tả từ BE | Admin catalog không public; giữ catalog tĩnh FE, merge `unlocked` |
| Sửa Feed/Exams/Documents/Premium/Admin logic đã wire | Chỉ **import tái sử dụng**, không đổi behavior |
| Thêm `author` query param vào `PostsController` | Tránh scope BE trừ khi client filter không đủ (xem bên dưới) |

---

## Ràng buộc BẮT BUỘC

### ĐƯỢC sửa / thêm

- `fe/src/api/profileMapper.js` — thêm `mapBadgesForSection`, `mapRecentPosts`, `formatRelativeTime` (nếu cần)
- `fe/src/features/profile/profileData.js` — thêm `loadProfileBadges`, `loadRecentPostsByUsername`; giữ export `BADGES` làm **catalog fallback**
- `fe/src/features/profile/ProfilePage/ProfilePage.jsx` — **tối thiểu**: state `badges`, `recentPosts`; `useEffect` fetch; truyền props thay vì import constant
- `fe/src/features/profile/ActivityHeatmap/ActivityHeatmap.jsx` — prop `useMockChart` hoặc `showChart` (default false khi API mode)
- `fe/src/context/AuthProvider.jsx` + `authMapper.js` — **chỉ** bổ sung sync stats (optional nhưng khuyến nghị)
- Tái sử dụng `loadPosts` từ `feedData.js` + `feedMapper` — **không** duplicate posts API

### KHÔNG được

- Đổi props/CSS className của `ProfileCard`, `BadgesSection`, `RecentPosts` (chỉ đổi **nguồn data**)
- Xóa mock constants — giữ cho `VITE_USE_MOCK=true`
- Gọi `/api/v1/admin/gamification/badges` từ ProfilePage (admin-only)
- Thay đổi `BadgesSection` grid layout hoặc thêm route mới

---

## Pattern chuẩn (giữ như Auth/Feed)

### 1) Data layer — `profileData.js`

```javascript
// Giữ signature; thêm loader mới
export async function loadProfileBadges(profileDto) {
  if (USE_MOCK) return BADGES;
  return mapBadgesForSection(BADGE_CATALOG, profileDto?.badges ?? []);
}

export async function loadRecentPostsByUsername(username, { limit = 5 } = {}) {
  if (USE_MOCK) return RECENT_POSTS;
  const { items } = await loadPosts({ page: 1, pageSize: 50 }); // tái dùng feedData
  return items
    .filter((p) => p.author?.username === username)
    .slice(0, limit)
    .map(mapProfileRecentPost);
}
```

### 2) Mapper — badges merge

Catalog tĩnh (10 badge P1) keyed by `code` hoặc `slug`. BE trả badge **đã đạt** — không có `description`.

```javascript
// profileMapper.js
export function mapBadgesForSection(catalog, earnedBadges = []) {
  const earnedCodes = new Set(earnedBadges.map((b) => b.code?.toLowerCase()));
  return catalog.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    unlocked: earnedCodes.has(item.code.toLowerCase()),
  }));
}
```

**Catalog mapping gợi ý** (align seed BE nếu có): map `code` FE ↔ `Badge.Code` BE (`first_post`, `first_exam`, …). Nếu BE seed khác tên, đối chiếu `be` migration/seed rồi cập nhật catalog **chỉ trong mapper**, không sửa component.

### 3) Mapper — recent posts

Shape `RecentPosts` expect: `{ id, title, date, comments, likes }`.

```javascript
export function mapProfileRecentPost(post) {
  return {
    id: post.id,
    title: post.title,
    date: formatPostDate(post.createdAt ?? post.time), // dd/MM/yyyy
    comments: post.comments ?? post.commentCount ?? 0,
    likes: post.likes ?? post.likeCount ?? 0,
  };
}
```

Dùng field từ `mapPostListItem` output — đọc `feedMapper.js` trước khi map, **không** đoán tên field.

### 4) ProfilePage — fetch song song

```javascript
const [profile, setProfile] = useState(null);
const [badges, setBadges] = useState([]);
const [recentPosts, setRecentPosts] = useState([]);

useEffect(() => {
  let cancelled = false;
  async function fetchAll() {
    setLoading(true);
    try {
      const dto = USE_MOCK ? null : await profilesApi.getProfileByUsername(username);
      const [card, badgeList, posts] = await Promise.all([
        loadProfileByUsername(username, { includeMyStats: isOwner }),
        loadProfileBadges(dto ?? { badges: [] }),
        loadRecentPostsByUsername(username),
      ]);
      if (!cancelled) {
        setProfile(card);
        setBadges(badgeList);
        setRecentPosts(posts);
      }
    } catch (err) { /* ... */ }
    finally { if (!cancelled) setLoading(false); }
  }
  fetchAll();
  return () => { cancelled = true; };
}, [username, isOwner]);
```

**Tối ưu:** tránh gọi `getProfileByUsername` 2 lần — refactor `loadProfileByUsername` nhận optional `profileDto` hoặc return `{ card, rawDto }` nếu cần badges từ cùng response.

### 5) ActivityHeatmap — không dữ liệu giả

Khi `!USE_MOCK`:

- Luôn hiển thị empty state: *"Biểu đồ hoạt động sẽ có trong bản cập nhật sau"* (hoặc giữ copy hiện tại nếu `totalActivities === 0`)
- **Không** render `HEATMAP_DATA.cells` fake khi đã wire API
- Subtitle vẫn có thể hiển thị streak: *"{streakCount} ngày streak"* từ stats (prop mới `streakCount`, tách khỏi `totalActivities`)

### 6) Auth sync stats (khuyến nghị)

Sau `login` / `refreshSession` / mount `AuthProvider` khi có token:

```javascript
const stats = await profilesApi.getMyStats();
// merge vào user: points, level, streak, levelProgress, pointsToNext
```

Dùng `computeProgress` từ `profileMapper.js` — **không** duplicate logic. Fail silently nếu 401.

---

## `profileMapper.js` — cải thiện tùy chọn (không bắt buộc P1)

| Field | Nguồn | Ghi chú |
| ----- | ----- | ------- |
| `stats.posts` | đếm `recentPosts.length` hoặc filter feed | Chỉ set nếu fetch posts thành công |
| `totalActivities` | `statsDto.streakCount` | **Không** dùng `badgesCount` làm proxy activity |
| `joinedAgo` / `updatedAgo` | — | BE chưa expose → giữ `"—"` |

---

## Admin Gamification (đã wire — chỉ verify)

- `hydrateGamificationFromApi()` — gọi khi vào trang admin gamification (đã có)
- **Không** dùng admin API cho ProfilePage user-facing
- Nếu sửa `adminGamificationData.js`, chỉ fix bug load/save levels — không đổi mock store shape

---

## Kiểm tra regression (BẮT BUỘC trước khi xong)

### Profile

- [ ] `VITE_USE_MOCK=false`: vào `/profile/{username}` đã login → card hiển thị points/level từ API
- [ ] Owner: progress bar / pointsToNext khớp `/profiles/me/stats`
- [ ] Badges: unlocked khớp badge user đã có trong DB; locked cho badge chưa đạt
- [ ] Recent posts: empty state khi user chưa đăng bài; có bài khi user đã tạo post trên Feed
- [ ] Heatmap: **không** hiện lưới xanh giả khi API mode
- [ ] `VITE_USE_MOCK=true`: toàn bộ trang giống behavior cũ (mock badges, posts, heatmap)
- [ ] Edit profile `/profile/edit` vẫn save được; không double-fetch lỗi

### Không phá module khác

- [ ] Login / logout / refresh token
- [ ] Feed list + create post (+10 điểm BE) — không sửa `feedData.js` behavior
- [ ] Premium checkout — không đụng `premiumApi.js`
- [ ] Admin dashboard — không đụng trừ gamification hydrate nếu cần
- [ ] `npm run build` pass
- [ ] `dotnet test -c Release` pass (nếu không sửa BE — vẫn phải pass)

### Tài khoản test

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `admin@sehub.local` | `Admin@123` |
| Student | `demo.student@sehub.local` | `Demo@12345` |

BE: `http://localhost:5006/api/v1` · FE: `http://localhost:5173`

---

## Thứ tự commit gợi ý (3 file/commit nếu user yêu cầu)

1. `profileMapper.js` — badges + recent post mappers  
2. `profileData.js` — loaders + catalog codes  
3. `ProfilePage.jsx` — wire state/fetch  
4. `ActivityHeatmap.jsx` — disable fake chart API mode  
5. `AuthProvider.jsx` + `authMapper.js` — stats sync (optional)

---

## Checklist hoàn thành

- [ ] Không còn import trực tiếp `BADGES` / `RECENT_POSTS` trong `ProfilePage` (chỉ qua loader)
- [ ] Mock mode không bị hỏng
- [ ] Không file nào ngoài `fe/src/api/**`, `fe/src/features/profile/**`, `fe/src/context/**` bị sửa trừ import path
- [ ] Không thay đổi BE
- [ ] Build + test pass

---

## Prompt ngắn (copy vào Cursor)

```
Hoàn thiện Profile/Gamification P1 theo fe/docs/FE_PROFILE_GAMIFICATION_PROMPT.md.

Wire badges (merge catalog + ProfileDto.badges), recent posts (filter loadPosts by author.username),
fix ActivityHeatmap không dùng HEATMAP_DATA giả khi VITE_USE_MOCK=false.
Tùy chọn: sync /profiles/me/stats vào AuthProvider sau login.

Ràng buộc: không sửa App.jsx routes, không phá Feed/Exams/Premium/Admin đã wire,
giữ VITE_USE_MOCK fallback, không sửa BE, npm run build + dotnet test pass.
Chỉ sửa profileMapper, profileData, ProfilePage, ActivityHeatmap, AuthProvider (nếu sync stats).
```
