import * as messagesApi from "@/api/messagesApi";
import { mapConversationListItem, mapMessages } from "@/api/messagesMapper";

export async function loadConversations() {
  const items = await messagesApi.getConversations();
  return (items ?? []).map(mapConversationListItem);
}

export async function loadUnreadCount() {
  const data = await messagesApi.getUnreadCount();
  return data?.totalUnread ?? 0;
}

export async function openConversationWithUser(userId) {
  const dto = await messagesApi.getOrCreateConversation(userId);
  return mapConversationListItem(dto);
}

export async function loadConversationMessages(
  conversationId,
  { page = 1, pageSize = 50, currentUserId } = {},
) {
  const data = await messagesApi.getMessages(conversationId, { page, pageSize });
  return {
    items: mapMessages(data?.items ?? [], { currentUserId }),
    totalCount: data?.totalCount ?? 0,
  };
}

export async function sendConversationMessage(conversationId, content, { currentUserId } = {}) {
  const dto = await messagesApi.sendMessage(conversationId, content);
  return mapMessages([dto], { currentUserId })[0];
}

export async function sendConversationAttachment(
  conversationId,
  file,
  content = "",
  { currentUserId } = {},
) {
  const dto = await messagesApi.sendMessageAttachment(conversationId, file, content);
  return mapMessages([dto], { currentUserId })[0];
}

export async function markConversationAsRead(conversationId) {
  await messagesApi.markConversationRead(conversationId);
}

export async function deleteConversationHistory(conversationId) {
  await messagesApi.deleteConversation(conversationId);
}
