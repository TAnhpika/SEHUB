import { apiRequest } from "./httpClient";

export function getBadges() {
  return apiRequest("/api/v1/gamification/badges", { auth: false });
}

export function getMyDailyMissions() {
  return apiRequest("/api/v1/gamification/me/daily-missions");
}

export function mapBadgeCatalogItem(dto) {
  return {
    id: dto.id,
    code: dto.code,
    title: dto.name,
    description: dto.description,
  };
}
