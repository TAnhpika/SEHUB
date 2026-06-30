import { buildInitials } from "@/api/messagesMapper";

export function mapBlockedUserListItem(dto) {
  const displayName = dto.fullName?.trim() || dto.username || "User";

  return {
    userId: dto.userId,
    conversationId: dto.conversationId ?? null,
    name: displayName,
    username: dto.username,
    initials: buildInitials(displayName),
    avatarUrl: dto.avatarUrl ?? null,
    avatarBg: "#fee2e2",
    avatarColor: "#dc2626",
    blockedAt: dto.blockedAt,
    preview: "Đã chặn",
    time: "",
    unread: 0,
    online: false,
    lastSeenAt: null,
    presenceLabel: "",
    presenceTier: "offline",
  };
}

export function blockedUserToConversation(item) {
  if (!item) return null;

  return {
    id: item.conversationId ?? item.userId,
    conversationId: item.conversationId ?? item.userId,
    otherUserId: item.userId,
    name: item.name,
    username: item.username,
    initials: item.initials,
    avatarUrl: item.avatarUrl,
    avatarBg: item.avatarBg,
    avatarColor: item.avatarColor,
    preview: item.preview,
    time: item.time,
    unread: 0,
    typing: false,
    messages: [],
    online: false,
    lastSeenAt: null,
    presenceLabel: "",
    presenceTier: "offline",
    isBlockedEntry: true,
  };
}
