import { apiRequest } from "./httpClient";

export function getBadges() {
  return apiRequest("/api/v1/gamification/badges");
}

export function mapBadgeCatalogItem(dto) {
  return {
    id: dto.id,
    code: dto.code,
    title: dto.name,
    description: dto.description,
  };
}
