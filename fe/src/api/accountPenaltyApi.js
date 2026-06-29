import { apiRequest } from "@/api/httpClient";

export function getAccountPenalty(penaltyId) {
  return apiRequest(`/api/v1/users/me/penalties/${encodeURIComponent(penaltyId)}`);
}

export function getLatestAccountPenalty(penaltyType) {
  const params = penaltyType ? `?type=${encodeURIComponent(penaltyType)}` : "";
  return apiRequest(`/api/v1/users/me/penalties/latest${params}`);
}
