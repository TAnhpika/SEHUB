import { getActiveRankThresholds } from "@/features/admin/gamification/adminGamificationData";

/** Cấp độ gamification — §3.6 SEHUB_PhanTichNghiepVu */
export const RANK_LEVELS = ["Bronze", "Silver", "Gold", "Platinum"];

const FALLBACK_THRESHOLDS = [
  { name: "Bronze", minPoints: 0 },
  { name: "Silver", minPoints: 240 },
  { name: "Gold", minPoints: 920 },
  { name: "Platinum", minPoints: 2150 },
];

function getRankConfig() {
  const fromStore = getActiveRankThresholds();
  return fromStore.length > 0 ? fromStore : FALLBACK_THRESHOLDS;
}

function resolveLevelByPoints(points) {
  const tiers = getRankConfig();
  let current = tiers[0]?.name ?? "Bronze";
  for (const tier of tiers) {
    if (points >= tier.minPoints) current = tier.name;
  }
  const index = tiers.findIndex((t) => t.name === current);
  const nextLevel = index >= 0 && index < tiers.length - 1 ? tiers[index + 1].name : null;
  const nextThreshold =
    nextLevel != null ? tiers.find((t) => t.name === nextLevel)?.minPoints : null;
  const levelProgress =
    nextThreshold != null
      ? Math.min(99, Math.round(((points - tiers[index].minPoints) / (nextThreshold - tiers[index].minPoints)) * 100))
      : 100;
  return { level: current, nextLevel, levelProgress };
}

/**
 * @param {{ id?: string, username?: string, role?: string } | null | undefined} user
 */
export function getUserGamification(user) {
  if (!user || user.role !== "student") return null;

  if (user.username === "anhcoding12345") {
    const resolved = resolveLevelByPoints(240);
    return {
      level: resolved.level,
      points: 240,
      streak: 7,
      levelProgress: resolved.levelProgress,
      nextLevel: resolved.nextLevel,
    };
  }

  const n = parseInt(String(user.id).replace(/\D/g, ""), 10) || 1;
  const tiers = getRankConfig();
  const tier = tiers[(n - 1) % tiers.length];
  const points = tier.minPoints + ((n * 53) % 180);
  const streak = (n % 12) + 1;
  const resolved = resolveLevelByPoints(points);

  return {
    level: resolved.level,
    points,
    streak,
    levelProgress: resolved.levelProgress,
    nextLevel: resolved.nextLevel,
  };
}

/** @param {string} level */
export function getRankBadgeClass(level) {
  const key = level?.toLowerCase();
  if (key === "bronze") return "rankBronze";
  if (key === "silver") return "rankSilver";
  if (key === "gold") return "rankGold";
  if (key === "platinum") return "rankPlatinum";
  return "badgeMuted";
}
