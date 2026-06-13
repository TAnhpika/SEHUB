import { apiRequest } from "@/api/httpClient";

export function blockUser(userId) {
  return apiRequest(`/api/v1/users/${encodeURIComponent(userId)}/block`, {
    method: "POST",
    body: {},
  });
}

export function unblockUser(userId) {
  return apiRequest(`/api/v1/users/${encodeURIComponent(userId)}/block`, {
    method: "DELETE",
  });
}

export function getBlockStatus(userId) {
  return apiRequest(`/api/v1/users/${encodeURIComponent(userId)}/block-status`);
}
