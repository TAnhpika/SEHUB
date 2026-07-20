/**
 * @fileoverview Dữ liệu và dịch vụ quản lý bài viết nổi bật (ghim sidebar feed) cho Moderator.
 *
 * Module này cung cấp:
 * - Hằng số giới hạn ghim (`MAX_PINNED_POSTS`) và tùy chọn sắp xếp tìm kiếm.
 * - Dữ liệu mock bài đang ghim và pool tìm kiếm.
 * - Hàm lọc, enrich chi tiết, và gọi API `adminApi` / `postsApi` khi không mock.
 *
 * @module features/moderator/featured/featuredPostsData
 * @see {@link module:features/moderator/featured/FeaturedPostsPage} — trang UI quản lý ghim
 */

import * as postsApi from "@/api/postsApi";
import * as adminApi from "@/api/adminApi";
import { FEATURED_POSTS_UPDATED_EVENT } from "@/features/feed/feedData";
import { formatRelativeTimeFromApi } from "@/utils/dateTime";

/**
 * Số bài tối đa ghim lên sidebar “Bài viết nổi bật”.
 *
 * @constant {number}
 * @readonly
 * @default 5
 */
export const MAX_FEATURED_POSTS = 5;

/**
 * Số bài tối đa ghim đầu timeline feed.
 *
 * @constant {number}
 * @readonly
 * @default 5
 */
export const MAX_FEED_PINNED_POSTS = 5;

/**
 * Alias tương thích — cùng `MAX_FEATURED_POSTS` (sidebar).
 *
 * @constant {number}
 * @readonly
 */
export const MAX_PINNED_POSTS = MAX_FEATURED_POSTS;

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Tùy chọn sắp xếp kết quả tìm kiếm bài để ghim.
 *
 * @constant {ReadonlyArray<{ value: string, label: string }>}
 * @readonly
 */
export const FEATURE_SEARCH_SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "mostInteractions", label: "Nhiều tương tác nhất" },
];

/**
 * Alias deprecated của `FEATURE_SEARCH_SORT_OPTIONS` — giữ tương thích import cũ.
 *
 * @constant {ReadonlyArray<{ value: string, label: string }>}
 * @deprecated Dùng `FEATURE_SEARCH_SORT_OPTIONS`.
 * @readonly
 */
export const FEATURE_TAG_FILTERS = FEATURE_SEARCH_SORT_OPTIONS;

/**
 * Chuyển tag nội bộ sang nhãn danh mục hiển thị trên card bài nổi bật.
 *
 * @param {string} tag - Khóa tag (`document`, `hk231`, `announcement`, ...).
 * @returns {string} Nhãn tiếng Việt; mặc định `"Cộng đồng"`.
 *
 * @example
 * tagToCategoryLabel('announcement'); // => "Thông báo"
 */
export function tagToCategoryLabel(tag) {
  if (tag === "document") return "Tài liệu";
  if (tag === "hk231") return "Học kỳ 231";
  if (tag === "announcement") return "Thông báo";
  return "Cộng đồng";
}

/**
 * Map nội dung chi tiết đầy đủ theo ID — bổ sung cho card list khi xem panel (mock mode).
 *
 * @constant {Object<string, Object>}
 * @readonly
 */
export const FEATURED_POST_DETAILS = {
  "fp-1": {
    content: `Bộ tài liệu bao gồm đề thi tự luận, trắc nghiệm và đáp án chi tiết do các anh chị khóa trên tổng hợp.

Mình chia theo 3 phần:
- Lý thuyết hay gặp FE
- Đề mẫu 2022–2024
- Gợi ý ôn tập 2 tuần cuối

File PDF đính kèm bên dưới, mọi người tải về ôn nhé!`,
    semester: "HK231",
    major: "SE",
    studentId: "SE160221",
    tags: ["CO2013", "FE"],
    images: [
      { url: "https://picsum.photos/seed/sehub-co2013/960/480", alt: "đề CO2013", caption: "Ảnh 1" },
      { url: "https://picsum.photos/seed/sehub-prf-lab/720/405", alt: "Ảnh 2", caption: "Ảnh 2" }
    ],
    attachments: [{ id: "fp-att-3", name: "PRF192_midterm_slides.zip", sizeLabel: "3.4 MB", type: "zip" }],
    allowComments: true,
    anonymous: false,
  },
  "sp-1": {
    content: `Mình tổng hợp review các công ty thực tập đợt vừa rồi — môi trường, mentor, và cơ hội được học gì.

Công ty A: backend nhiều, mentor support tốt.
Công ty B: product thực tế, hơi áp lực deadline.

Ai cần thêm info inbox mình nhé!`,
    semester: "HK231",
    major: "SE",
    studentId: "SE150077",
    tags: ["Thực tập"],
    images: [],
    attachments: [],
    allowComments: true,
    anonymous: false,
  },
  "sp-2": {
    content: `Slide bài giảng tuần 5–7: Stack, Queue, Linked List và bài tập về nhà kèm đáp án tham khảo.

Lưu ý phần implement Queue bằng mảng vòng hay gặp ở FE.`,
    semester: "Fall 2025",
    major: "SE",
    studentId: "SE160000",
    tags: ["CSD"],
    images: [
      { url: "https://picsum.photos/seed/sehub-csd-slide/960/480", alt: "Slide CSD tuần 5–7", caption: "Ảnh 1" }
    ],
    attachments: [{ id: "sp-att-2", name: "CSD_week5-7.pdf", sizeLabel: "2.8 MB", type: "pdf" }],
    allowComments: true,
    anonymous: false,
  },
  "sp-3": {
    content: `Chia sẻ kinh nghiệm thi FE MAD Summer 2025 — pattern hay gặp và cách phân biệt Singleton vs Factory nhanh.

Mình attach mindmap pattern mình tự vẽ khi ôn.`,
    semester: "Summer 2025",
    major: "SE",
    studentId: "SE140556",
    tags: ["MAD", "FE"],
    images: [
      { url: "https://picsum.photos/seed/sehub-mad-map/720/405", alt: "Ảnh 1", caption: "Ảnh 1" }
    ],
    attachments: [],
    allowComments: true,
    anonymous: false,
  },
  "sp-4": {
    content: `Lịch đăng ký môn học học kỳ Fall 2025 đã được Ban Công tác sinh viên cập nhật.

Thời gian mở đăng ký: 15/08 – 22/08
Hướng dẫn đăng ký trên FAP: xem file PDF đính kèm.`,
    semester: "Fall 2025",
    major: "—",
    studentId: "—",
    tags: ["Thông báo", "ĐKMH"],
    images: [],
    attachments: [{ id: "sp-att-4", name: "Fall2025_registration.pdf", sizeLabel: "640 KB", type: "pdf" }],
    allowComments: false,
    anonymous: false,
  },
  "sp-5": {
    content: `Tài liệu ôn SWR302 tập trung Use case diagram và Sequence diagram — kèm template SRS team mình dùng đạt 8.5.

Phần mô tả luồng ngoại lệ nên viết rõ, đừng gộp chung happy path.`,
    semester: "Fall 2025",
    major: "SE",
    studentId: "SE160033",
    tags: ["SWR302"],
    images: [],
    attachments: [{ id: "sp-att-5", name: "SWR302_diagram_notes.docx", sizeLabel: "710 KB", type: "file" }],
    allowComments: true,
    anonymous: false,
  },
};

/**
 * Danh sách bài viết đang được ghim — dữ liệu mock ban đầu.
 *
 * @constant {ReadonlyArray<Object>}
 * @readonly
 */
export const PINNED_POSTS_INITIAL = [
  {
    id: "fp-1",
    authorName: "Trần Tuấn Anh",
    authorInitial: "TA",
    timeLabel: "2 ngày trước",
    categoryLabel: "Thông báo",
    tag: "announcement",
    title: "Tổng hợp đề thi cuối kỳ môn Kiến trúc máy tính (HK231)",
    excerpt:
      "Bộ tài liệu bao gồm đề thi tự luận, trắc nghiệm và đáp án chi tiết do các anh chị khóa trên…",
    likes: 124,
    comments: 32,
    status: "approved",
    isFeatured: true,
    isPinned: true,
  },
  {
    id: "fp-2",
    authorName: "Ban Đào Tạo",
    authorInitial: "BĐ",
    timeLabel: "1 tuần trước",
    categoryLabel: "Quan trọng",
    tag: "announcement",
    title: "Cập nhật quy chế thi thực hành môn Mạng máy tính",
    excerpt:
      "Sinh viên lưu ý quy định mới về việc sử dụng máy tính cá nhân trong phòng thi thực hành áp…",
    likes: 45,
    comments: 18,
    status: "approved",
    isFeatured: true,
    isPinned: false,
  },
  {
    id: "fp-3",
    authorName: "Nguyễn Thị B",
    authorInitial: "NB",
    timeLabel: "3 ngày trước",
    categoryLabel: "Tài liệu",
    tag: "document",
    title: "Slide ôn tập PRF192 — Midterm Summer 2025",
    excerpt:
      "Tổng hợp slide tuần 1–8 kèm bài tập thực hành và link repo GitHub tham khảo…",
    likes: 78,
    comments: 14,
    status: "approved",
    isFeatured: true,
    isPinned: false,
  },
];

/**
 * Mock bài đang ghim đầu feed (`IsPinned`).
 *
 * @constant {ReadonlyArray<Object>}
 * @readonly
 */
export const FEED_PINNED_POSTS_INITIAL = PINNED_POSTS_INITIAL.filter((post) => post.isPinned);

/**
 * Pool bài viết đã đăng có thể tìm kiếm để ghim — dữ liệu mock ban đầu.
 *
 * @constant {ReadonlyArray<Object>}
 * @readonly
 */
export const SEARCH_POSTS_INITIAL = [
  {
    id: "sp-1",
    authorName: "Lê Minh Khang",
    authorInitial: "LK",
    timeLabel: "3 giờ trước",
    tag: "hk231",
    title: "Review chi tiết các công ty thực tập đợt",
    excerpt: "Mình tổng hợp review các công ty thực tập đợt vừa rồi — môi trường, mentor…",
    likes: 89,
    comments: 12,
    status: "approved",
    sortOrder: 1,
  },
  {
    id: "sp-2",
    authorName: "Nguyễn Văn A",
    authorInitial: "NA",
    timeLabel: "Hôm qua",
    tag: "document",
    title: "Slide bài giảng Cấu trúc dữ liệu và giải thuật (tuần 5–7)",
    excerpt: "Slide bài giảng tuần 5–7: Stack, Queue, Linked List…",
    likes: 210,
    comments: 28,
    status: "approved",
    sortOrder: 3,
  },
  {
    id: "sp-3",
    authorName: "Phạm Hoàng C",
    authorInitial: "PC",
    timeLabel: "5 giờ trước",
    tag: "hk231",
    title: "Kinh nghiệm thi FE môn MAD — kỳ Summer 2025",
    excerpt: "Chia sẻ kinh nghiệm thi FE MAD Summer 2025 — pattern hay gặp…",
    likes: 56,
    comments: 9,
    status: "approved",
    sortOrder: 2,
  },
  {
    id: "sp-4",
    authorName: "Ban Công tác SV",
    authorInitial: "CT",
    timeLabel: "2 ngày trước",
    tag: "announcement",
    title: "Lịch đăng ký môn học học kỳ Fall 2025",
    excerpt: "Lịch đăng ký môn học học kỳ Fall 2025 đã được cập nhật…",
    likes: 132,
    comments: 41,
    status: "approved",
    sortOrder: 4,
  },
  {
    id: "sp-5",
    authorName: "Trịnh Văn D",
    authorInitial: "TD",
    timeLabel: "1 tuần trước",
    tag: "document",
    title: "Tài liệu ôn SWR302 — Use case & Sequence diagram",
    excerpt: "Tài liệu ôn SWR302 tập trung Use case diagram và Sequence diagram…",
    likes: 41,
    comments: 6,
    status: "approved",
    sortOrder: 5,
  },
];

/**
 * Tính tổng tương tác (likes + comments) của một bài — dùng sort `mostInteractions`.
 *
 * @param {Object} post - Bài viết có `likes` và `comments`.
 * @returns {number} Tổng lượt thích và bình luận.
 *
 * @example
 * getFeaturedInteractionCount({ likes: 10, comments: 5 }); // => 15
 */
export function getFeaturedInteractionCount(post) {
  return (post.likes ?? 0) + (post.comments ?? 0);
}

/**
 * Bổ sung metadata chi tiết cho card bài nổi bật — merge `FEATURED_POST_DETAILS` khi mock.
 *
 * @param {Object} post - Card bài từ danh sách ghim hoặc tìm kiếm.
 * @returns {Object} Bài đã enrich với `type`, `categoryLabel`, `comments` và chi tiết mock (nếu có).
 *
 * @example
 * const full = enrichFeaturedPost(pinned[0]);
 */
export function enrichFeaturedPost(post) {
  const extra = USE_MOCK ? (FEATURED_POST_DETAILS[post.id] ?? {}) : {};
  return {
    type: "post",
    categoryLabel: post.categoryLabel ?? tagToCategoryLabel(post.tag),
    comments: post.comments ?? 0,
    ...extra,
    ...post,
  };
}

/**
 * Tìm và enrich một bài theo ID từ các danh sách workspace ghim.
 *
 * @param {string} id - ID bài viết.
 * @param {...Object[]} lists - Các mảng (feedPinned, featured, searchPool, ...).
 * @returns {Object|null}
 */
export function findFeaturedPost(id, ...lists) {
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    const raw = list.find((item) => item.id === id);
    if (raw) return enrichFeaturedPost(raw);
  }
  return null;
}

/**
 * Lọc và sắp xếp pool tìm kiếm — tìm theo query, sort theo tương tác/thời gian.
 * Không loại bài đã ghim feed/sidebar (hiển thị chip trạng thái trên UI).
 *
 * @param {Object[]} posts - Pool bài ứng viên.
 * @param {Object} options - Tùy chọn lọc.
 * @param {string} options.query - Từ khóa tìm (tiêu đề, tác giả, excerpt).
 * @param {string} [options.sort="newest"] - `newest` | `oldest` | `mostInteractions`.
 * @param {Set<string>} [options.pinnedIds] - Deprecated; bỏ qua nếu truyền.
 * @returns {Object[]} Mảng bài sau lọc và sắp xếp.
 *
 * @example
 * filterSearchPosts(pool, { query: 'PRF192', sort: 'mostInteractions' });
 */
export function filterSearchPosts(posts, { query, sort = "newest" }) {
  const normalizedQuery = query.trim().toLowerCase();

  let result = posts.filter((post) => {
    if (!normalizedQuery) return true;

    const haystack = [post.title, post.authorName, post.excerpt].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  result = [...result].sort((a, b) => {
    if (sort === "mostInteractions") {
      return getFeaturedInteractionCount(b) - getFeaturedInteractionCount(a);
    }
    if (sort === "oldest") {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }
    return (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
  });

  return result;
}

/**
 * Map DTO API sang card bài nổi bật cho UI Moderator (nội bộ).
 *
 * @param {Object} dto - DTO từ `adminApi` hoặc `postsApi`.
 * @returns {Object} Card với `authorInitial`, `timeLabel`, `sortOrder`, ...
 */
function mapModeratorFeaturedItem(dto) {
  const createdMs = new Date(dto.createdAt).getTime();

  return {
    id: dto.id,
    authorName: dto.authorDisplayName || dto.authorUsername,
    authorInitial: (dto.authorDisplayName || dto.authorUsername || "?").charAt(0).toUpperCase(),
    timeLabel: formatRelativeTimeFromApi(dto.createdAt),
    categoryLabel: "Cộng đồng",
    tag: "document",
    title: dto.title,
    excerpt: dto.excerpt,
    likes: dto.likeCount ?? 0,
    comments: dto.commentCount ?? 0,
    status: "approved",
    sortOrder: Number.isNaN(createdMs) ? 0 : createdMs,
    isFeatured: dto.isFeatured ?? false,
    isPinned: dto.isPinned ?? false,
  };
}

/**
 * Gộp nhiều list DTO theo id, giữ cờ `isFeatured` / `isPinned`.
 *
 * @param {...Object[]} lists - Các mảng DTO/card.
 * @returns {Object[]}
 */
function mergeModeratorItemsById(...lists) {
  const byId = new Map();

  for (const list of lists) {
    for (const raw of list ?? []) {
      const item =
        raw.authorName != null
          ? { ...raw }
          : mapModeratorFeaturedItem(raw);
      const existing = byId.get(item.id);
      if (!existing) {
        byId.set(item.id, item);
        continue;
      }
      byId.set(item.id, {
        ...existing,
        ...item,
        isFeatured: Boolean(existing.isFeatured || item.isFeatured),
        isPinned: Boolean(existing.isPinned || item.isPinned),
      });
    }
  }

  return [...byId.values()];
}

/**
 * Tải workspace ghim kép: đầu feed + nổi bật sidebar + pool tìm kiếm chung.
 *
 * @async
 * @param {Object} [options]
 * @param {string} [options.search=""]
 * @returns {Promise<{ feedPinned: Object[], featured: Object[], searchPool: Object[], maxFeedPinned: number, maxFeatured: number }>}
 */
export async function loadPinWorkspaceState({ search = "" } = {}) {
  if (USE_MOCK) {
    return {
      feedPinned: FEED_PINNED_POSTS_INITIAL.map((post) => enrichFeaturedPost(post)),
      featured: PINNED_POSTS_INITIAL.map((post) => enrichFeaturedPost(post)),
      searchPool: mergeModeratorItemsById(
        SEARCH_POSTS_INITIAL,
        PINNED_POSTS_INITIAL,
        FEED_PINNED_POSTS_INITIAL,
      ),
      maxFeedPinned: MAX_FEED_PINNED_POSTS,
      maxFeatured: MAX_FEATURED_POSTS,
    };
  }

  const searchTerm = search.trim() || undefined;
  const pageSize = 50;
  const [featuredState, pinnedState] = await Promise.all([
    adminApi.getFeaturedPosts({ search: searchTerm, pageSize }),
    adminApi.getPinnedPosts({ search: searchTerm, pageSize }),
  ]);

  const featured = (featuredState.pinned ?? []).map((dto) =>
    mapModeratorFeaturedItem({ ...dto, isFeatured: true }),
  );
  const feedPinned = (pinnedState.pinned ?? []).map((dto) =>
    mapModeratorFeaturedItem({ ...dto, isPinned: true }),
  );

  const searchPool = mergeModeratorItemsById(
    featuredState.candidates ?? [],
    pinnedState.candidates ?? [],
    featuredState.pinned ?? [],
    pinnedState.pinned ?? [],
  ).map((item) => {
    const inFeatured = featured.some((post) => post.id === item.id);
    const inFeed = feedPinned.some((post) => post.id === item.id);
    return {
      ...item,
      isFeatured: inFeatured || item.isFeatured,
      isPinned: inFeed || item.isPinned,
    };
  });

  return {
    feedPinned,
    featured,
    searchPool,
    maxFeedPinned: pinnedState.maxPinned ?? MAX_FEED_PINNED_POSTS,
    maxFeatured: featuredState.maxPinned ?? MAX_FEATURED_POSTS,
  };
}

/**
 * Tải trạng thái bài nổi bật (sidebar) — giữ tương thích gọi cũ.
 *
 * @async
 * @param {Object} [options]
 * @param {string} [options.search=""]
 * @returns {Promise<{ pinned: Object[], searchPool: Object[] }>}
 */
export async function loadFeaturedPostsState({ search = "" } = {}) {
  const state = await loadPinWorkspaceState({ search });
  return {
    pinned: state.featured,
    searchPool: state.searchPool,
  };
}

/**
 * Tải chi tiết đầy đủ một bài nổi bật theo ID — cho panel xem trước khi ghim.
 *
 * @async
 * @param {string} id - ID bài viết.
 * @returns {Promise<Object|null>} Bài đã enrich; mock dùng `findFeaturedPost`, API gọi `postsApi.getPost`.
 *
 * @throws {Error} Khi API thất bại (caller có thể fallback list item).
 *
 * @example
 * const detail = await loadFeaturedPostDetail('fp-1');
 */
export async function loadFeaturedPostDetail(id) {
  if (USE_MOCK) {
    return findFeaturedPost(id, PINNED_POSTS_INITIAL, SEARCH_POSTS_INITIAL);
  }

  const dto = await postsApi.getPost(id);
  const card = mapModeratorFeaturedItem({
    id: dto.id,
    title: dto.title,
    excerpt: dto.excerpt,
    authorUsername: dto.author?.username,
    authorDisplayName: dto.author?.displayName,
    likeCount: dto.likeCount,
    commentCount: dto.commentCount,
    createdAt: dto.createdAt,
    isFeatured: dto.isFeatured,
    isPinned: dto.isPinned,
  });

  return enrichFeaturedPost({
    ...card,
    content: dto.content ?? dto.excerpt,
    tags: dto.tags ?? [],
    allowComments: true,
    anonymous: false,
  });
}

/**
 * Đánh dấu bài featured (ghim sidebar) qua API — no-op khi mock.
 *
 * @async
 * @param {string} id - ID bài viết.
 * @param {boolean} isFeatured - `true` ghim, `false` bỏ ghim.
 * @returns {Promise<void>}
 *
 * @throws {Error} Khi `postsApi.featurePost` thất bại.
 */
export async function setPostFeatured(id, isFeatured) {
  if (USE_MOCK) return;
  await postsApi.featurePost(id, { isFeatured });
  window.dispatchEvent(new CustomEvent(FEATURED_POSTS_UPDATED_EVENT));
}

/**
 * Đánh dấu bài pinned (ghim đầu feed) qua API — no-op khi mock.
 *
 * @async
 * @param {string} id - ID bài viết.
 * @param {boolean} isPinned - `true` ghim feed, `false` bỏ ghim.
 * @returns {Promise<void>}
 *
 * @throws {Error} Khi `postsApi.pinPost` thất bại.
 */
export async function setPostPinned(id, isPinned) {
  if (USE_MOCK) return;
  await postsApi.pinPost(id, { isPinned });
  window.dispatchEvent(new CustomEvent("sehub-feed-pinned-updated"));
}
