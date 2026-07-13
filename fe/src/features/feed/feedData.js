import { MAJORS, SEMESTERS } from "@/features/posts/createPostData";
import * as postsApi from "@/api/postsApi";
import { mapComment, mapPostDetail, mapPostListItem } from "@/api/feedMapper";
import { isValidGuid } from "@/features/feed/postUtils";

export const POSTS_PER_PAGE = 5;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const AUTHORS = [
  { username: "lamnv_dev", club: "CLB JS Club", initial: "L" },
  { username: "minhpt_se", club: "FPT SE Community", initial: "M" },
  { username: "hoa_tran", club: "React Vietnam", initial: "H" },
  { username: "khoa_nguyen", club: "CLB JS Club", initial: "K" },
  { username: "vy_pham", club: "FPT SE Community", initial: "V" },
];

const TITLES = [
  "Workshop: Làm chủ React Hooks trong 2 giờ",
  "Chia sẻ kinh nghiệm thi PRF192 — điểm 9.5",
  "Tổng hợp đề ôn SWP391 cuối kỳ Spring 2026",
  "Tips debug JavaScript nhanh với Chrome DevTools",
  "Review lộ trình học Backend cho sinh viên năm 2",
  "Cách viết CV xin thực tập IT hiệu quả",
  "Thảo luận: So sánh Spring Boot vs Node.js cho đồ án",
  "Tài liệu SWR302 — slide + đề mẫu có lời giải",
  "Kinh nghiệm làm đồ án SWD — team 4 người",
  "Hỏi đáp về thuật toán Dijkstra và BFS",
  "Sự kiện hackathon FPT — đăng ký nhóm",
  "Checklist ôn thi môn PRN232 trong 1 tuần",
];

const TAG_SETS = [
  ["Sự kiện", "ReactJS"],
  ["Ôn thi", "PRF192"],
  ["Tài liệu", "SWP391"],
  ["Tips", "JavaScript"],
  ["Career", "Backend"],
  ["CV", "Internship"],
  ["Thảo luận", "Spring Boot"],
  ["Tài liệu", "SWR302"],
  ["Đồ án", "SWD"],
  ["Hỏi đáp", "DSA"],
  ["Sự kiện", "Hackathon"],
  ["Ôn thi", "PRN232"],
];

const TIMES = [
  "5 giờ trước",
  "8 giờ trước",
  "1 ngày trước",
  "2 ngày trước",
  "3 ngày trước",
  "5 ngày trước",
  "1 tuần trước",
];

export const FEATURED_POSTS_UPDATED_EVENT = "sehub-featured-posts-updated";

export const FEATURED_POSTS = [
  {
    title: "TOP 5 CÔNG CỤ AI NÊN DÙNG: BÍ QUYẾT BỨT PHÁ CHO DÂN IT 2025",
    url: "https://ftes.vn/vi/blogs/top-5-cong-cu-ai-nen-dung-bi-quyet-but-pha-cho-dan-it-2025",
  },
  {
    title: "Hành Trình Học Tập Ấn Tượng Của Kim Khoa",
    url: "https://ftes.vn/vi/blogs/hanh-trinh-hoc-tap-an-tuong-cua-kim-khoa",
  },
  {
    title: "Từ Mông Lung Đến Bứt Phá Cùng AI: Hành Trình Của Hồng Phúc",
    url: "https://ftes.vn/vi/blogs/tu-mong-lung-den-but-pha-cung-ai-hanh-trinh-cua-hong-phuc",
  },
  {
    title: "Vượt Qua Nỗi \"Hoang Mang Đại Học\" Cùng FTES",
    url: "https://ftes.vn/vi/blogs/vuot-qua-noi-hoang-mang-dai-hoc-cung-ftes",
  },
  {
    title: "Hành Trình Chạm Đến Top 5 Sinh Viên Xuất Sắc Của Chi Thông",
    url: "https://ftes.vn/vi/blogs/hanh-trinh-cham-den-top-5-sinh-vien-xuat-sac-cua-chi-thong",
  },
];

function buildExcerpt(title) {
  return `${title}. Nội dung bài viết được cộng đồng SEHub chia sẻ — thảo luận, hỏi đáp và cập nhật tài liệu mới nhất cho sinh viên FPT.`;
}

const PUBLISHED_DATES = [
  "16 tháng 5, 2026",
  "14 tháng 5, 2026",
  "12 tháng 5, 2026",
  "10 tháng 5, 2026",
  "8 tháng 5, 2026",
  "5 tháng 5, 2026",
  "1 tháng 5, 2026",
];

export const MOCK_POSTS = Array.from({ length: 60 }, (_, index) => {
  const author =
    index === 0
      ? { username: "anhcoding12345", club: "FPT SE Community", initial: "A" }
      : AUTHORS[index % AUTHORS.length];
  const title = index === 0 ? "Review LongNQ" : TITLES[index % TITLES.length];
  const excerpt =
    index === 0
      ? "Ai học rùi cho e xin feedback với ạ"
      : buildExcerpt(title);

  return {
    id: index + 1,
    author,
    title,
    excerpt,
    body: excerpt,
    tags: index === 0 ? ["Review"] : TAG_SETS[index % TAG_SETS.length],
    semester: SEMESTERS[index % SEMESTERS.length],
    major: MAJORS[index % MAJORS.length],
    timeAgo: TIMES[index % TIMES.length],
    publishedAt: PUBLISHED_DATES[index % PUBLISHED_DATES.length],
    likes: index === 0 ? 2 : 48 + (index % 80),
    comments: index === 0 ? 1 : 5 + (index % 24),
    views: index === 0 ? 15 : 320 + index * 17,
    commentsList:
      index === 0
        ? [
            {
              id: 1,
              author: { name: "Người dùng", initial: "N" },
              time: "21:23 16/05/2026",
              content: "Amazing teacher!",
            },
          ]
        : [],
  };
});

export function getPostById(postId) {
  const id = Number(postId);
  if (!Number.isFinite(id)) return null;
  return MOCK_POSTS.find((post) => post.id === id) ?? null;
}

export async function loadPosts(options = {}) {
  if (USE_MOCK) {
    return { items: [...MOCK_POSTS], totalCount: MOCK_POSTS.length };
  }

  const {
    page = 1,
    pageSize = 100,
    semester,
    major,
    tag,
    search,
  } = options;
  const data = await postsApi.listPosts({ page, pageSize, semester, major, tag, search });

  const items = (data.items ?? []).map(mapPostListItem);

  return {
    items,
    totalCount: data.totalCount ?? 0,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
  };
}

export async function loadPostById(postId) {
  if (USE_MOCK) {
    return getPostById(postId);
  }

  const id = String(postId ?? "").trim();
  if (!isValidGuid(id)) return null;

  const [detail, commentsResult] = await Promise.all([
    postsApi.getPost(id),
    postsApi.listComments(id, { page: 1, pageSize: 50 }),
  ]);

  const commentsList = (commentsResult.items ?? []).map(mapComment);
  return mapPostDetail(detail, commentsList);
}

export async function submitPost({ title, content, tags }) {
  if (USE_MOCK) {
    return {
      id: Date.now(),
      title,
      body: content,
      excerpt: content.slice(0, 200),
      tags: tags ?? [],
      author: { username: "mock", initial: "M" },
      likes: 0,
      comments: 0,
      views: 0,
      commentsList: [],
      images: [],
    };
  }

  const data = await postsApi.createPost({ title, content, tags });
  return mapPostDetail(data, []);
}

export async function savePost(postId, { title, content, tags }) {
  if (USE_MOCK) {
    return { id: postId, title, body: content, excerpt: content, tags: tags ?? [] };
  }

  const data = await postsApi.updatePost(postId, { title, content, tags });
  return mapPostDetail(data);
}

export async function removePost(postId) {
  if (USE_MOCK) return;
  await postsApi.deletePost(postId);
}

export async function toggleLike(postId, isLiked) {
  if (USE_MOCK) {
    return { isLiked: !isLiked, likeCount: 0 };
  }

  const data = isLiked ? await postsApi.unlikePost(postId) : await postsApi.likePost(postId);
  return { isLiked: data.isLiked, likeCount: data.likeCount };
}

export async function submitComment(postId, content, parentCommentId = null) {
  if (USE_MOCK) {
    return {
      id: Date.now(),
      content,
      author: { name: "Mock", initial: "M" },
      time: new Date().toISOString(),
      parentCommentId,
      replies: [],
    };
  }

  const body = { content };
  if (parentCommentId) {
    body.parentCommentId = parentCommentId;
  }

  const data = await postsApi.createComment(postId, body);
  return mapComment(data);
}

export async function saveComment(postId, commentId, content) {
  if (USE_MOCK) {
    return { id: commentId, content, replies: [] };
  }

  const data = await postsApi.updateComment(postId, commentId, { content });
  return mapComment(data);
}

export async function removeComment(postId, commentId) {
  if (USE_MOCK) return;
  await postsApi.deleteComment(postId, commentId);
}

export async function submitReport(postId, reason) {
  if (USE_MOCK) return;
  await postsApi.reportPost(postId, { reason });
}

export async function loadFeaturedSidebarPosts() {
  if (USE_MOCK) {
    return FEATURED_POSTS.map((post) => ({
      id: post.url,
      title: post.title,
      href: post.url,
      external: true,
    }));
  }

  try {
    const items = await postsApi.getFeaturedPosts();
    return (items ?? []).map((dto) => ({
      id: dto.id,
      title: dto.title,
      href: `/home/posts/${dto.id}`,
      external: false,
    }));
  } catch {
    return [];
  }
}

