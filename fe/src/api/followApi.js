import { apiRequest } from "@/api/httpClient";

export function followUser(userId) {
  return apiRequest(`/api/v1/users/${encodeURIComponent(userId)}/follow`, { method: "POST", body: {} });
}

export function unfollowUser(userId) {
  return apiRequest(`/api/v1/users/${encodeURIComponent(userId)}/follow`, { method: "DELETE" });
}

export function getFollowStatus(userId) {
  return apiRequest(`/api/v1/users/${encodeURIComponent(userId)}/follow-status`);
}

export function getFollowers(userId, { page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest(`/api/v1/users/${encodeURIComponent(userId)}/followers?${params.toString()}`);
}

export function getFollowing(userId, { page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest(`/api/v1/users/${encodeURIComponent(userId)}/following?${params.toString()}`);
}
