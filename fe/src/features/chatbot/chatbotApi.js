import {
  getChatbotConversation,
  getChatbotSettings,
  listChatbotConversations,
  sendChatbotMessage,
} from "@/api/chatbotApi";
import {
  mapChatbotConversationDto,
  mapChatbotReplyResponse,
  mapChatbotSettingsDto,
} from "@/api/chatbotMapper";

export async function loadChatbotSettings() {
  const dto = await getChatbotSettings();
  return mapChatbotSettingsDto(dto);
}

export async function loadChatbotConversations() {
  const list = await listChatbotConversations();
  return Array.isArray(list) ? list.map(mapChatbotConversationDto).filter(Boolean) : [];
}

export async function loadChatbotConversation(conversationId) {
  const dto = await getChatbotConversation(conversationId);
  return mapChatbotReplyResponse(dto);
}

export async function sendAdvisorMessage(message, conversationId) {
  const dto = await sendChatbotMessage({
    message,
    conversationId: conversationId ?? undefined,
  });
  return mapChatbotReplyResponse(dto);
}
