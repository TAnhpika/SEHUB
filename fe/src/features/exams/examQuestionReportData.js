/** §2.4 / §3.3 — Báo cáo lỗi câu hỏi ôn tập → Moderator rà soát, Admin duyệt đề */

export const EXAM_QUESTION_REPORT_REASONS = [
  { id: "wrong_answer", label: "Đáp án đúng bị ghi sai" },
  { id: "wrong_question", label: "Câu hỏi sai hoặc không rõ ràng" },
  { id: "typo", label: "Lỗi chính tả / format hiển thị" },
  { id: "duplicate", label: "Trùng câu hoặc trùng đáp án" },
  { id: "other", label: "Khác" },
];

export const EXAM_QUESTION_REASON_META = {
  wrong_answer: { label: "Đáp án sai", tone: "danger" },
  wrong_question: { label: "Câu hỏi sai", tone: "danger" },
  typo: { label: "Lỗi format", tone: "muted" },
  duplicate: { label: "Trùng câu", tone: "muted" },
  other: { label: "Khác", tone: "muted" },
};

export const EXAM_REPORT_ROUTING = {
  assigneeRole: "moderator",
  assigneeLabel: "Kiểm duyệt viên (Moderator)",
  escalationLabel: "Admin duyệt đề",
  description:
    "Báo cáo được gửi tới Moderator để rà soát câu hỏi/đáp án. Sau khi chỉnh sửa, Admin duyệt lại trước khi cập nhật công khai (§2.4, §2.5).",
};

export const MIN_EXAM_REPORT_DETAIL_LENGTH = 10;
