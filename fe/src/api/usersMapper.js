import { resolveAssetUrl } from "@/api/assetUrl";

export function mapUserSearchResult(dto) {
  const displayName = dto.fullName?.trim() || dto.username || "User";

  return {
    id: dto.userId,
    userId: dto.userId,
    username: dto.username,
    displayName,
    fullName: displayName,
    avatarUrl: resolveAssetUrl(dto.avatarUrl) ?? null,
    level: (dto.levelName ?? "Bronze").toUpperCase(),
    initial: displayName.charAt(0).toUpperCase(),
    isFollowing: Boolean(dto.isFollowing),
  };
}

export function mapFollowListItem(dto) {
  return mapUserSearchResult(dto);
}
