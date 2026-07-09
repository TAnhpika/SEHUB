/**
 * @fileoverview Tiện ích tạo deep-link từ báo cáo moderation sang trang Tài khoản vi phạm.
 *
 * @module features/moderator/reports/shared/violationsLink
 */

/**
 * @typedef {Object} ModerationReportLinkSource
 * @property {string} [reportedUserId] - UUID tài khoản bị báo cáo.
 * @property {{ username?: string }} [reportedUser] - Đối tượng user bị báo cáo (có thể kèm `@`).
 * @property {string} [reporterReason] - Lý do chi tiết từ người báo cáo.
 * @property {string} [code] - Mã báo cáo (ví dụ `#RP-4921`).
 * @property {string} [reporterUsername] - Username người báo cáo (có thể kèm `@`).
 */

/**
 * Xây dựng URL deep-link tới `/moderator/violations` kèm query string ngữ cảnh báo cáo.
 *
 * Dùng khi Moderator escalate hoặc điều hướng từ chi tiết báo cáo sang trang xử lý vi phạm.
 * Nếu thiếu cả `userId` lẫn `username`, trả về đường dẫn gốc không có query.
 *
 * @param {ModerationReportLinkSource} report - Đối tượng báo cáo nguồn.
 * @returns {string} Đường dẫn tương đối, ví dụ `/moderator/violations?userId=...&username=...`.
 *
 * @example
 * buildViolationsHref({ reportedUserId: 'abc', code: '#RP-001', reporterReason: 'Spam' });
 * // => '/moderator/violations?userId=abc&reason=Spam&code=RP-001'
 */
export function buildViolationsHref(report) {
  const userId = report?.reportedUserId ?? null;
  const username = report?.reportedUser?.username?.replace(/^@/, "") ?? "";
  const reason = report?.reporterReason?.trim() ?? "";
  const code = report?.code?.replace(/^#/, "") ?? "";
  const reporter = report?.reporterUsername?.replace(/^@/, "") ?? "";

  if (!userId && !username) {
    return "/moderator/violations";
  }

  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (username) params.set("username", username);
  if (reason) params.set("reason", reason.slice(0, 500));
  if (code) params.set("code", code);
  if (reporter) params.set("reporter", reporter);

  return `/moderator/violations?${params.toString()}`;
}
