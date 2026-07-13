import { formatRelativeTime } from "@/utils/dateTime";

export function mapNotificationItem(dto) {
  const actorUsername = dto.actorUsername ?? null;
  const referenceId = dto.referenceId ?? null;
  const linkUrl = resolveNotificationLinkUrl(dto.type, dto.linkUrl, actorUsername, referenceId);

  return {
    id: dto.id,
    type: dto.type ?? "comment",
    title: dto.title ?? "",
    body: dto.body ?? "",
    linkUrl,
    actorUserId: dto.actorUserId ?? null,
    actorUsername,
    referenceId,
    time: formatRelativeTime(dto.createdAt),
    read: Boolean(dto.isRead),
    createdAt: dto.createdAt,
  };
}

function resolveNotificationLinkUrl(type, linkUrl, actorUsername, referenceId) {
  if (
    actorUsername &&
    (type === "friendrequest" || type === "friendaccepted" || type === "follow")
  ) {
    return `/profile/${actorUsername}`;
  }

  if (linkUrl === "/home/friends") {
    return null;
  }

  if (
    referenceId &&
    (linkUrl === "/admin/feedback" || linkUrl === "/moderator/feedback")
  ) {
    return `${linkUrl}?id=${encodeURIComponent(referenceId)}`;
  }

  if (referenceId && linkUrl === "/admin/moderation") {
    return `${linkUrl}?id=${encodeURIComponent(referenceId)}`;
  }

  return linkUrl ?? null;
}

export function mapNotificationPage(response) {
  const items = response?.items ?? [];
  return {
    items: items.map(mapNotificationItem),
    totalCount: response?.totalCount ?? items.length,
  };
}
