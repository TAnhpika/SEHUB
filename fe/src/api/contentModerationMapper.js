import { DEFAULT_REJECT_REASON } from "@/features/moderator/content/contentModerationData";
import {
  formatDateTimeFromApi,
  formatRelativeTimeFromApi,
  parseApiDate,
} from "@/utils/parseApiDate";

function formatRelativeTime(dateStr) {
  return formatRelativeTimeFromApi(dateStr);
}

function formatActionTime(dateStr) {
  return formatDateTimeFromApi(dateStr);
}

export function mapModerationUiStatus(status) {
  const value = String(status ?? "").toLowerCase();
  if (value === "published") return "approved";
  if (value === "rejected") return "rejected";
  if (value === "pending") return "pending";
  return value;
}

function mapModerationRecord(dto, uiStatus) {
  if (uiStatus === "pending") return null;

  const isApproved = uiStatus === "approved";

  return {
    moderatorName: dto.moderatorUsername ? `@${dto.moderatorUsername}` : "—",
    moderatorId: dto.moderatorUsername ?? "—",
    actionAtLabel: dto.moderatedAt ? formatActionTime(dto.moderatedAt) : "—",
    note: isApproved
      ? dto.moderationNote || "Đã duyệt — hiển thị trên feed cộng đồng."
      : undefined,
    reason: !isApproved ? dto.moderationNote || DEFAULT_REJECT_REASON : undefined,
    resubmitHint: !isApproved
      ? "Tác giả có thể chỉnh sửa bài Rejected rồi gửi duyệt lại (Pending)."
      : undefined,
  };
}

export function mapModerationPostListItem(dto) {
  const uiStatus = mapModerationUiStatus(dto.status);
  const authorLabel = dto.author?.displayName?.trim() || dto.author?.username || "Unknown";
  const createdAt = dto.createdAt;

  return {
    id: dto.id,
    type: "post",
    title: dto.title,
    excerpt: dto.excerpt,
    content: null,
    tags: dto.tags ?? [],
    semester: dto.semester ? `Kỳ ${dto.semester}` : undefined,
    major: dto.major ?? undefined,
    authorName: authorLabel,
    authorInitial: authorLabel.charAt(0).toUpperCase(),
    studentId: dto.author?.username ? `@${dto.author.username}` : "—",
    submittedAtLabel: formatRelativeTime(createdAt),
    timeLabel: formatRelativeTime(createdAt),
    status: uiStatus,
    resubmission: uiStatus === "pending" && Boolean(dto.moderatedAt),
    sortOrder: parseApiDate(createdAt)?.getTime() ?? 0,
    allowComments: true,
    moderation: mapModerationRecord(dto, uiStatus),
  };
}

export function mapModerationPostDetail(dto) {
  const item = mapModerationPostListItem(dto);
  return {
    ...item,
    content: dto.content ?? item.excerpt,
  };
}
