export const REPORT_CATEGORY_OPTIONS = [
  { id: "all", label: "Tất cả loại" },
  { id: "community", label: "Cộng đồng" },
  { id: "user", label: "Người dùng" },
  { id: "exam_question", label: "Câu hỏi đề" },
];

export const REPORT_CATEGORY_LABELS = {
  community: "Cộng đồng",
  user: "Người dùng",
  exam_question: "Câu hỏi đề",
};

export const REPORT_TAB_OPTIONS = [
  { id: "pending", label: "Chờ xử lý" },
  { id: "resolved", label: "Đã xử lý" },
  { id: "all", label: "Tất cả" },
];

/** Fetch enough items for moderation queue merge (exam + user). */
export const MODERATION_QUEUE_FETCH_SIZE = 100;
