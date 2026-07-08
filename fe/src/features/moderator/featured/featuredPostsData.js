import * as postsApi from "@/api/postsApi";
import * as adminApi from "@/api/adminApi";
import { FEATURED_POSTS_UPDATED_EVENT } from "@/features/feed/feedData";
import { formatRelativeTimeFromApi } from "@/utils/dateTime";

export const MAX_PINNED_POSTS = 5;

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const FEATURE_SEARCH_SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "mostInteractions", label: "Nhiều tương tác nhất" },
];

/** @deprecated — dùng FEATURE_SEARCH_SORT_OPTIONS */
export const FEATURE_TAG_FILTERS = FEATURE_SEARCH_SORT_OPTIONS;

export function tagToCategoryLabel(tag) {
  if (tag === "document") return "Tài liệu";
  if (tag === "hk231") return "Học kỳ 231";
  if (tag === "announcement") return "Thông báo";
  return "Cộng đồng";
}

/** Nội dung đầy đủ theo id — dùng cho panel xem chi tiết (mock) */
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
    coverImage: {
      url: "https://picsum.photos/seed/sehub-co2013/960/480",
      alt: "Ảnh bìa — đề CO2013",
    },
    attachments: [{ id: "fp-att-1", name: "CO2013_FE_HK231.pdf", sizeLabel: "5.1 MB", type: "pdf" }],
    allowComments: true,
    anonymous: false,
  },
  "fp-2": {
    content: `Sinh viên lưu ý quy định mới về việc sử dụng máy tính cá nhân trong phòng thi thực hành áp dụng từ kỳ Fall 2025.

Điểm chính:
- Không cài phần mềm lạ trước giờ thi
- Phải login tài khoản FPT cấp
- Vi phạm sẽ bị hủy kết quả thi

Chi tiết xem file đính kèm hoặc hỏi bên dưới.`,
    semester: "Fall 2025",
    major: "SE",
    studentId: "—",
    tags: ["MAN201", "Thông báo"],
    coverImage: null,
    attachments: [{ id: "fp-att-2", name: "MAN201_lab_rules.pdf", sizeLabel: "820 KB", type: "pdf" }],
    allowComments: true,
    anonymous: false,
  },
  "fp-3": {
    content: `Tổng hợp slide tuần 1–8 kèm bài tập thực hành và link repo GitHub tham khảo.

Phần khó nhất theo mình là Collections và Exception handling — nên ôn thêm lab 4–6.

Chúc mọi người thi tốt!`,
    semester: "Summer 2025",
    major: "SE",
    studentId: "SE160088",
    tags: ["PRF192"],
    coverImage: {
      url: "https://picsum.photos/seed/sehub-prf-slide/960/480",
      alt: "Slide PRF192",
    },
    inlineImages: [
      { url: "https://picsum.photos/seed/sehub-prf-lab/720/405", caption: "Screenshot lab ArrayList" },
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
    coverImage: null,
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
    coverImage: {
      url: "https://picsum.photos/seed/sehub-csd-slide/960/480",
      alt: "Slide CSD tuần 5–7",
    },
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
    coverImage: null,
    inlineImages: [
      { url: "https://picsum.photos/seed/sehub-mad-map/720/405", caption: "Mindmap design pattern" },
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
    coverImage: null,
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
    coverImage: null,
    attachments: [{ id: "sp-att-5", name: "SWR302_diagram_notes.docx", sizeLabel: "710 KB", type: "file" }],
    allowComments: true,
    anonymous: false,
  },
};

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
  },
];

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

export function getFeaturedInteractionCount(post) {
  return (post.likes ?? 0) + (post.comments ?? 0);
}

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

export function findFeaturedPost(id, pinned, searchPool) {
  const raw = pinned.find((item) => item.id === id) ?? searchPool.find((item) => item.id === id);
  return raw ? enrichFeaturedPost(raw) : null;
}

export function filterSearchPosts(posts, { query, sort = "newest", pinnedIds }) {
  const normalizedQuery = query.trim().toLowerCase();

  let result = posts.filter((post) => {
    if (pinnedIds.has(post.id)) return false;

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
  };
}

export async function loadFeaturedPostsState({ search = "" } = {}) {
  if (USE_MOCK) {
    return {
      pinned: PINNED_POSTS_INITIAL,
      searchPool: SEARCH_POSTS_INITIAL,
    };
  }

  const state = await adminApi.getFeaturedPosts({
    search: search.trim() || undefined,
    pageSize: 20,
  });
  const pinned = (state.pinned ?? []).map(mapModeratorFeaturedItem);
  const searchPool = (state.candidates ?? []).map(mapModeratorFeaturedItem);

  return { pinned, searchPool };
}

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
  });

  return enrichFeaturedPost({
    ...card,
    content: dto.content ?? dto.excerpt,
    tags: dto.tags ?? [],
    allowComments: true,
    anonymous: false,
  });
}

export async function setPostFeatured(id, isFeatured) {
  if (USE_MOCK) return;
  await postsApi.featurePost(id, { isFeatured });
  window.dispatchEvent(new CustomEvent(FEATURED_POSTS_UPDATED_EVENT));
}

export async function setPostPinned(id, isPinned) {
  if (USE_MOCK) return;
  await postsApi.pinPost(id, { isPinned });
  window.dispatchEvent(new CustomEvent("sehub-feed-pinned-updated"));
}
