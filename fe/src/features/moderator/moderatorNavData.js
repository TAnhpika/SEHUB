/**
 * @fileoverview Cấu hình điều hướng sidebar và tiện ích meta trang khu vực Moderator SEHUB.
 *
 * Module định nghĩa:
 * - Đường dẫn mặc định sau đăng nhập moderator.
 * - Cấu trúc menu sidebar theo nhóm nghiệp vụ (Cộng đồng, Tài khoản, Đề thi).
 * - Hàm resolve tiêu đề trang, trạng thái active nav và badge đếm hàng đợi.
 *
 * @module features/moderator/moderatorNavData
 */

import {
  faClipboardCheck,
  faClipboardList,
  faClockRotateLeft,
  faFileCirclePlus,
  faFlag,
  faInbox,
  faStar,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import * as adminApi from "@/api/adminApi";
import { getPendingContentCount } from "@/features/moderator/content/contentModerationStore";
import { syncCachedPendingContentCount } from "@/features/moderator/content/contentModerationService";
import {
  getCommunityReportsPendingCount,
  syncCachedPendingReportsCount,
} from "@/features/moderator/reports/reportsData";

/**
 * Cờ dùng mock data thay vì gọi API thật (`VITE_USE_MOCK=true`).
 *
 * @constant {boolean}
 * @readonly
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Đường dẫn mặc định sau đăng nhập Moderator — hàng đợi báo cáo ưu tiên nghiệp vụ.
 *
 * @constant {string}
 * @readonly
 * @default '/moderator/reports'
 */
export const MODERATOR_HOME_PATH = "/moderator/reports";

/**
 * @typedef {Object} ModeratorNavItem
 * @property {string} id - Khóa định danh mục menu (dùng cho badge, analytics).
 * @property {string} label - Nhãn hiển thị trên sidebar.
 * @property {string} to - Đường dẫn React Router.
 * @property {import('@fortawesome/fontawesome-svg-core').IconDefinition} icon - Icon Font Awesome cho mục menu.
 * @property {string} [badgeKey] - Khóa tra badge count trong `getModeratorNavBadgeCounts` (`reports`, `content`).
 * @property {boolean} end - `true` nếu chỉ active khi pathname khớp chính xác `to` (không match prefix con).
 */

/**
 * @typedef {Object} ModeratorNavSection
 * @property {string} title - Tiêu đề nhóm menu (Cộng đồng, Tài khoản, Đề thi).
 * @property {ReadonlyArray<ModeratorNavItem>} items - Các mục con trong nhóm.
 */

/**
 * Cấu trúc menu sidebar Moderator theo nhóm nghiệp vụ.
 *
 * @constant {ReadonlyArray<ModeratorNavSection>}
 * @readonly
 *
 * @example
 * MODERATOR_NAV_SECTIONS[0].items.find(i => i.id === 'reports')?.to
 * // => '/moderator/reports'
 */
export const MODERATOR_NAV_SECTIONS = [
  {
    title: "Cộng đồng",
    items: [
      {
        id: "reports",
        label: "Xử lý báo cáo",
        to: "/moderator/reports",
        icon: faFlag,
        badgeKey: "reports",
        end: false,
      },
      {
        id: "content",
        label: "Duyệt bài viết",
        to: "/moderator/content",
        icon: faClipboardCheck,
        badgeKey: "content",
        end: true,
      },
      {
        id: "content-history",
        label: "Lịch sử duyệt bài",
        to: "/moderator/content/history",
        icon: faClockRotateLeft,
        end: true,
      },
      {
        id: "featured",
        label: "Quản lý ghim bài",
        to: "/moderator/featured",
        icon: faStar,
        end: false,
      },
      {
        id: "feedback",
        label: "Phản hồi / Báo lỗi",
        to: "/moderator/feedback",
        icon: faInbox,
        end: false,
      },
    ],
  },
  {
    title: "Tài khoản",
    items: [
      {
        id: "violations",
        label: "Tài khoản vi phạm",
        to: "/moderator/violations",
        icon: faUserSlash,
        end: false,
      },
    ],
  },
  {
    title: "Đề thi",
    items: [
      {
        id: "practice-submissions",
        label: "Bài nộp thực hành",
        to: "/moderator/practice-submissions",
        icon: faClipboardList,
        end: false,
      },
      {
        id: "exam-history",
        label: "Lịch sử đóng góp đề",
        to: "/moderator/exams/history",
        icon: faClockRotateLeft,
        end: true,
      },
      {
        id: "final-exam",
        label: "Thêm đề cuối kỳ",
        to: "/moderator/final-exams/add",
        icon: faFileCirclePlus,
        end: false,
      },
      {
        id: "practice-exam",
        label: "Thêm đề thực hành",
        to: "/moderator/practice-exams/add",
        icon: faClipboardList,
        end: false,
      },
    ],
  },
];

/**
 * @typedef {Object} ModeratorNavGroup
 * @property {string} id - Slug nhóm (từ `title`).
 * @property {string} label - Nhãn nhóm (= `section.title`).
 * @property {ReadonlyArray<ModeratorNavItem>} items - Mục menu trong nhóm.
 */

/**
 * Dạng nhóm menu legacy — map từ `MODERATOR_NAV_SECTIONS`.
 *
 * @deprecated Dùng `MODERATOR_NAV_SECTIONS` thay thế.
 * @constant {ReadonlyArray<ModeratorNavGroup>}
 * @readonly
 */
export const MODERATOR_NAV_GROUPS = MODERATOR_NAV_SECTIONS.map((section) => ({
  id: section.title.toLowerCase().replace(/\s+/g, "-"),
  label: section.title,
  items: section.items,
}));

/**
 * Danh sách phẳng tất cả mục menu (gộp từ mọi section).
 *
 * @constant {ReadonlyArray<ModeratorNavItem>}
 * @readonly
 */
export const MODERATOR_NAV_ITEMS = MODERATOR_NAV_SECTIONS.flatMap((section) => section.items);

/**
 * Trả về danh sách phẳng mục điều hướng Moderator.
 *
 * Hiện tại alias của `MODERATOR_NAV_ITEMS`; giữ API ổn định cho caller cũ.
 *
 * @returns {ReadonlyArray<ModeratorNavItem>} Toàn bộ nav items đã flatten.
 *
 * @example
 * const items = flattenModeratorNavItems();
 * items.some(item => item.id === 'violations');
 */
export function flattenModeratorNavItems() {
  return MODERATOR_NAV_ITEMS;
}

/**
 * Suy ra tiêu đề trang Moderator từ `pathname` hiện tại.
 *
 * Thuật toán:
 * 1. Sắp xếp nav items theo độ dài `to` giảm dần (match path dài trước).
 * 2. Với `end: true` — khớp chính xác base path (bỏ query).
 * 3. Với `end: false` — `pathname.startsWith(basePath)` và base khác `/moderator`.
 * 4. Fallback cho wizard đề cuối kỳ, lịch sử, hoặc nhãn chung `Kiểm duyệt`.
 *
 * @param {string} pathname - Đường dẫn từ `useLocation()` (ví dụ: `/moderator/reports`).
 * @returns {string} Tiêu đề hiển thị trên header/document.
 *
 * @example
 * resolveModeratorPageTitle('/moderator/violations'); // 'Tài khoản vi phạm'
 * resolveModeratorPageTitle('/moderator/final-exams/add/questions'); // 'Thêm đề cuối kỳ'
 */
export function resolveModeratorPageTitle(pathname) {
  const flat = flattenModeratorNavItems();
  const sorted = [...flat].sort((a, b) => b.to.length - a.to.length);

  for (const item of sorted) {
    const basePath = item.to.split("?")[0];
    if (item.end && pathname === basePath) return item.label;
    if (!item.end && pathname.startsWith(basePath) && basePath !== "/moderator") {
      return item.label;
    }
  }

  if (pathname === "/moderator") return "Xử lý báo cáo";
  if (pathname.startsWith("/moderator/content/history")) return "Lịch sử duyệt bài";
  if (pathname.startsWith("/moderator/exams/history")) return "Lịch sử đóng góp đề";
  if (pathname.includes("/final-exams/edit")) return "Sửa đề cuối kỳ";
  if (pathname.includes("/final-exams/add/questions")) return "Thêm đề cuối kỳ";
  if (pathname.includes("/final-exams/add/review")) return "Thêm đề cuối kỳ";
  return "Kiểm duyệt";
}

/**
 * Kiểm tra mục sidebar có đang active theo `pathname` hay không.
 *
 * @param {ModeratorNavItem} item - Mục menu cần kiểm tra.
 * @param {string} pathname - Pathname hiện tại.
 * @returns {boolean} `true` nếu mục được coi là active.
 *
 * @example
 * const item = MODERATOR_NAV_ITEMS[0];
 * isModeratorNavActive(item, '/moderator/reports/123'); // true nếu item.end === false
 */
export function isModeratorNavActive(item, pathname) {
  const basePath = item.to.split("?")[0];
  if (item.end) return pathname === basePath;
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

/**
 * @typedef {Object} ModeratorNavBadgeCounts
 * @property {number} reports - Số báo cáo cộng đồng đang chờ xử lý.
 * @property {number} content - Số bài viết đang chờ duyệt.
 */

/**
 * Lấy số badge hàng đợi từ cache/store local (đồng bộ).
 *
 * @returns {ModeratorNavBadgeCounts} Đếm pending cho `reports` và `content`.
 *
 * @example
 * const { reports, content } = getModeratorNavBadgeCounts();
 */
export function getModeratorNavBadgeCounts() {
  const communityPending = getCommunityReportsPendingCount();
  return {
    reports: communityPending,
    content: getPendingContentCount(),
  };
}

/**
 * Tải số badge sidebar từ API hoặc fallback cache khi lỗi / mock.
 *
 * Khi `VITE_USE_MOCK=true`, trả về `getModeratorNavBadgeCounts()` ngay.
 * Khi gọi API thành công, đồng bộ `pendingReports` vào cache reports rồi trả counts.
 * Khi API lỗi, fallback về counts local.
 *
 * @returns {Promise<ModeratorNavBadgeCounts>} Promise badge counts sau khi đồng bộ (nếu có).
 *
 * @example
 * const counts = await loadModeratorNavBadgeCounts();
 * // counts.reports — số báo cáo chờ xử lý trên badge sidebar
 */
export async function loadModeratorNavBadgeCounts() {
  if (USE_MOCK) {
    return getModeratorNavBadgeCounts();
  }

  try {
    const stats = await adminApi.getModerationStats();
    syncCachedPendingReportsCount(stats.pendingReports ?? 0);
    syncCachedPendingContentCount(stats.pendingPosts ?? 0);
    return {
      reports: stats.pendingReports ?? 0,
      content: stats.pendingPosts ?? 0,
    };
  } catch {
    return getModeratorNavBadgeCounts();
  }
}
