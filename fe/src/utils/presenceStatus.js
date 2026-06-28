import { formatRelativeTime, parseApiDate } from "@/utils/dateTime";

export const OFFLINE_AFTER_MS = 3 * 60 * 60 * 1000;

export function presenceTier({ isOnline = false, lastSeenAt } = {}) {
  if (isOnline) return "online";

  const date = parseApiDate(lastSeenAt);
  if (!date) return "offline";

  const ageMs = Date.now() - date.getTime();
  if (ageMs >= OFFLINE_AFTER_MS) return "offline";

  return "recent";
}

export function formatPresenceLabel({ isOnline = false, lastSeenAt } = {}) {
  if (isOnline) return "Đang online";

  const date = parseApiDate(lastSeenAt);
  if (!date) return "Ngoại tuyến";

  const ageMs = Date.now() - date.getTime();
  if (ageMs >= OFFLINE_AFTER_MS) return "Ngoại tuyến";

  const relative = formatRelativeTime(lastSeenAt);
  if (!relative) return "Ngoại tuyến";

  return `Hoạt động ${relative}`;
}

export function mapPresenceFields(dto = {}) {
  const isOnline = dto.otherUserIsOnline ?? dto.OtherUserIsOnline ?? false;
  const lastSeenAt = dto.otherUserLastSeenAt ?? dto.OtherUserLastSeenAt ?? null;
  const presence = { isOnline, lastSeenAt };

  return {
    online: isOnline,
    lastSeenAt,
    presenceTier: presenceTier(presence),
    presenceLabel: formatPresenceLabel(presence),
  };
}

export function applyPresenceUpdate(conversation, presenceDto) {
  if (!conversation || !presenceDto) return conversation;

  const userId = presenceDto.userId ?? presenceDto.UserId;
  if (userId == null || String(conversation.otherUserId) !== String(userId)) {
    return conversation;
  }

  const isOnline = presenceDto.isOnline ?? presenceDto.IsOnline ?? false;
  const lastSeenAt = presenceDto.lastSeenAt ?? presenceDto.LastSeenAt ?? null;
  const presence = { isOnline, lastSeenAt };

  return {
    ...conversation,
    online: isOnline,
    lastSeenAt,
    presenceTier: presenceTier(presence),
    presenceLabel: formatPresenceLabel(presence),
  };
}
