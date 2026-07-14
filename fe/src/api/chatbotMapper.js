export function mapChatbotSettingsDto(dto) {
  if (!dto) return null;
  return {
    systemPrompt: dto.systemPrompt ?? "",
    welcomeMessage: dto.welcomeMessage ?? "",
    isEnabled: Boolean(dto.isEnabled),
  };
}

export function mapChatbotConversationDto(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    title: dto.title ?? "",
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? null,
  };
}

export function mapChatbotMessageDto(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    role: dto.role ?? "user",
    text: dto.text ?? "",
    createdAt: dto.createdAt,
  };
}

export function mapChatbotReplyResponse(dto) {
  if (!dto) return null;
  return {
    conversationId: dto.conversationId,
    reply: dto.reply ?? "",
    tokensUsed: dto.tokensUsed ?? 0,
    remainingTokens: dto.remainingTokens ?? 0,
    messages: Array.isArray(dto.messages) ? dto.messages.map(mapChatbotMessageDto).filter(Boolean) : [],
  };
}

export function mapChatbotKnowledgeEntryDto(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    title: dto.title ?? "",
    content: dto.content ?? "",
    tags: dto.tags ?? "",
    isActive: Boolean(dto.isActive),
    sortOrder: dto.sortOrder ?? 0,
  };
}

export function mapAdminChatbotConversationDto(dto) {
  if (!dto) return null;
  const username = dto.username ?? "";
  const displayName = dto.displayName ?? "";
  return {
    id: dto.id,
    userId: dto.userId,
    username,
    displayName,
    userLabel: displayName || username || "Người dùng không rõ",
    title: dto.title ?? "",
    createdAt: dto.createdAt,
    messageCount: dto.messageCount ?? 0,
  };
}
