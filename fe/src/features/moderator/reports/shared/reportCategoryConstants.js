/**
 * @fileoverview Hằng số phân loại và tab lọc cho hàng chờ báo cáo moderation.
 *
 * @module features/moderator/reports/shared/reportCategoryConstants
 */

/**
 * Danh sách tùy chọn lọc theo loại báo cáo trên UI Moderator.
 *
 * @constant {ReadonlyArray<{ id: string, label: string }>}
 * @readonly
 */
export const REPORT_CATEGORY_OPTIONS = [
  { id: "all", label: "Tất cả loại" },
  { id: "community", label: "Cộng đồng" },
  { id: "user", label: "Người dùng" },
  { id: "exam_question", label: "Câu hỏi đề" },
];

/**
 * Map khóa `category` → nhãn hiển thị tiếng Việt trên thẻ báo cáo.
 *
 * @constant {Readonly<Record<string, string>>}
 * @readonly
 */
export const REPORT_CATEGORY_LABELS = {
  community: "Cộng đồng",
  user: "Người dùng",
  exam_question: "Câu hỏi đề",
};

/**
 * Danh sách tab lọc theo trạng thái xử lý (pending / resolved / all).
 *
 * @constant {ReadonlyArray<{ id: string, label: string }>}
 * @readonly
 */
export const REPORT_TAB_OPTIONS = [
  { id: "pending", label: "Chờ xử lý" },
  { id: "resolved", label: "Đã xử lý" },
  { id: "all", label: "Tất cả" },
];

/**
 * Số lượng báo cáo tối đa fetch khi gộp hàng chờ moderation (exam + user).
 *
 * Đủ lớn để merge queue mà không cần phân trang phức tạp ở client.
 *
 * @constant {number}
 * @readonly
 * @default 100
 */
export const MODERATION_QUEUE_FETCH_SIZE = 100;
