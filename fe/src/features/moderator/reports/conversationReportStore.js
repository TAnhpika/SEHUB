import * as adminApi from "@/api/adminApi";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";
import { MODERATION_QUEUE_FETCH_SIZE } from "@/features/moderator/reports/shared/reportCategoryConstants";
import { REASON_META } from "@/features/moderator/reports/reportsData";
import { inferReasonId, toReportInitials } from "@/features/reports/shared/reportFormatters";
import { formatRelativeTime } from "@/utils/dateTime";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

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
    status: entry.status?.toLowerCase?.() ?? entry.status,
    reason: entry.reasonId ?? inferReasonId(entry.reason),
    reporterUsername,
    reporterInitial: toReportInitials(reporterUsername),
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
      initial: toReportInitials(reportedUsername),
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

function mapApiReport(dto) {
  return toModeratorReport({
    id: dto.id,
    code: dto.code,
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

export async function getConversationReports({ pageSize = ADMIN_API_PAGE_SIZE } = {}) {
  if (USE_MOCK) {
    return [];
  }

  const page = await adminApi.listConversationReports({ page: 1, pageSize });
  return (page.items ?? []).map(mapApiReport);
}

export async function findConversationReportById(id) {
  const items = await getConversationReports({ pageSize: MODERATION_QUEUE_FETCH_SIZE });
  return items.find((item) => item.id === id) ?? null;
}

export async function resolveConversationReport(id, resolution) {
  if (USE_MOCK) {
    return null;
  }

  const dto = await adminApi.resolveConversationReport(id, {
    status: "Resolved",
    resolutionNote: resolution,
  });
  window.dispatchEvent(new CustomEvent("sehubs-conversation-reports-changed"));
  return mapApiReport(dto);
}

export { REASON_META };
