export const MAX_PINNED_POSTS = 5;

export const FEATURE_TAG_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "hk231", label: "Học kỳ 231" },
  { value: "document", label: "Tài liệu" },
  { value: "announcement", label: "Thông báo" },
];

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
    likes: 89,
  },
  {
    id: "sp-2",
    authorName: "Nguyễn Văn A",
    authorInitial: "NA",
    timeLabel: "Hôm qua",
    tag: "document",
    title: "Slide bài giảng Cấu trúc dữ liệu và giải thuật (tuần 5–7)",
    likes: 210,
  },
  {
    id: "sp-3",
    authorName: "Phạm Hoàng C",
    authorInitial: "PC",
    timeLabel: "5 giờ trước",
    tag: "hk231",
    title: "Kinh nghiệm thi FE môn MAD — kỳ Summer 2025",
    likes: 56,
  },
  {
    id: "sp-4",
    authorName: "Ban Công tác SV",
    authorInitial: "CT",
    timeLabel: "2 ngày trước",
    tag: "announcement",
    title: "Lịch đăng ký môn học học kỳ Fall 2025",
    likes: 132,
  },
  {
    id: "sp-5",
    authorName: "Trịnh Văn D",
    authorInitial: "TD",
    timeLabel: "1 tuần trước",
    tag: "document",
    title: "Tài liệu ôn SWR302 — Use case & Sequence diagram",
    likes: 41,
  },
];

export function filterSearchPosts(posts, { query, tagFilter, pinnedIds }) {
  const normalizedQuery = query.trim().toLowerCase();

  return posts.filter((post) => {
    if (pinnedIds.has(post.id)) return false;
    if (tagFilter !== "all" && post.tag !== tagFilter) return false;

    if (!normalizedQuery) return true;

    const haystack = [post.title, post.authorName].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
