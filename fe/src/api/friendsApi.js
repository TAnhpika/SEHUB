import { apiRequest } from "@/api/httpClient";

export function sendFriendRequest(targetUserId) {
  return apiRequest("/api/v1/friends/request", {
    method: "POST",
    body: { targetUserId },
  });
}

export function acceptFriendRequest(requestId) {
  return apiRequest("/api/v1/friends/accept", {
    method: "POST",
    body: { requestId },
  });
}

export function rejectFriendRequest(requestId) {
  return apiRequest("/api/v1/friends/reject", {
    method: "POST",
    body: { requestId },
  });
}

export function cancelFriendRequest(requestId) {
  return apiRequest(`/api/v1/friends/cancel?requestId=${encodeURIComponent(requestId)}`, {
    method: "DELETE",
  });
}

export function unfriend(userId) {
  return apiRequest(`/api/v1/friends/unfriend?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export function getFriendRequests(direction = "incoming") {
  return apiRequest(`/api/v1/friends/requests?direction=${encodeURIComponent(direction)}`);
}

export function getFriends({ page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest(`/api/v1/friends?${params.toString()}`);
}

export function getFriendStatus(userId) {
  return apiRequest(`/api/v1/friends/status/${encodeURIComponent(userId)}`);
}
