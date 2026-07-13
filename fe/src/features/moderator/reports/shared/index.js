/**
 * @fileoverview Barrel export cho module shared của hàng chờ báo cáo moderation.
 *
 * Re-export constants, components, hooks và tiện ích lọc/tìm kiếm dùng chung
 * giữa `ReportsPage` và dashboard Admin.
 *
 * @module features/moderator/reports/shared
 */

/**
 * Trả về thông báo mô tả kết quả xử lý báo cáo đã resolve, theo loại và resolution.
 *
 * @param {Object|null|undefined} report - Báo cáo đã xử lý (`status === 'resolved'`).
 * @returns {string|null} Thông báo tiếng Việt, hoặc `null` nếu báo cáo chưa resolve.
 *
 * @example
 * getReportResolutionMessage({ status: 'resolved', resolution: 'deleted' });
 * // => 'Nội dung vi phạm đã được xóa.'
 */
export function getReportResolutionMessage(report) {
  if (!report || report.status !== "resolved") return null;

  if (report.category === "exam_question") {
    return report.resolution === "resolved_exam"
      ? "Admin đã ghi nhận xử lý đề thi."
      : "Báo cáo đã bỏ qua — câu hỏi được giữ nguyên.";
  }

  if (report.category === "user") {
    if (report.resolution === "escalated_violations") {
      return "Đã chuyển tài khoản sang trang Tài khoản vi phạm.";
    }
    if (report.resolution === "warned") {
      return "Đã gửi cảnh báo và đóng báo cáo.";
    }
    if (String(report.resolution ?? "").includes("banned")) {
      return "Tài khoản đã bị khóa và báo cáo đã đóng.";
    }
    return "Báo cáo đã được ghi nhận";
  }

  if (report.resolution === "deleted") return "Nội dung vi phạm đã được xóa.";
  if (report.resolution === "forwarded_admin") {
    return "Moderator đã ghi nhận và chuyển Admin duyệt chỉnh sửa đề.";
  }

  return "Báo cáo đã bỏ qua — nội dung được giữ nguyên.";
}

export {
  REPORT_CATEGORY_LABELS,
  REPORT_CATEGORY_OPTIONS,
  REPORT_TAB_OPTIONS,
  MODERATION_QUEUE_FETCH_SIZE,
} from "./reportCategoryConstants";
export { default as ReasonTag } from "./ReasonTag";
export { buildViolationsHref } from "./violationsLink";
export {
  filterModerationReports,
  getReportedUsername,
  getResolvedBannerTitle,
  matchesReportSearch,
  pickNextPendingReportId,
} from "./reportQueueUtils";
export { useModerationReportsQueue } from "./useModerationReportsQueue";
