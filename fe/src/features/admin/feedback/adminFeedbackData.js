import * as feedbackApi from "@/api/feedbackApi";

export const FEEDBACK_STATUS_META = {
  Pending: { label: "Chờ xử lý", badgeStatus: "pending" },
  Reviewed: { label: "Đã xem", badgeStatus: "draft" },
  Resolved: { label: "Đã xử lý", badgeStatus: "resolved" },
};

export const FEEDBACK_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Chờ xử lý" },
  { value: "Reviewed", label: "Đã xem" },
  { value: "Resolved", label: "Đã xử lý" },
];

export function mapFeedbackItem(dto) {
  const status = dto?.status ?? "Pending";
  const meta = FEEDBACK_STATUS_META[status] ?? FEEDBACK_STATUS_META.Pending;

  return {
    id: dto.id,
    userId: dto.userId ?? null,
    username: dto.username ?? "—",
    description: dto.description ?? "",
    status,
    statusLabel: meta.label,
    badgeStatus: meta.badgeStatus,
    attachmentUrls: Array.isArray(dto.attachmentUrls) ? dto.attachmentUrls : [],
    createdAt: dto.createdAt ?? null,
  };
}

export async function loadAdminFeedbackPage({ status = "all", page = 1, pageSize = 20 } = {}) {
  const params = { page, pageSize };
  if (status && status !== "all") {
    params.status = status;
  }

  const result = await feedbackApi.listFeedback(params);
  return {
    items: (result?.items ?? []).map(mapFeedbackItem),
    totalCount: result?.totalCount ?? 0,
    page: result?.page ?? page,
    pageSize: result?.pageSize ?? pageSize,
  };
}

export async function updateFeedbackStatus(id, status) {
  const dto = await feedbackApi.updateFeedbackStatus(id, { status });
  return mapFeedbackItem(dto);
}

export function formatFeedbackDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
