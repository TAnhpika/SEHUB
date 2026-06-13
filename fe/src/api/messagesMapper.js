import { resolveAssetUrl } from "@/api/assetUrl";

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
  if (!date) return "—";

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
  const date = parseApiDate(isoDate);
  if (!date) return "—";
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
  const id = dto.id ?? dto.Id;
  const sentAt = dto.sentAt ?? dto.SentAt;
  const content = dto.content ?? dto.Content ?? "";
  const isMine = dto.isMine ?? dto.IsMine ?? false;
  const senderId = dto.senderId ?? dto.SenderId;
  const messageType = String(dto.messageType ?? dto.MessageType ?? "Text").toLowerCase();
  const attachmentUrl = resolveAssetUrl(dto.attachmentUrl ?? dto.AttachmentUrl);
  const attachmentFileName = dto.attachmentFileName ?? dto.AttachmentFileName ?? null;
  const attachmentMimeType = dto.attachmentMimeType ?? dto.AttachmentMimeType ?? null;
  const attachmentSizeBytes = dto.attachmentSizeBytes ?? dto.AttachmentSizeBytes ?? null;

  const mapped = {
    id,
    type: isMine ? "sent" : "received",
    messageType,
    text: content,
    time: formatMessageTime(sentAt),
    sentAt,
    senderId,
    attachmentUrl,
    attachmentFileName,
    attachmentMimeType,
    attachmentSizeBytes,
  };

  return {
    ...mapped,
    previewText: getMessagePreview(mapped),
  };
}

export function getMessagePreview(message) {
  if (message.messageType === "image") {
    return message.text?.trim() || "[Ảnh]";
  }

  if (message.messageType === "file") {
    return message.text?.trim() || `[Tệp] ${message.attachmentFileName || "đính kèm"}`;
  }

  return message.text ?? "";
}

export function appendMessageIfNew(messages, message) {
  if (!message?.id) {
    return messages;
  }

  if (messages.some((item) => item.id === message.id)) {
    return messages;
  }

  return [...messages, message];
}

export function mapMessages(items = []) {
  return items.map(mapMessageItem);
}
