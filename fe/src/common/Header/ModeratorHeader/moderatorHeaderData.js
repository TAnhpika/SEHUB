/**
 * @fileoverview Dữ liệu và helper cho các dropdown trong `ModeratorHeader`.
 *
 * Module này định nghĩa:
 * - các lối tắt nghiệp vụ dành cho moderator,
 * - helper tải thông báo workflow cụ thể từ API (không dùng digest số lượng).
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
 * @property {boolean} [read] - Đã đọc hay chưa (từ API).
 */

/**
 * Danh sách lối tắt chính trong header moderator.
 *
 * @constant {ReadonlyArray<ModeratorQuickLink>}
 * @readonly
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
 * Trả về danh sách rỗng — chuông moderator chỉ hiện noti API cụ thể.
 *
 * @returns {Array<ModeratorHeaderNotification>}
 */
export function buildModeratorNotifications() {
  return [];
}

/**
 * Chuẩn hóa notification API thành item header moderator.
 *
 * Chỉ giữ moderation / exam review / welcome thuộc hàng đợi kiểm duyệt.
 * Loại trừ noti cá nhân (vd. `/home/feedback`).
 *
 * @param {Array<{ id: string | number, type?: string, title: string, body?: string, time: string, linkUrl?: string, read?: boolean }>} items
 * @returns {Array<ModeratorHeaderNotification>}
 */
function mapModeratorWorkflowNotifications(items) {
  return items
    .filter((item) => {
      const type = item.type === "moderation" || item.type === "examreview" || item.type === "moderatorwelcome";
      if (!type) return false;
      const link = String(item.linkUrl ?? "");
      if (link.startsWith("/home/")) return false;
      return true;
    })
    .map((item) => ({
      id: `notif-${item.id}`,
      title: item.title,
      detail: item.body || "Cần xử lý",
      time: item.time,
      to: item.linkUrl || "/moderator/reports",
      read: Boolean(item.read),
    }));
}

/**
 * Tải thông báo kiểm duyệt cụ thể từ API (từng sự kiện: ai đăng bài, ai báo cáo…).
 *
 * @returns {Promise<Array<ModeratorHeaderNotification>>}
 */
export async function loadModeratorNotifications() {
  try {
    const page = await getNotifications({ page: 1, pageSize: 40 });
    return mapModeratorWorkflowNotifications(mapNotificationPage(page).items);
  } catch {
    return [];
  }
}

/**
 * @returns {number}
 */
export function getModeratorUnreadCount() {
  return 0;
}

/**
 * Số chưa đọc cho chuông — ưu tiên unread API; fallback đếm item workflow chưa đọc vừa tải.
 *
 * @returns {Promise<number>}
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

  try {
    const items = await loadModeratorNotifications();
    return items.filter((item) => !item.read).length;
  } catch {
    return 0;
  }
}
