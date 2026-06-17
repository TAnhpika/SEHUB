import { apiRequest } from "./httpClient";

export function getMyAiTokens() {
  return apiRequest("/api/v1/profiles/me/ai-tokens");
}
