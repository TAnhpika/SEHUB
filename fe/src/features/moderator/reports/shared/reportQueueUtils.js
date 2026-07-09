/**
 * @fileoverview Tiện ích lọc, tìm kiếm và sắp xếp hàng chờ báo cáo moderation.
 *
 * @module features/moderator/reports/shared/reportQueueUtils
 */

import { REASON_META } from "@/features/moderator/reports/reportsData";
import { filterReports, sortModeratorReports } from "@/features/moderator/reports/reportsData";

/**
 * Trích xuất username tài khoản bị báo cáo, bỏ tiền tố `@` nếu có.
 *
 * @param {Object|null|undefined} report - Đối tượng báo cáo moderation.
 * @returns {string} Username không có `@`, hoặc chuỗi rỗng nếu không xác định được.
 *
 * @example
 * getReportedUsername({ category: 'user', reportedUser: { username: '@spam_acc' } });
 * // => 'spam_acc'
 */
export function getReportedUsername(report) {
  if (!report) return "";
  if (report.category === "community") return report.reportedUser ?? "";
  return report.reportedUser?.username?.replace(/^@/, "") ?? "";
}

/**
 * Tạo tiêu đề banner sau khi xử lý báo cáo, tùy theo loại báo cáo.
 *
 * @param {Object|null|undefined} resolved - Báo cáo vừa được resolve.
 * @returns {string} Tiêu đề hiển thị trên banner thông báo.
 *
 * @example
 * getResolvedBannerTitle({ category: 'community', postId: 'p-123' });
 * // => 'Đã xử lý báo cáo bài #p-123'
 */
export function getResolvedBannerTitle(resolved) {
  if (!resolved) return "Đã xử lý báo cáo";
  if (resolved.category === "community") return `Đã xử lý báo cáo bài #${resolved.postId}`;
  return `Đã xử lý báo cáo ${resolved.code ?? ""}`;
}

/**
 * Kiểm tra báo cáo có khớp từ khóa tìm kiếm hay không (không phân biệt hoa thường).
 *
 * Tìm trong: mã báo cáo, snippet, lý do, username, mã đề, tiêu đề bài viết, v.v.
 *
 * @param {Object} report - Đối tượng báo cáo cần kiểm tra.
 * @param {string} query - Từ khóa tìm kiếm; chuỗi rỗng luôn trả về `true`.
 * @returns {boolean} `true` nếu ít nhất một trường chứa từ khóa.
 *
 * @example
 * matchesReportSearch({ code: 'RP-4921', snippet: 'spam link' }, 'spam');
 * // => true
 */
export function matchesReportSearch(report, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return true;

  const reasonLabel = REASON_META[report.reason]?.label ?? report.reason ?? "";
  const fields = [
    report.code,
    report.snippet,
    report.reason,
    reasonLabel,
    report.postId,
    report.reporter,
    report.reportedUser,
    report.reporterUsername,
    report.reportedUser?.username,
    report.examId,
    report.post?.title,
    report.post?.excerpt,
  ];

  return fields
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
}

/**
 * @typedef {Object} FilterModerationReportsOptions
 * @property {string} tab - Tab trạng thái: `pending`, `resolved`, hoặc `all`.
 * @property {string} category - Loại báo cáo: `all`, `community`, `user`, `exam_question`.
 * @property {string} query - Từ khóa tìm kiếm tự do.
 */

/**
 * Lọc và sắp xếp danh sách báo cáo theo tab, loại và từ khóa.
 *
 * Pipeline: lọc trạng thái → lọc category → tìm kiếm → `sortModeratorReports`.
 *
 * @param {Array} reports - Danh sách báo cáo gốc.
 * @param {FilterModerationReportsOptions} options - Bộ lọc hiện tại.
 * @returns {Array} Danh sách báo cáo đã lọc và sắp xếp.
 *
 * @example
 * filterModerationReports(allReports, { tab: 'pending', category: 'user', query: 'spam' });
 */
export function filterModerationReports(reports, { tab, category, query }) {
  const statusFiltered = filterReports(reports, tab === "all" ? "all" : tab);
  const categoryFiltered =
    category === "all"
      ? statusFiltered
      : statusFiltered.filter((report) => report.category === category);
  const searched = query
    ? categoryFiltered.filter((report) => matchesReportSearch(report, query))
    : categoryFiltered;

  return sortModeratorReports(searched, tab);
}

/**
 * Chọn ID báo cáo pending tiếp theo sau khi resolve một báo cáo.
 *
 * Ưu tiên báo cáo `pending` đầu tiên (trừ báo cáo vừa resolve); nếu tab không phải pending
 * hoặc không còn pending, chọn báo cáo bất kỳ khác.
 *
 * @param {Array} reports - Danh sách báo cáo hiện tại.
 * @param {string} resolvedId - ID báo cáo vừa được xử lý (loại trừ khỏi kết quả).
 * @param {string} [tab='pending'] - Tab đang active.
 * @returns {string|null} ID báo cáo tiếp theo, hoặc `null` nếu hết.
 *
 * @example
 * pickNextPendingReportId(reports, 'rp-4921', 'pending');
 */
export function pickNextPendingReportId(reports, resolvedId, tab = "pending") {
  const pending = reports.filter((r) => r.status === "pending" && r.id !== resolvedId);
  if (tab === "pending" && pending.length > 0) {
    return pending[0].id;
  }
  return reports.find((r) => r.id !== resolvedId)?.id ?? null;
}
