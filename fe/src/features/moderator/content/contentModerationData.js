export const CONTENT_QUEUE_PAGE_SIZE = 4;

export const TYPE_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "post", label: "Bài viết" },
  { value: "comment", label: "Bình luận" },
];

export const CATEGORY_OPTIONS = [
  { value: "all", label: "Tất cả chuyên mục" },
  { value: "study", label: "Học tập" },
  { value: "review", label: "Review / Đánh giá" },
  { value: "event", label: "Sự kiện" },
  { value: "recruit", label: "Tuyển dụng" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất trước" },
  { value: "oldest", label: "Cũ nhất trước" },
];

export const TYPE_META = {
  post: { label: "Bài viết", tone: "primary" },
  comment: { label: "Bình luận", tone: "muted" },
};

export const STATUS_META = {
  pending: { label: "Chờ duyệt", tone: "warning" },
};

export const CONTENT_QUEUE_MOCK = [
  {
    id: "cq-1",
    type: "post",
    category: "study",
    title: "Hỏi về kinh nghiệm thi môn Cấu trúc dữ liệu",
    excerpt:
      "Mọi người cho mình hỏi môn Cấu trúc dữ liệu thi FE có khó không? Mình đang ôn theo slide của thầy...",
    tags: ["HHC TBP"],
    authorName: "Nguyễn Văn A",
    authorInitial: "NV",
    studentId: "SE160000",
    timeLabel: "10 phút trước",
    status: "pending",
    sortOrder: 1,
  },
  {
    id: "cq-2",
    type: "comment",
    category: "review",
    excerpt: "Thầy này dạy chán lắm, slide cũng cũ không cập nhật theo đề mới...",
    parentLabel: "Trả lời trong: Review GV Trần Văn B",
    authorName: "Trần Thị C",
    authorInitial: "TC",
    studentId: "SE150231",
    timeLabel: "25 phút trước",
    status: "pending",
    sortOrder: 2,
  },
  {
    id: "cq-3",
    type: "post",
    category: "event",
    title: "Tuyển thành viên tham gia Hackathon FPT 2024",
    excerpt:
      "Team mình đang tìm thêm 2 bạn backend và 1 bạn UI/UX cho cuộc thi Hackathon FPT 2024...",
    tags: ["SỰ KIỆN", "TUYỂN DỤNG"],
    authorName: "Lê Hoàng D",
    authorInitial: "LH",
    studentId: "SE140999",
    timeLabel: "1 giờ trước",
    status: "pending",
    sortOrder: 3,
  },
  {
    id: "cq-4",
    type: "comment",
    category: "study",
    excerpt: "+1, mình cũng đang kẹt phần này. Có ai share thêm tài liệu ôn không ạ?",
    parentLabel: "Trả lời trong: Hỏi về kinh nghiệm thi môn Cấu trúc dữ liệu",
    authorName: "Phạm Thị E",
    authorInitial: "PE",
    studentId: "SE160112",
    timeLabel: "2 giờ trước",
    status: "pending",
    sortOrder: 4,
  },
  {
    id: "cq-5",
    type: "post",
    category: "study",
    title: "Chia sẻ lộ trình học PRF192 trong 4 tuần",
    excerpt: "Mình vừa hoàn thành PRF192 với điểm A. Dưới đây là lịch học từng tuần...",
    tags: ["PRF192"],
    authorName: "Hoàng Minh F",
    authorInitial: "HF",
    studentId: "SE160045",
    timeLabel: "3 giờ trước",
    status: "pending",
    sortOrder: 5,
  },
  {
    id: "cq-6",
    type: "comment",
    category: "event",
    excerpt: "Team còn slot không ạ? Mình có kinh nghiệm React + Node.",
    parentLabel: "Trả lời trong: Tuyển thành viên tham gia Hackathon FPT 2024",
    authorName: "Vũ Thị G",
    authorInitial: "VG",
    studentId: "SE150887",
    timeLabel: "4 giờ trước",
    status: "pending",
    sortOrder: 6,
  },
  {
    id: "cq-7",
    type: "post",
    category: "review",
    title: "Review môn SWR302 — Project cuối kỳ",
    excerpt: "Môn Software Requirements khá nặng phần document. Ai đã học cho mình xin tips...",
    tags: ["SWR302"],
    authorName: "Đặng Văn H",
    authorInitial: "DH",
    studentId: "SE140221",
    timeLabel: "5 giờ trước",
    status: "pending",
    sortOrder: 7,
  },
  {
    id: "cq-8",
    type: "comment",
    category: "study",
    excerpt: "Slide tuần 5 có phần đệ quy hay bị hỏi trong FE, nên ôn kỹ nhé.",
    parentLabel: "Trả lời trong: Chia sẻ lộ trình học PRF192 trong 4 tuần",
    authorName: "Bùi Thị I",
    authorInitial: "BI",
    studentId: "SE160301",
    timeLabel: "6 giờ trước",
    status: "pending",
    sortOrder: 8,
  },
  {
    id: "cq-9",
    type: "post",
    category: "recruit",
    title: "Tuyển intern Frontend — startup EdTech",
    excerpt: "Công ty đối tác FPT đang tuyển intern React, làm việc hybrid 3 ngày/tuần...",
    tags: ["TUYỂN DỤNG"],
    authorName: "Ngô Văn K",
    authorInitial: "NK",
    studentId: "SE150012",
    timeLabel: "8 giờ trước",
    status: "pending",
    sortOrder: 9,
  },
  {
    id: "cq-10",
    type: "comment",
    category: "review",
    excerpt: "Mình đồng ý, phần use case diagram khó nhất trong môn này.",
    parentLabel: "Trả lời trong: Review môn SWR302 — Project cuối kỳ",
    authorName: "Lý Thị L",
    authorInitial: "LL",
    studentId: "SE160778",
    timeLabel: "10 giờ trước",
    status: "pending",
    sortOrder: 10,
  },
  {
    id: "cq-11",
    type: "post",
    category: "study",
    title: "Tổng hợp đề FE môn MAD — kỳ Summer 2025",
    excerpt: "Mình gom 3 đề FE gần nhất, có đáp án tham khảo (chưa verify 100%)...",
    tags: ["MAD", "FE"],
    authorName: "Trịnh Văn M",
    authorInitial: "TM",
    studentId: "SE140556",
    timeLabel: "12 giờ trước",
    status: "pending",
    sortOrder: 11,
  },
  {
    id: "cq-12",
    type: "comment",
    category: "recruit",
    excerpt: "Bạn gửi portfolio qua email nào trong JD vậy ạ?",
    parentLabel: "Trả lời trong: Tuyển intern Frontend — startup EdTech",
    authorName: "Phan Thị N",
    authorInitial: "PN",
    studentId: "SE150443",
    timeLabel: "1 ngày trước",
    status: "pending",
    sortOrder: 12,
  },
];

export function filterContentQueue(items, { query, typeTab, category, sort }) {
  const normalizedQuery = query.trim().toLowerCase();

  let result = items.filter((item) => {
    if (typeTab !== "all" && item.type !== typeTab) return false;
    if (category !== "all" && item.category !== category) return false;

    if (!normalizedQuery) return true;

    const haystack = [
      item.title,
      item.excerpt,
      item.parentLabel,
      item.authorName,
      item.studentId,
      ...(item.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  result = [...result].sort((a, b) =>
    sort === "oldest" ? a.sortOrder - b.sortOrder : b.sortOrder - a.sortOrder,
  );

  return result;
}
