import { apiRequest, apiUploadRequest } from "./httpClient";

export function getProfileActivityByUsername(username, { months = 6 } = {}) {
  const params = new URLSearchParams({ months: String(months) });
  return apiRequest(
    `/api/v1/profiles/${encodeURIComponent(username)}/activity?${params.toString()}`,
  );
}

export function getProfileByUsername(username) {
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(username)}`);
}

export function getProfileStatsByUsername(username) {
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(username)}/stats`);
}

export function getProfilePostsByUsername(username, { page = 1, pageSize = 5 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest(
    `/api/v1/profiles/${encodeURIComponent(username)}/posts?${params.toString()}`,
  );
}

export function updateMyProfile(body) {
  return apiRequest("/api/v1/profiles/me", { method: "PUT", body });
}

export function getMyStats() {
  return apiRequest("/api/v1/profiles/me/stats");
}

export function uploadMyAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUploadRequest("/api/v1/profiles/me/avatar", formData);
}
