/**
 * @fileoverview Dữ liệu và helper cho các dropdown trong `ModeratorHeader`.
 *
 * Module này định nghĩa:
 * - các lối tắt nghiệp vụ dành cho moderator,
 * - danh sách thông báo fallback dựa trên badge hàng đợi,
 * - helper tải thông báo và số lượng chưa đọc từ API nếu có.
 *
 * @module common/Header/ModeratorHeader/moderatorHeaderData
 */

import {
  faClipboardCheck,
  faClipboardList,
  faClockRotateLeft,
  faFlag,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { getNotifications, getNotificationUnreadCount } from "@/api/notificationsApi";
import { mapNotificationPage } from "@/api/notificationsMapper";
import { getPendingPracticeSubmissionCount } from "@/features/exams/practiceExamSubmissions";
import { getModeratorNavBadgeCounts } from "@/features/moderator/moderatorNavData";

/**
 * @typedef {Object} ModeratorQuickLink
 * @property {string} id - Mã định danh lối tắt.
 * @property {string} label - Tên thao tác hiển thị trên dropdown.
 * @property {string} description - Mô tả ngắn về nghiệp vụ moderator tại đích đến.
 * @property {string} to - Route điều hướng khi chọn lối tắt.
 * @property {import('@fortawesome/fontawesome-svg-core').IconDefinition} icon - Icon Font Awesome đại diện cho lối tắt.
 */

/**
 * @typedef {Object} ModeratorHeaderNotification
 * @property {string} id - Mã định danh của thông báo/header item.
 * @property {string} title - Tiêu đề tóm tắt công việc chờ.
 * @property {string} detail - Mô tả nghiệp vụ cần moderator xử lý.
 * @property {string} time - Nhãn thời gian hoặc trạng thái hiển thị.
 * @property {string} to - Route điều hướng đến hàng đợi chi tiết.
 */

/**
 * Danh sách lối tắt chính trong header moderator.
 *
 * Moderator chỉ nhận các lối tắt phục vụ vận hành kiểm duyệt; không bao gồm cấu hình
 * hệ thống theo phân quyền nghiệp vụ nội bộ (§2.4).
 *
 * @constant {ReadonlyArray<ModeratorQuickLink>}
 * @readonly
 *
 * @example
 * MODERATOR_QUICK_LINKS.find((item) => item.id === "reports")?.to;
 * // => "/moderator/reports"
 */
export const MODERATOR_QUICK_LINKS = [
  {
    id: "reports",
    label: "Xử lý báo cáo",
    description: "Chấp thuận xóa / từ chối giữ nguyên",
    to: "/moderator/reports",
    icon: faFlag,
  },
  {
    id: "content",
    label: "Duyệt bài viết",
    description: "Pre-moderation trước khi đăng",
    to: "/moderator/content",
    icon: faClipboardCheck,
  },
  {
    id: "violations",
    label: "Tài khoản vi phạm",
    description: "Cảnh báo / khóa tạm 1 · 7 · 30 ngày",
    to: "/moderator/violations",
    icon: faUserSlash,
  },
  {
    id: "practice-submissions",
    label: "Bài nộp thực hành",
    description: "Chấm Đã xem / Đạt / Không đạt",
    to: "/moderator/practice-submissions",
    icon: faClipboardList,
  },
  {
    id: "content-history",
    label: "Lịch sử duyệt bài",
    description: "Xem lại quyết định kiểm duyệt",
    to: "/moderator/content/history",
    icon: faClockRotateLeft,
  },
];

/**
 * Xây dựng danh sách thông báo fallback từ badge moderation và số bài nộp thực hành.
 *
 * Đây là nguồn dữ liệu cục bộ giúp header vẫn hiển thị công việc chờ ngay cả khi
 * API thông báo chưa sẵn sàng hoặc trả lỗi. Các nhóm việc chính gồm báo cáo cộng đồng,
 * duyệt bài viết và chấm bài nộp thực hành.
 *
 * @returns {Array<ModeratorHeaderNotification>} Danh sách thông báo dành cho dropdown moderator.
 *
 * @example
 * const notifications = buildModeratorNotifications();
 * notifications.map((item) => item.title);
 */
export function buildModeratorNotifications() {
  const badges = getModeratorNavBadgeCounts();
  const practicePending = getPendingPracticeSubmissionCount();
  const items = [];

  if (badges.reports > 0) {
    items.push({
      id: "reports",
      title: `${badges.reports} báo cáo chờ xử lý`,
      detail: "Bài viết, bình luận, người dùng, chat và câu hỏi đề",
      time: "Cần xử lý",
      to: "/moderator/reports",
    });
  }

  if (badges.content > 0) {
    items.push({
      id: "content",
      title: `${badges.content} bài viết chờ duyệt`,
      detail: "Pre-moderation trước khi hiển thị công khai",
      time: "Duyệt nội dung",
      to: "/moderator/content",
    });
  }

  if (practicePending > 0) {
    items.push({
      id: "practice",
      title: `${practicePending} bài nộp thực hành chờ chấm`,
      detail: "Sinh viên Premium nộp GitHub / file",
      time: "Đề thi",
      to: "/moderator/practice-submissions",
    });
  }

  return items;
}

/**
 * Chuẩn hóa các notification từ API chung sang shape dùng trong header moderator.
 *
 * Chỉ các loại `moderation` và `examreview` mới được giữ lại vì chúng phản ánh trực
 * tiếp hàng đợi công việc của moderator.
 *
 * @param {Array<{ id: string | number, type?: string, title: string, body?: string, time: string, linkUrl?: string }>} items - Danh sách notification đã qua mapper tầng API.
 * @returns {Array<ModeratorHeaderNotification>} Danh sách đã lọc và chuẩn hóa cho UI header.
 */
function mapModeratorWorkflowNotifications(items) {
  return items
    .filter((item) => item.type === "moderation" || item.type === "examreview")
    .map((item) => ({
      id: `notif-${item.id}`,
      title: item.title,
      detail: item.body || "Cần xử lý",
      time: item.time,
      to: item.linkUrl || "/moderator/reports",
    }));
}

/**
 * Tải danh sách thông báo moderator từ API và fallback về badge queue khi cần.
 *
 * Luồng xử lý:
 * - gọi `getNotifications` trang đầu,
 * - map về domain notification của header moderator,
 * - nếu không có item workflow phù hợp hoặc API lỗi thì fallback sang `buildModeratorNotifications()`.
 *
 * @returns {Promise<Array<ModeratorHeaderNotification>>} Promise trả về danh sách thông báo để render dropdown.
 */
export async function loadModeratorNotifications() {
  try {
    const page = await getNotifications({ page: 1, pageSize: 20 });
    const workflow = mapModeratorWorkflowNotifications(mapNotificationPage(page).items);
    if (workflow.length > 0) {
      return workflow;
    }
  } catch {
    // fall back to queue badges below
  }

  return buildModeratorNotifications();
}

/**
 * Đếm số thông báo chưa đọc theo dữ liệu fallback cục bộ.
 *
 * @returns {number} Tổng số mục thông báo hiện có trong fallback queue.
 */
export function getModeratorUnreadCount() {
  return buildModeratorNotifications().length;
}

/**
 * Tải tổng số chưa đọc cho header moderator.
 *
 * Ưu tiên số unread do API trả về. Nếu API lỗi hoặc không có dữ liệu hợp lệ, module
 * sẽ dùng `getModeratorUnreadCount()` để giữ badge luôn có ý nghĩa với nghiệp vụ.
 *
 * @returns {Promise<number>} Promise tổng số thông báo chưa đọc hoặc việc chờ cần hiển thị trên badge.
 */
export async function loadModeratorUnreadCount() {
  try {
    const unread = await getNotificationUnreadCount();
    if (typeof unread?.totalUnread === "number" && unread.totalUnread > 0) {
      return unread.totalUnread;
    }
  } catch {
    // ignore
  }

  return getModeratorUnreadCount();
}
