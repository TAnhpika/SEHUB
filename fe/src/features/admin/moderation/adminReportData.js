/** Mock store — hàng chờ báo cáo Admin */

import * as adminApi from "@/api/adminApi";
import { mapAdminReportListItem } from "@/api/adminMapper";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";
import { addBannedUserFromReport } from "@/features/admin/moderation/adminBannedData";
import { syncUserBanStatus } from "@/features/admin/users/adminUserStore";
import { isValidGuid } from "@/features/feed/postUtils";
import { getExamQuestionReports } from "@/features/exams/examQuestionReportStore";
import { getConversationReports } from "@/features/moderator/reports/conversationReportStore";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const REPORT_REASON_LABELS = {
  spam: "Spam hoặc quảng cáo",
  inappropriate: "Nội dung không phù hợp",
  misinformation: "Thông tin sai lệch",
  harassment: "Quấy rối / xúc phạm",
  other: "Lý do khác",
};

export const REPORT_STATUS_LABELS = {
  pending: "Chờ xử lý",
  resolved: "Đã xử lý",
};

/** @type {Array<{
 *   id: string;
 *   postId: string;
 *   reasonId: keyof typeof REPORT_REASON_LABELS;
 *   reason: string;
 *   reporter: string;
 *   reportedUser: string;
 *   status: "pending" | "resolved";
 *   urgent?: boolean;
 *   createdAt: string;
 *   post: { author: string; postedAt: string; title: string; excerpt: string };
 *   resolution?: { action: string; note: string; resolvedAt: string; resolvedBy: string };
 * }>} */
let reportsStore = [
  {
    id: "r1",
    postId: "1042",
    reasonId: "spam",
    reason: REPORT_REASON_LABELS.spam,
    reporter: "minhanh_dev",
    reportedUser: "spam_bot_01",
    status: "pending",
    urgent: true,
    createdAt: "2026-06-04 09:12",
    post: {
      author: "spam_bot_01",
      postedAt: "2026-06-04 08:55",
      title: "Nhận quà miễn phí — click ngay!!!",
      excerpt:
        "Click vào link này để nhận voucher 100%!!! [bit.ly/xxx] — nội dung quảng cáo spam trên cộng đồng SEHub.",
    },
  },
  {
    id: "r2",
    postId: "998",
    reasonId: "inappropriate",
    reason: REPORT_REASON_LABELS.inappropriate,
    reporter: "anhcoding12345",
    reportedUser: "user_xyz",
    status: "pending",
    urgent: false,
    createdAt: "2026-06-03 21:40",
    post: {
      author: "user_xyz",
      postedAt: "2026-06-03 20:10",
      title: "Chia sẻ tài liệu PRF192 (link ngoài)",
      excerpt:
        "Mình up full đáp án lên Google Drive công khai, các bạn vào tải — không liên quan môn học FPT.",
    },
  },
  {
    id: "r4",
    postId: "1011",
    reasonId: "harassment",
    reason: REPORT_REASON_LABELS.harassment,
    reporter: "vy_pham",
    reportedUser: "toxic_user_99",
    status: "pending",
    urgent: true,
    createdAt: "2026-06-04 07:30",
    post: {
      author: "toxic_user_99",
      postedAt: "2026-06-04 07:15",
      title: "Trả lời bài hỏi đáp SWP391",
      excerpt:
        "Bạn không biết code mà còn hỏi — đừng học ngành SE nữa. [Nội dung xúc phạm đã được rút gọn]",
    },
  },
  {
    id: "r5",
    postId: "1055",
    reasonId: "other",
    reason: REPORT_REASON_LABELS.other,
    reporter: "lehoang",
    reportedUser: "seller_01",
    status: "pending",
    createdAt: "2026-06-02 16:20",
    post: {
      author: "seller_01",
      postedAt: "2026-06-02 15:00",
      title: "Bán tài khoản Premium giá rẻ",
      excerpt: "Inbox mình để mua gói 4 năm chỉ 50k — không qua PayOS chính thức.",
    },
  },
  {
    id: "r3",
    postId: "870",
    reasonId: "misinformation",
    reason: REPORT_REASON_LABELS.misinformation,
    reporter: "lehoang",
    reportedUser: "news_fake",
    status: "resolved",
    createdAt: "2026-06-01 14:00",
    post: {
      author: "news_fake",
      postedAt: "2026-06-01 12:30",
      title: "Lịch thi cuối kỳ đã đổi — fake",
      excerpt: "Theo nguồn không chính thức, kỳ thi SWP391 dời sang tháng 8 (sai sự thật).",
    },
    resolution: {
      action: "Xóa bài viết",
      note: "Thông tin sai lệch gây hoang mang.",
      resolvedAt: "2026-06-01 15:10",
      resolvedBy: "Admin SEHub",
    },
  },
  {
    id: "r6",
    postId: "1038",
    reasonId: "spam",
    reason: REPORT_REASON_LABELS.spam,
    reporter: "minhanh_dev",
    reportedUser: "promo_acc",
    status: "resolved",
    createdAt: "2026-05-28 11:00",
    post: {
      author: "promo_acc",
      postedAt: "2026-05-28 10:45",
      title: "Khóa học lập trình giảm 90%",
      excerpt: "Quảng cáo khóa học ngoài FPT — spam lặp lại nhiều lần.",
    },
    resolution: {
      action: "Giữ nguyên bài",
      note: "Nội dung đã được chỉnh sửa, báo cáo không đủ căn cứ.",
      resolvedAt: "2026-05-28 14:00",
      resolvedBy: "Nguyễn Kiểm Duyệt",
    },
  },
];

function formatReportCode(id) {
  const short = String(id ?? "")
    .replace(/-/g, "")
    .slice(0, 4)
    .toUpperCase();
  return short ? `RP-${short}` : "RP-0000";
}

export function mapCommunityReportForQueue(report) {
  const reporter = report.reporter ?? "unknown";
  const reportedUser = report.reportedUser ?? reporter;
  const reporterUsername = reporter.startsWith("@") ? reporter : `@${reporter}`;
  const reportedUsername = reportedUser.startsWith("@") ? reportedUser : `@${reportedUser}`;

  return {
    ...report,
    category: "community",
    code: formatReportCode(report.id),
    snippet: report.post?.excerpt ?? report.post?.title ?? "",
    reporterUsername,
    timeLabel: report.createdAt,
    reportedUserProfile: {
      username: reportedUsername,
      initial: reportedUser.replace("@", "").slice(0, 2).toUpperCase() || "?",
    },
  };
}

export function getAdminReports() {
  return [...reportsStore]
    .map(mapCommunityReportForQueue)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAdminReportById(id) {
  return reportsStore.find((r) => r.id === id) ?? null;
}

function resolveReport(id, action, note) {
  const item = reportsStore.find((r) => r.id === id);
  if (!item || item.status === "resolved") return null;
  const entry = {
    ...item,
    status: "resolved",
    resolution: {
      action,
      note: note ?? "",
      resolvedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      resolvedBy: "Admin SEHub",
    },
  };
  reportsStore = reportsStore.map((r) => (r.id === id ? entry : r));
  return entry;
}

export function deleteReportedPost(id) {
  return resolveReport(id, "Xóa bài viết", "Bài viết đã bị gỡ khỏi cộng đồng.");
}

export function dismissReport(id) {
  return resolveReport(id, "Giữ nguyên bài", "Báo cáo không đủ căn cứ — giữ nguyên nội dung.");
}

export function banReportedUser(id, durationLabel) {
  const item = reportsStore.find((r) => r.id === id);
  const resolved = resolveReport(
    id,
    `Khóa tài khoản (${durationLabel})`,
    `Tài khoản @${item?.reportedUser ?? ""} bị khóa.`,
  );
  if (resolved && item) {
    const user = addBannedUserFromReport(item.reportedUser, durationLabel, {
      reason: item.reason,
      reportId: item.id,
      postId: item.postId,
      displayName: item.post.author,
    });
    if (durationLabel.includes("vĩnh")) {
      syncUserBanStatus(item.reportedUser, "banned");
    }
    return { ...resolved, bannedEntry: user };
  }
  return resolved;
}

export async function fetchAdminReportsPage(page = 1, { pageSize = ADMIN_API_PAGE_SIZE, status } = {}) {
  const params = { page, pageSize };
  if (status) {
    params.status = status;
  }

  const pageResult = await adminApi.listReports(params);
  const items = (pageResult.items ?? [])
    .map(mapAdminReportListItem)
    .map(mapCommunityReportForQueue)
    .sort((a, b) =>
      String(b.createdAtIso ?? b.createdAt).localeCompare(String(a.createdAtIso ?? a.createdAt)),
    );

  const totalCount = pageResult.totalCount ?? items.length;
  return {
    items,
    totalCount,
    page,
    hasMore: page * pageSize < totalCount,
  };
}

export async function loadAdminReports() {
  if (USE_MOCK) {
    return getAdminReports();
  }

  const { items } = await fetchAdminReportsPage(1);
  return items;
}

export async function loadAdminModerationReports() {
  if (USE_MOCK) {
    return {
      communityReports: getAdminReports(),
      examReports: [],
      userReports: [],
      communityHasMore: false,
      communityPage: 1,
    };
  }

  const [communityResult, examReports, userReports] = await Promise.all([
    fetchAdminReportsPage(1).catch(() => ({ items: [], hasMore: false, page: 1 })),
    getExamQuestionReports().catch(() => []),
    getConversationReports().catch(() => []),
  ]);

  return {
    communityReports: communityResult.items ?? [],
    examReports,
    userReports,
    communityHasMore: communityResult.hasMore ?? false,
    communityPage: communityResult.page ?? 1,
  };
}

export async function loadAdminReportById(id) {
  const mockReport = getAdminReportById(id);
  if (USE_MOCK || !isValidGuid(String(id ?? ""))) {
    return mockReport;
  }

  try {
    const dto = await adminApi.getReport(id);
    return mapAdminReportListItem(dto);
  } catch {
    return mockReport;
  }
}

export async function resolveAdminReportViaApi(id, body) {
  if (USE_MOCK || !isValidGuid(String(id ?? ""))) {
    return null;
  }

  try {
    const dto = await adminApi.resolveReport(id, body);
    return mapAdminReportListItem(dto);
  } catch {
    return null;
  }
}

export async function resolveReportDeleteViaApi(id) {
  return resolveAdminReportViaApi(id, { status: "Approved", action: "delete_post" });
}

export async function resolveReportDismissViaApi(id) {
  return resolveAdminReportViaApi(id, { status: "Rejected" });
}

export async function resolveReportBanViaApi(id) {
  return resolveAdminReportViaApi(id, { status: "Approved" });
}
