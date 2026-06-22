import { apiRequest } from "./httpClient";

export function getChatbotSettings() {
  return apiRequest("/api/v1/chatbot/settings");
}

export function listChatbotConversations() {
  return apiRequest("/api/v1/chatbot/conversations");
}

export function getChatbotConversation(conversationId) {
  return apiRequest(`/api/v1/chatbot/conversations/${conversationId}`);
}

export function sendChatbotMessage(body, options = {}) {
  return apiRequest("/api/v1/chatbot/messages", {
    method: "POST",
    body,
    signal: options.signal,
  });
}

export function getAdminChatbotSettings() {
  return apiRequest("/api/v1/admin/chatbot/settings");
}

export function updateAdminChatbotSettings(body) {
  return apiRequest("/api/v1/admin/chatbot/settings", {
    method: "PUT",
    body,
  });
}

export function listAdminChatbotKnowledge() {
  return apiRequest("/api/v1/admin/chatbot/knowledge");
}

export function createAdminChatbotKnowledge(body) {
  return apiRequest("/api/v1/admin/chatbot/knowledge", {
    method: "POST",
    body,
  });
}

export function updateAdminChatbotKnowledge(id, body) {
  return apiRequest(`/api/v1/admin/chatbot/knowledge/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteAdminChatbotKnowledge(id) {
  return apiRequest(`/api/v1/admin/chatbot/knowledge/${id}`, {
    method: "DELETE",
  });
}

export function listAdminChatbotConversations() {
  return apiRequest("/api/v1/admin/chatbot/conversations");
}

export function getAdminChatbotConversationMessages(conversationId) {
  return apiRequest(`/api/v1/admin/chatbot/conversations/${conversationId}/messages`);
}
