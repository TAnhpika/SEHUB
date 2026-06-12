function formatRelativeTime(isoDate) {
  if (!isoDate) return "—";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày`;

  return date.toLocaleDateString("vi-VN");
}

function formatMessageTime(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function buildInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase() || "?";
}

export function mapConversationListItem(dto) {
  const displayName = dto.otherFullName?.trim() || dto.otherUsername || "User";

  return {
    id: dto.conversationId,
    conversationId: dto.conversationId,
    otherUserId: dto.otherUserId,
    name: displayName,
    username: dto.otherUsername,
    initials: buildInitials(displayName),
    avatarUrl: dto.otherAvatarUrl ?? null,
    avatarBg: "#dbeafe",
    avatarColor: "#2563eb",
    preview: dto.lastMessagePreview ?? "Chưa có tin nhắn",
    time: formatRelativeTime(dto.lastMessageAt),
    unread: dto.unreadCount ?? 0,
    online: false,
    typing: false,
    messages: [],
  };
}

export function mapMessageItem(dto) {
  return {
    id: dto.id,
    type: dto.isMine ? "sent" : "received",
    text: dto.content,
    time: formatMessageTime(dto.sentAt),
    sentAt: dto.sentAt,
    senderId: dto.senderId,
  };
}

export function mapMessages(items = []) {
  return items.map(mapMessageItem);
}
