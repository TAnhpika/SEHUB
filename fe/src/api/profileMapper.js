import { resolveAssetUrl } from "@/api/assetUrl";

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

function formatRelativeTimeVi(isoDate) {
  if (!isoDate) return "—";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Hôm nay";
  if (diffDays === 1) return "1 ngày trước";
  if (diffDays < 30) return `${diffDays} ngày trước`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} tháng trước`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} năm trước`;
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
    date: formatProfilePostDate(post.createdAt ?? post.publishedAt ?? post.timeAgo),
    comments: post.commentCount ?? post.comments ?? 0,
    likes: post.likeCount ?? post.likes ?? 0,
  };
}

export function mapProfileCard(dto, statsDto = null) {
  const displayName = dto.displayName?.trim() || dto.username || "User";
  const points = statsDto?.points ?? dto.points ?? 0;
  const streakCount = statsDto?.streakCount ?? dto.streakCount ?? 0;
  const levelName = statsDto?.levelName ?? dto.levelName ?? "Bronze";
  const nextLevelName = statsDto?.nextLevelName ?? deriveNextLevelLabel(levelName);
  const nextLevelPoints = statsDto?.nextLevelPoints ?? dto.nextLevelPoints;
  const { pointsToNext, levelProgress } = computeProgress(points, nextLevelPoints);

  return {
    userId: dto.userId,
    username: dto.username,
    displayName,
    initial: displayName.charAt(0).toUpperCase(),
    level: levelName.toUpperCase(),
    nextLevel: nextLevelName,
    pointsToNext,
    levelProgress,
    followers: dto.followersCount ?? 0,
    following: dto.followingCount ?? 0,
    isFollowing: dto.isFollowing ?? false,
    stats: {
      points,
      exams: statsDto?.examsCompleted ?? 0,
      comments: statsDto?.commentsCount ?? 0,
      posts: statsDto?.postsCount ?? 0,
    },
    joinedAgo: formatRelativeTimeVi(dto.memberSince),
    updatedAgo: formatRelativeTimeVi(dto.profileUpdatedAt),
    streakCount,
    totalActivities: streakCount,
    bio: dto.bio ?? "",
    major: dto.major ?? "",
    semester: dto.semester ?? "",
    avatarUrl: resolveAssetUrl(dto.avatarUrl),
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
    gender: dto.gender ?? localOverrides.gender ?? "other",
    dateOfBirth: dto.dateOfBirth ?? localOverrides.dateOfBirth ?? "",
    phone: dto.phone ?? localOverrides.phone ?? "",
    major: dto.major ?? localOverrides.major ?? "",
    address: dto.address ?? localOverrides.address ?? "",
    bio: dto.bio ?? localOverrides.bio ?? "",
    avatarUrl: resolveAssetUrl(dto.avatarUrl) ?? localOverrides.avatarUrl ?? null,
  };
}

export function mapFormToUpdateRequest(form) {
  return {
    displayName: form.fullName?.trim(),
    bio: form.bio ?? "",
    major: form.major ?? "",
    gender: form.gender ?? "other",
    dateOfBirth: form.dateOfBirth || null,
    phone: form.phone?.trim() || null,
    address: form.address?.trim() || null,
  };
}

const HEATMAP_WEEKS = 26;
const HEATMAP_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HEATMAP_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function mapProfileActivityToHeatmap(activityDto) {
  if (!activityDto?.days?.length) {
    return null;
  }

  const levelByDate = new Map(
    activityDto.days.map((day) => [day.date, day.level ?? 0]),
  );
  const countByDate = new Map(
    activityDto.days.map((day) => [day.date, day.count ?? 0]),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (HEATMAP_WEEKS * 7 - 1));

  const cells = [];
  const months = Array(HEATMAP_WEEKS).fill("");
  let lastMonth = null;

  for (let week = 0; week < HEATMAP_WEEKS; week += 1) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + week * 7);
    const month = weekStart.getMonth();
    if (month !== lastMonth) {
      months[week] = HEATMAP_MONTHS[month];
      lastMonth = month;
    }

    for (let day = 0; day < 7; day += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + day);
      const isoDate = formatIsoDate(date);
      cells.push({
        week,
        day,
        level: levelByDate.get(isoDate) ?? 0,
        date: isoDate,
        count: countByDate.get(isoDate) ?? 0,
      });
    }
  }

  return {
    months,
    dayLabels: HEATMAP_DAY_LABELS,
    cells,
    totalActivities: activityDto.totalActivities ?? 0,
  };
}

export function mapAiTokenStatusDto(dto) {
  return {
    limit: Number(dto?.limit ?? 0),
    used: Number(dto?.used ?? 0),
    remaining: Number(dto?.remaining ?? 0),
    costExplain: Number(dto?.costExplain ?? 10),
    costChat: Number(dto?.costChat ?? 10),
    canExplain: Boolean(dto?.canExplain),
    canChat: Boolean(dto?.canChat),
  };
}
