import { MAJORS, SEMESTERS } from "@/features/posts/createPostData";

export const POSTS_PER_PAGE = 5;

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

export const FEATURED_POSTS = [
  "TOP 5 CÔNG CỤ AI NÊN DÙNG: BÍ QUYẾT BỨT PHÁ CHO DÂN IT 2025",
  "Hành Trình Học Tập Ấn Tượng Của Kim Khoa",
  "Từ Mông Lung Đến Bứt Phá Cùng AI: Hành Trình Của Hồng Phúc",
  "Vượt Qua Nỗi \"Hoang Mang Đại Học\" Cùng FTES",
  "Hành Trình Chạm Đến Top 5 Sinh Viên Xuất Sắc Của Chi Thông",
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

