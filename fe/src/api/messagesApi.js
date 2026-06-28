import { apiRequest, apiUploadRequest } from "@/api/httpClient";

export function getConversations() {
  return apiRequest("/api/v1/conversations");
}

export function getUnreadCount() {
  return apiRequest("/api/v1/conversations/unread-count");
}

export function getOrCreateConversation(userId) {
  return apiRequest(`/api/v1/conversations/with/${encodeURIComponent(userId)}`, {
    method: "POST",
    body: {},
  });
}

export function getMessages(conversationId, { page = 1, pageSize = 50 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`,
  );
}

export function sendMessage(conversationId, content) {
  return apiRequest(`/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    body: { content },
  });
}

export function sendMessageAttachment(conversationId, file, content = "") {
  const formData = new FormData();
  formData.append("file", file);
  if (content?.trim()) {
    formData.append("content", content.trim());
  }

  return apiUploadRequest(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/attachment`,
    formData,
  );
}

export function markConversationRead(conversationId) {
  return apiRequest(`/api/v1/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: "POST",
    body: {},
  });
}

export function deleteConversation(conversationId) {
  return apiRequest(`/api/v1/conversations/${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
  });
}

export function reportConversation(conversationId, { reason, detail }) {
  return apiRequest(`/api/v1/conversations/${encodeURIComponent(conversationId)}/report`, {
    method: "POST",
    body: { reason, detail },
  });
}
