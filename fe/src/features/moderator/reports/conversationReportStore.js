import * as adminApi from "@/api/adminApi";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";
import { MODERATION_QUEUE_FETCH_SIZE } from "@/features/moderator/reports/shared/reportCategoryConstants";
import { REASON_META } from "@/features/moderator/reports/reportsData";
import { formatRelativeTime } from "@/utils/dateTime";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function inferReasonId(reasonText) {
  const text = String(reasonText ?? "").toLowerCase();
  if (text.includes("spam") || text.includes("quảng cáo")) return "spam";
  if (text.includes("quấy") || text.includes("bắt nạt") || text.includes("harass")) return "harassment";
  if (text.includes("sai") || text.includes("fake") || text.includes("lệch")) return "misinformation";
  if (text.includes("độc") || text.includes("toxic") || text.includes("không phù hợp")) return "harmful";
  if (text.includes("bản quyền") || text.includes("copyright")) return "copyright";
  return "other";
}

function toInitials(value) {
  const parts = String(value ?? "")
    .replace(/^@/, "")
    .split(/[\s_]+/);
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "?";
}

function toModeratorReport(entry) {
  const reporterUsername = entry.reporterUsername?.startsWith("@")
    ? entry.reporterUsername
    : `@${entry.reporterUsername ?? "student"}`;
  const reportedUsername = entry.reportedUsername?.startsWith("@")
    ? entry.reportedUsername
    : entry.reportedUsername
      ? `@${entry.reportedUsername}`
      : "@unknown";
  const detail = entry.detail ?? entry.reporterReason ?? "";
  const snippet =
    entry.snippet ??
    (detail.length > 72 ? `${detail.slice(0, 72)}…` : detail);

  return {
    id: entry.id,
    code: entry.code,
    category: "user",
    userReportType: entry.userReportType ?? "conversation",
    status: entry.status?.toLowerCase?.() ?? entry.status,
    reason: entry.reasonId ?? inferReasonId(entry.reason),
    reporterUsername,
    reporterInitial: toInitials(reporterUsername),
    timeLabel: entry.timeLabel ?? formatRelativeTime(entry.createdAt),
    reportedAt: entry.reportedAt ?? formatRelativeTime(entry.createdAt),
    createdAtIso: entry.createdAt,
    snippet,
    reporterReason: detail,
    violatingContent: detail,
    conversationId: entry.conversationId,
    reportedUserId: entry.reportedUserId,
    reportedUser: {
      username: reportedUsername,
      initial: toInitials(reportedUsername),
      joinedAt: "—",
      trustScore: 50,
    },
    resolution: entry.resolution ?? entry.resolutionNote ?? null,
  };
}

function mapReportStatus(status) {
  const value = String(status ?? "Pending").toLowerCase();
  return value === "pending" ? "pending" : "resolved";
}

function mapConversationApiReport(dto) {
  return toModeratorReport({
    id: dto.id,
    code: dto.code,
    userReportType: "conversation",
    status: mapReportStatus(dto.status),
    reason: dto.reason,
    reasonId: inferReasonId(dto.reason),
    detail: dto.detail,
    conversationId: dto.conversationId,
    reportedUserId: dto.reportedUserId,
    reportedUsername: dto.reportedUsername,
    reporterUsername: dto.reporterUsername,
    createdAt: dto.createdAt,
    resolutionNote: dto.resolutionNote,
    snippet: dto.detail?.length > 72 ? `${dto.detail.slice(0, 72)}…` : dto.detail,
  });
}

function mapUserApiReport(dto) {
  const detail = dto.detail ?? "";
  return toModeratorReport({
    id: dto.id,
    code: dto.code,
    userReportType: "account",
    status: mapReportStatus(dto.status),
    reason: dto.reason,
    reasonId: inferReasonId(dto.reason),
    detail,
    reportedUserId: dto.reportedUserId,
    reportedUsername: dto.reportedUsername,
    reporterUsername: dto.reporterUsername,
    createdAt: dto.createdAt,
    resolutionNote: dto.resolutionNote,
    snippet: detail.length > 72 ? `${detail.slice(0, 72)}…` : detail,
  });
}

export async function getConversationReports({ pageSize = ADMIN_API_PAGE_SIZE } = {}) {
  if (USE_MOCK) {
    return [];
  }

  const [conversationPage, userPage] = await Promise.all([
    adminApi.listConversationReports({ page: 1, pageSize }),
    adminApi.listUserReports({ page: 1, pageSize }),
  ]);

  const items = [
    ...(conversationPage.items ?? []).map(mapConversationApiReport),
    ...(userPage.items ?? []).map(mapUserApiReport),
  ].sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime());

  return items;
}

export async function findConversationReportById(id) {
  const items = await getConversationReports({ pageSize: MODERATION_QUEUE_FETCH_SIZE });
  return items.find((item) => item.id === id) ?? null;
}

export async function resolveConversationReport(id, resolution, userReportType = "conversation") {
  if (USE_MOCK) {
    return null;
  }

  const body = {
    status: "Resolved",
    resolutionNote: resolution,
  };

  const dto =
    userReportType === "account"
      ? await adminApi.resolveUserReport(id, body)
      : await adminApi.resolveConversationReport(id, body);

  window.dispatchEvent(new CustomEvent("sehubs-conversation-reports-changed"));
  window.dispatchEvent(new CustomEvent("sehubs-user-reports-changed"));

  return userReportType === "account" ? mapUserApiReport(dto) : mapConversationApiReport(dto);
}

export async function escalateUserReportToViolations(id, userReportType = "conversation") {
  if (USE_MOCK) {
    return null;
  }

  const source = userReportType === "account" ? "account" : "conversation";
  const result = await adminApi.escalateUserReportToViolations(id, { source });

  window.dispatchEvent(new CustomEvent("sehubs-conversation-reports-changed"));
  window.dispatchEvent(new CustomEvent("sehubs-user-reports-changed"));

  return result;
}

export { REASON_META };
