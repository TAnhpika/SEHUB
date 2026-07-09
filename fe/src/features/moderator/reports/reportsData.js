/**
 * @fileoverview Tầng dữ liệu báo cáo cộng đồng cho Moderator — tải, map, lọc và xử lý qua Admin API.
 *
 * Module này cung cấp:
 * - Hằng số tab trạng thái và metadata lý do báo cáo (`REASON_META`).
 * - Mapper từ DTO Admin → model UI Moderator (`mapAdminReportToModeratorCommunityReport`).
 * - Hàm tải phân trang, resolve (dismiss/delete) và đếm badge pending.
 * - Dữ liệu mock khi `VITE_USE_MOCK=true`.
 *
 * @module features/moderator/reports/reportsData
 * @see {@link module:features/admin/moderation/adminReportData}
 */

import * as adminApi from "@/api/adminApi";
import { mapAdminReportListItem } from "@/api/adminMapper";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";
import {
  formatReportCode,
  inferReasonId,
  toReportInitials,
  COMMUNITY_REPORT_REASON_META,
} from "@/features/reports/shared/reportFormatters";
import {
  resolveReportDeleteViaApi,
  resolveReportDismissViaApi,
} from "@/features/admin/moderation/adminReportData";
import { isValidGuid } from "@/features/feed/postUtils";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/** @type {number|null} Số báo cáo chờ từ API — tránh fallback mock (3) làm badge nhấp nháy. */
let cachedPendingReportsCount = null;

/**
 * Danh sách tab lọc theo trạng thái báo cáo (dùng ở UI lọc nâng cao).
 *
 * @constant {ReadonlyArray<{ value: string, label: string }>}
 * @readonly
 */
export const REPORT_STATUS_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "resolved", label: "Đã xử lý" },
];

/**
 * Metadata nhãn và tone màu cho từng lý do báo cáo (cộng đồng + đề thi + mở rộng).
 *
 * @constant {Readonly<Record<string, { label: string, tone: string }>>}
 * @readonly
 */
export const REASON_META = {
  ...COMMUNITY_REPORT_REASON_META,
  harmful: { label: "Nội dung độc hại", tone: "muted" },
  wrong_answer: { label: "Đáp án sai", tone: "danger" },
  wrong_question: { label: "Câu hỏi sai", tone: "danger" },
  typo: { label: "Lỗi format", tone: "muted" },
  duplicate: { label: "Trùng câu", tone: "muted" },
  inappropriate: COMMUNITY_REPORT_REASON_META.inappropriate,
  copyright: COMMUNITY_REPORT_REASON_META.copyright,
  other: COMMUNITY_REPORT_REASON_META.other,
};

/**
 * Dữ liệu mock báo cáo cộng đồng dùng khi `VITE_USE_MOCK=true`.
 *
 * @constant {ReadonlyArray<Object>}
 * @readonly
 */
export const REPORTS_MOCK = [
  {
    id: "rp-4921",
    code: "RP-4921",
    status: "pending",
    reason: "spam",
    reporterUsername: "@minh_student",
    reporterInitial: "MS",
    timeLabel: "10 phút trước",
    reportedAt: "14:30, 24/10/2023",
    snippet:
      "Nội dung này chứa các liên kết đáng ngờ dẫn đến trang web lừa đảo. Cần kiểm tra…",
    reportedUser: {
      username: "@spammer_acc_01",
      initial: "SP",
      joinedAt: "01/09/2023",
      trustScore: 25,
    },
    violatingContent:
      "Click ngay vào link này để nhận tài liệu ôn thi bí mật đảm bảo đậu 100% không cần học: http://bit.ly/scam-link-123. Số lượng có hạn!!",
    reporterReason:
      "Tài khoản này liên tục gửi các liên kết lạ vào nhiều luồng thảo luận khác nhau, nghi ngờ là link lừa đảo đánh cắp thông tin sinh viên.",
  },
  {
    id: "rp-4918",
    code: "RP-4918",
    status: "pending",
    reason: "harmful",
    reporterUsername: "@tuan_anh99",
    reporterInitial: "TA",
    timeLabel: "1 giờ trước",
    reportedAt: "13:15, 24/10/2023",
    snippet:
      "Ngôn từ xúc phạm nghiêm trọng trong phần bình luận của bài giảng Kỹ thuật…",
    reportedUser: {
      username: "@user_ky_thuat_02",
      initial: "KT",
      joinedAt: "15/08/2023",
      trustScore: 42,
    },
    violatingContent:
      "Thầy dạy như *expletive*, không ai hiểu gì cả. Đừng học môn này nếu không muốn trượt.",
    reporterReason:
      "Bình luận có ngôn từ thô tục, xúc phạm giảng viên và gây toxic cho cộng đồng học tập.",
  },
  {
    id: "rp-4902",
    code: "RP-4902",
    status: "pending",
    reason: "misinformation",
    reporterUsername: "@linh_data",
    reporterInitial: "LD",
    timeLabel: "3 giờ trước",
    reportedAt: "11:00, 24/10/2023",
    snippet: "Đăng thông tin sai về lịch thi FE và đáp án đề chưa được xác minh…",
    reportedUser: {
      username: "@fake_news_88",
      initial: "FN",
      joinedAt: "20/09/2023",
      trustScore: 18,
    },
    violatingContent:
      "FE tuần sau hủy, ai cần đáp án inbox mình — cam kết 100% trùng đề (chưa verify).",
    reporterReason: "Thông tin gây hoang mang, không có nguồn từ phòng đào tạo.",
  },
  {
    id: "rp-4880",
    code: "RP-4880",
    status: "resolved",
    reason: "harassment",
    reporterUsername: "@pham_e",
    reporterInitial: "PE",
    timeLabel: "1 ngày trước",
    reportedAt: "09:20, 23/10/2023",
    snippet: "Nhắn tin riêng quấy rối sau khi tranh luận trong bài viết…",
    reportedUser: {
      username: "@acc_xyz_12",
      initial: "XY",
      joinedAt: "02/07/2023",
      trustScore: 55,
    },
    violatingContent: "DM liên tục yêu cầu xóa bài và đe dọa nếu không tuân theo.",
    reporterReason: "Quấy rối qua tin nhắn cá nhân sau tranh luận công khai.",
    resolution: "ignored",
  },
];

/**
 * Lọc danh sách báo cáo theo tab trạng thái.
 *
 * @param {Array} reports - Danh sách báo cáo gốc.
 * @param {string} statusTab - `all`, `pending`, hoặc `resolved`.
 * @returns {Array} Báo cáo đã lọc; trả về nguyên mảng nếu `statusTab === 'all'`.
 */
export function filterReports(reports, statusTab) {
  if (statusTab === "all") return reports;
  return reports.filter((report) => report.status === statusTab);
}

function getReportSortTimestamp(report) {
  const raw = report.createdAtIso ?? report.createdAt ?? report.reportedAt ?? report.timeLabel;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Sắp xếp báo cáo theo thời gian: pending FIFO (cũ trước), resolved/all mới trước.
 *
 * @param {Array} reports - Danh sách báo cáo cần sắp xếp (không mutate mảng gốc).
 * @param {string} [tab='all'] - Tab hiện tại; `pending` dùng thứ tự FIFO.
 * @returns {Array} Mảng báo cáo đã sắp xếp.
 */
export function sortModeratorReports(reports, tab = "all") {
  return [...reports].sort((a, b) => {
    const aMs = getReportSortTimestamp(a);
    const bMs = getReportSortTimestamp(b);
    if (tab === "pending") return aMs - bMs;
    return bMs - aMs;
  });
}

function formatTimeLabel(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function formatReportedAt(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function mapResolutionFromAdminReport(adminReport) {
  if (adminReport.status !== "resolved") return undefined;
  const action = String(adminReport.resolution?.action ?? "").toLowerCase();
  if (action === "rejected") return "ignored";
  if (action === "approved") return "deleted";
  return action.includes("reject") ? "ignored" : "deleted";
}

function mergeResolvedCommunityReport(reports, resolvedReport) {
  const next = reports.filter((report) => report.id !== resolvedReport.id);
  return [resolvedReport, ...next];
}

/**
 * Map DTO báo cáo Admin sang model UI Moderator (category `community`).
 *
 * @param {Object} adminReport - Báo cáo từ Admin API sau `mapAdminReportListItem`.
 * @returns {Object} Báo cáo định dạng Moderator với `category: 'community'`.
 */
export function mapAdminReportToModeratorCommunityReport(adminReport) {
  const reporter = adminReport.reporter ?? "unknown";
  const reportedUser = adminReport.reportedUser ?? reporter;
  const createdAtIso = adminReport.createdAtIso ?? adminReport.createdAt;

  return {
    id: adminReport.id,
    apiId: adminReport.id,
    code: formatReportCode(adminReport.id),
    category: "community",
    kind: adminReport.kind ?? "post",
    commentId: adminReport.commentId ?? null,
    status: adminReport.status,
    reason: inferReasonId(adminReport.reason),
    reporterUsername: `@${reporter}`,
    reporterInitial: toReportInitials(reporter),
    timeLabel: formatTimeLabel(createdAtIso),
    reportedAt: formatReportedAt(createdAtIso),
    createdAtIso,
    snippet:
      adminReport.kind === "comment"
        ? adminReport.post?.excerpt ?? adminReport.reason
        : adminReport.post?.excerpt ?? adminReport.post?.title ?? adminReport.reason,
    reportedUser: {
      username: `@${reportedUser}`,
      initial: toReportInitials(reportedUser),
      joinedAt: "—",
      trustScore: 50,
    },
    reportedUserId: adminReport.reportedUserId ?? null,
    violatingContent:
      adminReport.kind === "comment"
        ? adminReport.post?.excerpt ?? adminReport.reason ?? "—"
        : adminReport.post?.excerpt ?? adminReport.post?.title ?? adminReport.reason ?? "—",
    reporterReason: adminReport.reason,
    resolution: mapResolutionFromAdminReport(adminReport),
  };
}

/**
 * Trả về bản sao mock báo cáo cộng đồng kèm `category: 'community'`.
 *
 * @returns {Array} Danh sách mock reports.
 */
export function getCommunityReportsMock() {
  return REPORTS_MOCK.map((report) => ({ ...report, category: "community" }));
}

/**
 * @typedef {Object} LoadModeratorCommunityReportsOptions
 * @property {number} [page=1] - Trang API (1-based).
 * @property {number} [pageSize] - Kích thước trang; mặc định `ADMIN_API_PAGE_SIZE`.
 * @property {string} [status] - Lọc trạng thái: `all`, `pending`, `resolved`.
 */

/**
 * @typedef {Object} LoadModeratorCommunityReportsResult
 * @property {Array} items - Báo cáo đã map sang model Moderator.
 * @property {number} totalCount - Tổng số báo cáo trên server.
 * @property {number} page - Trang hiện tại.
 * @property {boolean} hasMore - Còn trang tiếp theo hay không.
 */

/**
 * Tải danh sách báo cáo cộng đồng từ Admin API (hoặc mock).
 *
 * Trang 1 cập nhật `cachedPendingReportsCount` cho badge navigation.
 *
 * @param {LoadModeratorCommunityReportsOptions} [options] - Tùy chọn phân trang và lọc.
 * @returns {Promise<LoadModeratorCommunityReportsResult>} Kết quả phân trang.
 * @throws {Error} Khi API thất bại (không mock).
 */
export async function loadModeratorCommunityReports(options = {}) {
  if (USE_MOCK) {
    return {
      items: getCommunityReportsMock(),
      totalCount: REPORTS_MOCK.length,
      page: 1,
      hasMore: false,
    };
  }

  const { page = 1, pageSize = ADMIN_API_PAGE_SIZE, status } = options;
  const params = { page, pageSize };
  if (status && status !== "all") {
    params.status = status === "pending" ? "Pending" : status === "resolved" ? "Resolved" : status;
  }

  const pageResult = await adminApi.listReports(params);
  const items = (pageResult.items ?? [])
    .map(mapAdminReportListItem)
    .map(mapAdminReportToModeratorCommunityReport);
  const totalCount = pageResult.totalCount ?? items.length;
  if (page === 1) {
    cachedPendingReportsCount = items.filter((report) => report.status === "pending").length;
  }

  return {
    items,
    totalCount,
    page,
    hasMore: page * pageSize < totalCount,
  };
}

async function resolveModeratorCommunityReportViaApi(id, action, kind = "post") {
  if (USE_MOCK) {
    return null;
  }

  if (!isValidGuid(String(id ?? ""))) {
    throw new Error("Không xác định được báo cáo.");
  }

  const body =
    action === "delete"
      ? await resolveReportDeleteViaApi(id, { kind })
      : await resolveReportDismissViaApi(id);

  try {
    const dto = await adminApi.resolveReport(id, body);
    return mapAdminReportToModeratorCommunityReport(mapAdminReportListItem(dto));
  } catch (error) {
    if (error?.status === 404) {
      throw new Error("Báo cáo không còn tồn tại hoặc bài viết đã bị xóa trước đó.");
    }
    throw error;
  }
}

/**
 * Resolve báo cáo cộng đồng qua API rồi tải lại danh sách, chèn báo cáo vừa resolve lên đầu.
 *
 * @param {string} id - ID báo cáo (GUID).
 * @param {'dismiss'|'delete'} action - Hành động: bỏ qua hoặc xóa nội dung.
 * @param {'post'|'comment'} [kind='post'] - Loại nội dung bị báo cáo.
 * @returns {Promise<Array|null>} Danh sách báo cáo mới, hoặc `null` khi mock.
 * @throws {Error} Khi ID không hợp lệ hoặc API trả 404.
 */
export async function reloadModeratorCommunityReportsAfterResolve(id, action, kind = "post") {
  const resolvedReport = await resolveModeratorCommunityReportViaApi(id, action, kind);
  if (!resolvedReport) {
    return null;
  }

  const { items: list } = await loadModeratorCommunityReports();
  return mergeResolvedCommunityReport(list, resolvedReport);
}

/**
 * Đồng bộ cache số báo cáo pending (badge) từ nguồn bên ngoài.
 *
 * Bỏ qua khi đang dùng mock.
 *
 * @param {number} count - Số báo cáo chờ xử lý mới nhất.
 * @returns {void}
 */
export function syncCachedPendingReportsCount(count) {
  if (!USE_MOCK) {
    cachedPendingReportsCount = count;
  }
}

/**
 * Lấy số báo cáo cộng đồng đang chờ xử lý từ cache (hoặc đếm mock).
 *
 * @returns {number} Số báo cáo pending; `0` nếu chưa tải lần nào.
 */
export function getCommunityReportsPendingCount() {
  if (USE_MOCK) {
    return REPORTS_MOCK.filter((report) => report.status === "pending").length;
  }
  return cachedPendingReportsCount ?? 0;
}

/**
 * Tải và cache số báo cáo pending từ `adminApi.getModerationStats()`.
 *
 * @returns {Promise<number>} Số báo cáo chờ xử lý.
 * @throws {Error} Khi API thất bại (không mock).
 */
export async function loadCommunityReportsPendingCount() {
  if (USE_MOCK) {
    return getCommunityReportsPendingCount();
  }

  const stats = await adminApi.getModerationStats();
  cachedPendingReportsCount = stats.pendingReports ?? 0;
  return cachedPendingReportsCount;
}
