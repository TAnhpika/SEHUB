import { apiRequest } from "@/api/httpClient";

export function searchUsers(query, { page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest(`/api/v1/users/search?${params.toString()}`);
}

export function getMentionFriends({ search = "", limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("limit", String(limit));
  const qs = params.toString();
  return apiRequest(`/api/v1/users/me/mention-friends${qs ? `?${qs}` : ""}`);
}
