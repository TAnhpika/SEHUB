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

/** Số báo cáo chờ từ API — tránh fallback mock (3) làm badge nhấp nháy. */
let cachedPendingReportsCount = null;

export const REPORT_STATUS_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "resolved", label: "Đã xử lý" },
];

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

export function filterReports(reports, statusTab) {
  if (statusTab === "all") return reports;
  return reports.filter((report) => report.status === statusTab);
}

function getReportSortTimestamp(report) {
  const raw = report.createdAtIso ?? report.createdAt ?? report.reportedAt ?? report.timeLabel;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** Pending: FIFO (cũ trước). Resolved/all: mới trước. */
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

export function getCommunityReportsMock() {
  return REPORTS_MOCK.map((report) => ({ ...report, category: "community" }));
}

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

export async function reloadModeratorCommunityReportsAfterResolve(id, action, kind = "post") {
  if (USE_MOCK || !isValidGuid(String(id ?? ""))) {
    return null;
  }

  const dto =
    action === "delete"
      ? await resolveReportDeleteViaApi(id, { kind })
      : await resolveReportDismissViaApi(id);

  if (!dto) {
    return null;
  }

  const resolvedReport = mapAdminReportToModeratorCommunityReport(mapAdminReportListItem(dto));
  const { items: list } = await loadModeratorCommunityReports();
  return mergeResolvedCommunityReport(list, resolvedReport);
}

export function syncCachedPendingReportsCount(count) {
  if (!USE_MOCK) {
    cachedPendingReportsCount = count;
  }
}

export function getCommunityReportsPendingCount() {
  if (USE_MOCK) {
    return REPORTS_MOCK.filter((report) => report.status === "pending").length;
  }
  return cachedPendingReportsCount ?? 0;
}

export async function loadCommunityReportsPendingCount() {
  if (USE_MOCK) {
    return getCommunityReportsPendingCount();
  }

  const stats = await adminApi.getModerationStats();
  cachedPendingReportsCount = stats.pendingReports ?? 0;
  return cachedPendingReportsCount;
}
