import { apiRequest } from "@/api/httpClient";

export function getNotifications({ page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest(`/api/v1/notifications?${params.toString()}`);
}

export function getNotificationUnreadCount() {
  return apiRequest("/api/v1/notifications/unread-count");
}

export function markNotificationRead(notificationId) {
  return apiRequest(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "POST",
    body: {},
  });
}

export function markAllNotificationsRead() {
  return apiRequest("/api/v1/notifications/read-all", {
    method: "POST",
    body: {},
  });
}
