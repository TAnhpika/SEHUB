function parseApiDate(isoDate) {
  if (!isoDate) return null;

  const raw = String(isoDate).trim();
  if (!raw) return null;

  const hasTimezone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRelativeTime(isoDate) {
  const date = parseApiDate(isoDate);
  if (!date) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
}

export function mapNotificationItem(dto) {
  const actorUsername = dto.actorUsername ?? null;
  const linkUrl = resolveNotificationLinkUrl(dto.type, dto.linkUrl, actorUsername);

  return {
    id: dto.id,
    type: dto.type ?? "comment",
    title: dto.title ?? "",
    body: dto.body ?? "",
    linkUrl,
    actorUserId: dto.actorUserId ?? null,
    actorUsername,
    referenceId: dto.referenceId ?? null,
    time: formatRelativeTime(dto.createdAt),
    read: Boolean(dto.isRead),
    createdAt: dto.createdAt,
  };
}

function resolveNotificationLinkUrl(type, linkUrl, actorUsername) {
  if (
    actorUsername &&
    (type === "friendrequest" || type === "friendaccepted" || type === "follow")
  ) {
    return `/profile/${actorUsername}`;
  }

  if (linkUrl === "/home/friends") {
    return null;
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
