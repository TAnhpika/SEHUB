const LEVEL_TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];

function deriveNextLevelLabel(levelName = "") {
  const normalized = levelName.trim().toLowerCase();
  const index = LEVEL_TIERS.findIndex((tier) => tier.toLowerCase() === normalized);
  if (index >= 0 && index < LEVEL_TIERS.length - 1) {
    return LEVEL_TIERS[index + 1];
  }
  return "Silver";
}

export function computeProgress(points, nextLevelPoints) {
  if (nextLevelPoints == null || nextLevelPoints <= 0) {
    return { pointsToNext: 0, levelProgress: 100 };
  }

  const safePoints = Math.max(0, points ?? 0);
  const pointsToNext = Math.max(0, nextLevelPoints - safePoints);
  const levelProgress = Math.min(100, Math.round((safePoints / nextLevelPoints) * 100));

  return { pointsToNext, levelProgress };
}

function formatProfilePostDate(publishedAt) {
  if (!publishedAt) return "—";

  const match = String(publishedAt).match(/^(\d+) tháng (\d+), (\d+)$/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }

  const date = new Date(publishedAt);
  if (!Number.isNaN(date.getTime())) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return String(publishedAt);
}

export function mapBadgesForSection(catalog, earnedBadges = []) {
  const earnedCodes = new Set(
    earnedBadges.map((badge) => badge.code?.toLowerCase()).filter(Boolean),
  );
  const earnedNames = new Set(
    earnedBadges.map((badge) => badge.name?.toLowerCase()).filter(Boolean),
  );

  return catalog.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    unlocked:
      earnedCodes.has(item.code?.toLowerCase()) ||
      earnedNames.has(item.title?.toLowerCase()),
  }));
}

export function mapProfileRecentPost(post) {
  return {
    id: post.id,
    title: post.title,
    date: formatProfilePostDate(post.publishedAt ?? post.timeAgo),
    comments: post.comments ?? 0,
    likes: post.likes ?? 0,
  };
}

export function mapProfileCard(dto, statsDto = null, { postsCount = 0 } = {}) {
  const displayName = dto.displayName?.trim() || dto.username || "User";
  const points = statsDto?.points ?? dto.points ?? 0;
  const levelName = statsDto?.levelName ?? dto.levelName ?? "Bronze";
  const streakCount = statsDto?.streakCount ?? 0;
  const { pointsToNext, levelProgress } = computeProgress(points, statsDto?.nextLevelPoints);

  return {
    userId: dto.userId,
    username: dto.username,
    displayName,
    initial: displayName.charAt(0).toUpperCase(),
    level: levelName.toUpperCase(),
    nextLevel: deriveNextLevelLabel(levelName),
    pointsToNext,
    levelProgress,
    followers: dto.followersCount ?? 0,
    following: dto.followingCount ?? 0,
    isFollowing: dto.isFollowing ?? false,
    stats: {
      points,
      exams: 0,
      comments: 0,
      posts: postsCount,
    },
    joinedAgo: "—",
    updatedAgo: "—",
    streakCount,
    totalActivities: streakCount,
    bio: dto.bio ?? "",
    major: dto.major ?? "",
    semester: dto.semester ?? "",
    avatarUrl: dto.avatarUrl ?? null,
  };
}

export function mapProfileStatsToAuthUser(user, statsDto) {
  if (!user || !statsDto) return user;

  const points = statsDto.points ?? user.points ?? 0;
  const { pointsToNext, levelProgress } = computeProgress(points, statsDto.nextLevelPoints);

  return {
    ...user,
    points,
    level: statsDto.levelName ?? user.level,
    streak: statsDto.streakCount ?? 0,
    levelProgress,
    pointsToNext,
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
