/**
 * @fileoverview Store báo cáo người dùng (tin nhắn hội thoại + tài khoản) cho Moderator.
 *
 * Gộp hai nguồn API (`listConversationReports`, `listUserReports`), map sang model UI thống nhất,
 * và cung cấp hàm resolve báo cáo.
 *
 * @module features/moderator/reports/conversationReportStore
 */

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
    userReportType: entry.userReportType ?? "conversation",
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
      trustScore: entry.reportedUserTrustScore ?? entry.trustScore ?? null,
      trustTier: entry.reportedUserTrustTier ?? entry.trustTier ?? null,
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
    reportedUserTrustScore: dto.reportedUserTrustScore,
    reportedUserTrustTier: dto.reportedUserTrustTier,
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
    reportedUserTrustScore: dto.reportedUserTrustScore,
    reportedUserTrustTier: dto.reportedUserTrustTier,
    snippet: detail.length > 72 ? `${detail.slice(0, 72)}…` : detail,
  });
}

/**
 * Tải và gộp báo cáo hội thoại + báo cáo tài khoản người dùng.
 *
 * Kết quả sắp xếp mới nhất trước theo `createdAtIso`. Trả về mảng rỗng khi mock.
 *
 * @param {Object} [options] - Tùy chọn tải.
 * @param {number} [options.pageSize=ADMIN_API_PAGE_SIZE] - Số bản ghi mỗi nguồn API.
 * @returns {Promise<Array>} Danh sách báo cáo `category: 'user'`.
 */
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

/**
 * Tìm một báo cáo người dùng theo ID trong queue đã tải.
 *
 * @param {string} id - ID báo cáo cần tìm.
 * @returns {Promise<Object|null>} Báo cáo khớp, hoặc `null` nếu không có.
 */
export async function findConversationReportById(id) {
  const items = await getConversationReports({ pageSize: MODERATION_QUEUE_FETCH_SIZE });
  return items.find((item) => item.id === id) ?? null;
}

/**
 * Đánh dấu báo cáo người dùng đã xử lý qua Admin API.
 *
 * Dispatch sự kiện `sehubs-conversation-reports-changed` và `sehubs-user-reports-changed`
 * sau khi resolve thành công.
 *
 * @param {string} id - ID báo cáo.
 * @param {string} resolution - Ghi chú/kết quả xử lý (ví dụ `ignored`, `warned`, `banned_7d`).
 * @param {'conversation'|'account'} [userReportType='conversation'] - Loại báo cáo.
 * @returns {Promise<Object|null>} DTO đã map, hoặc `null` khi mock.
 * @throws {Error} Khi API thất bại.
 */
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

/** Re-export metadata lý do báo cáo từ `reportsData`. */
export { REASON_META };
