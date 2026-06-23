import { apiRequest } from "@/api/httpClient";

export function searchUsers(query, { page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest(`/api/v1/users/search?${params.toString()}`);
}
