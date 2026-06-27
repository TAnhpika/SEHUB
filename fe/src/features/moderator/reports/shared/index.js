export function getReportResolutionMessage(report) {
  if (!report || report.status !== "resolved") return null;

  if (report.category === "exam_question") {
    return report.resolution === "resolved_exam"
      ? "Admin đã ghi nhận xử lý đề thi."
      : "Báo cáo đã bỏ qua — câu hỏi được giữ nguyên.";
  }

  if (report.category === "user") {
    return String(report.resolution ?? "").includes("banned")
      ? "Tài khoản đã bị khóa và báo cáo đã đóng."
      : "Báo cáo đã bỏ qua.";
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
export {
  filterModerationReports,
  getReportedUsername,
  getResolvedBannerTitle,
  matchesReportSearch,
  pickNextPendingReportId,
} from "./reportQueueUtils";
export { useModerationReportsQueue } from "./useModerationReportsQueue";
