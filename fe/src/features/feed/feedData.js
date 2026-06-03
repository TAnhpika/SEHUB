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

export const MOCK_POSTS = Array.from({ length: 60 }, (_, index) => {
  const author = AUTHORS[index % AUTHORS.length];
  const title = TITLES[index % TITLES.length];
  return {
    id: index + 1,
    author,
    title,
    excerpt: buildExcerpt(title),
    tags: TAG_SETS[index % TAG_SETS.length],
    timeAgo: TIMES[index % TIMES.length],
    likes: 48 + (index % 80),
    comments: 5 + (index % 24),
    views: 320 + index * 17,
  };
});
