const LEVEL_TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];

function deriveNextLevelLabel(levelName = "") {
  const normalized = levelName.trim().toLowerCase();
  const index = LEVEL_TIERS.findIndex((tier) => tier.toLowerCase() === normalized);
  if (index >= 0 && index < LEVEL_TIERS.length - 1) {
    return LEVEL_TIERS[index + 1];
  }
  return "Silver";
}

function computeProgress(points, nextLevelPoints) {
  if (nextLevelPoints == null || nextLevelPoints <= 0) {
    return { pointsToNext: 0, levelProgress: 100 };
  }

  const safePoints = Math.max(0, points ?? 0);
  const pointsToNext = Math.max(0, nextLevelPoints - safePoints);
  const levelProgress = Math.min(100, Math.round((safePoints / nextLevelPoints) * 100));

  return { pointsToNext, levelProgress };
}

export function mapProfileCard(dto, statsDto = null) {
  const displayName = dto.displayName?.trim() || dto.username || "User";
  const points = statsDto?.points ?? dto.points ?? 0;
  const levelName = statsDto?.levelName ?? dto.levelName ?? "Bronze";
  const { pointsToNext, levelProgress } = computeProgress(points, statsDto?.nextLevelPoints);

  return {
    username: dto.username,
    displayName,
    initial: displayName.charAt(0).toUpperCase(),
    level: levelName.toUpperCase(),
    nextLevel: deriveNextLevelLabel(levelName),
    pointsToNext,
    levelProgress,
    followers: 0,
    following: 0,
    stats: {
      points,
      exams: 0,
      comments: 0,
      posts: 0,
    },
    joinedAgo: "—",
    updatedAgo: "—",
    totalActivities: statsDto?.streakCount ?? statsDto?.badgesCount ?? 0,
    bio: dto.bio ?? "",
    major: dto.major ?? "",
    semester: dto.semester ?? "",
    avatarUrl: dto.avatarUrl ?? null,
  };
}

export function mapProfileToForm(dto, authUser, localOverrides = {}) {
  return {
    email: authUser?.email ?? localOverrides.email ?? "",
    username: dto.username ?? localOverrides.username ?? "",
    fullName: dto.displayName?.trim() || localOverrides.fullName || "",
    gender: localOverrides.gender ?? "other",
    dateOfBirth: localOverrides.dateOfBirth ?? "",
    phone: localOverrides.phone ?? "",
    major: dto.major ?? localOverrides.major ?? "",
    address: localOverrides.address ?? "",
    bio: dto.bio ?? localOverrides.bio ?? "",
  };
}

export function mapFormToUpdateRequest(form) {
  return {
    displayName: form.fullName?.trim(),
    bio: form.bio ?? "",
    major: form.major ?? "",
  };
}
