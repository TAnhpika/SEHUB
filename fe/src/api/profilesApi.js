import { apiRequest } from "./httpClient";

export function getProfileByUsername(username) {
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(username)}`);
}

export function updateMyProfile(body) {
  return apiRequest("/api/v1/profiles/me", { method: "PUT", body });
}

export function getMyStats() {
  return apiRequest("/api/v1/profiles/me/stats");
}
