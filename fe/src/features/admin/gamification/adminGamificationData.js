import {
  RANK_COLORS,
  validateBadgePayload,
  validatePointRulePayload,
  validateRankPayload,
} from "@/features/admin/gamification/adminGamificationPolicy";
import * as adminApi from "@/api/adminApi";
import {
  mapBadgeAdminDto,
  mapLevelConfigToRankTier,
  mapRankTiersToUpdateLevelsRequest,
} from "@/api/adminMapper";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function nowIso() {
  return new Date().toISOString();
}

/** @typedef {{ id: string, slug: string, name: string, minPoints: number, sortOrder: number, colorKey: string, voucherDiscount: number | null, rewardLabel: string, description: string, active: boolean, updatedAt: string }} RankTier */
/** @typedef {{ id: string, slug: string, name: string, description: string, category: string, triggerType: string, triggerValue: number, pointsReward: number, icon: string, active: boolean, unlockCount: number, createdAt: string, updatedAt: string }} Badge */
/** @typedef {{ id: string, slug: string, name: string, eventType: string, points: number, intervalDays: number | null, description: string, active: boolean, updatedAt: string }} PointRule */

/** @type {RankTier[]} */
let ranksStore = [
  {
    id: "rank-bronze",
    slug: "bronze",
    name: "Bronze",
    minPoints: 0,
    sortOrder: 1,
    colorKey: "bronze",
    voucherDiscount: null,
    rewardLabel: "",
    description: "Cấp mặc định khi mới tham gia",
    active: true,
    updatedAt: "2026-06-01T08:00:00",
  },
  {
    id: "rank-silver",
    slug: "silver",
    name: "Silver",
    minPoints: 240,
    sortOrder: 2,
    colorKey: "silver",
    voucherDiscount: null,
    rewardLabel: "",
    description: "Sinh viên tích cực tham gia cộng đồng",
    active: true,
    updatedAt: "2026-06-01T08:00:00",
  },
  {
    id: "rank-gold",
    slug: "gold",
    name: "Gold",
    minPoints: 920,
    sortOrder: 3,
    colorKey: "gold",
    voucherDiscount: 10,
    rewardLabel: "Voucher FTES 10%",
    description: "Ưu đãi giảm 10% gói Premium",
    active: true,
    updatedAt: "2026-06-01T08:00:00",
  },
  {
    id: "rank-platinum",
    slug: "platinum",
    name: "Platinum",
    minPoints: 2150,
    sortOrder: 4,
    colorKey: "platinum",
    voucherDiscount: 20,
    rewardLabel: "Voucher FTES 20%",
    description: "Ưu đãi giảm 20% gói Premium",
    active: true,
    updatedAt: "2026-06-01T08:00:00",
  },
];

/** @type {Badge[]} */
let badgesStore = [
  {
    id: "badge-001",
    slug: "first-blogger",
    name: "First Blogger",
    description: "Đăng bài viết đầu tiên lên cộng đồng SEHub",
    category: "community",
    triggerType: "post_count",
    triggerValue: 1,
    pointsReward: 50,
    icon: "📝",
    active: true,
    unlockCount: 1284,
    createdAt: "2026-05-01T10:00:00",
    updatedAt: "2026-05-01T10:00:00",
  },
  {
    id: "badge-002",
    slug: "fresh-dev",
    name: "Fresh Dev",
    description: "Nộp bài thực hành đầu tiên qua GitHub URL",
    category: "learning",
    triggerType: "practice_submit_count",
    triggerValue: 1,
    pointsReward: 80,
    icon: "💻",
    active: true,
    unlockCount: 892,
    createdAt: "2026-05-01T10:00:00",
    updatedAt: "2026-05-01T10:00:00",
  },
  {
    id: "badge-003",
    slug: "active-learner",
    name: "Active Learner",
    description: "Duy trì streak học tập 7 ngày liên tiếp",
    category: "streak",
    triggerType: "streak_days",
    triggerValue: 7,
    pointsReward: 120,
    icon: "🔥",
    active: true,
    unlockCount: 456,
    createdAt: "2026-05-01T10:00:00",
    updatedAt: "2026-05-01T10:00:00",
  },
  {
    id: "badge-004",
    slug: "exam-ace",
    name: "Exam Ace",
    description: "Hoàn thành 10 đề trắc nghiệm Premium",
    category: "exam",
    triggerType: "exam_complete_count",
    triggerValue: 10,
    pointsReward: 200,
    icon: "🎯",
    active: true,
    unlockCount: 312,
    createdAt: "2026-05-01T10:00:00",
    updatedAt: "2026-05-01T10:00:00",
  },
  {
    id: "badge-005",
    slug: "community-star",
    name: "Community Star",
    description: "Nhận 50 lượt like trên các bài viết",
    category: "social",
    triggerType: "like_received_count",
    triggerValue: 50,
    pointsReward: 150,
    icon: "⭐",
    active: true,
    unlockCount: 178,
    createdAt: "2026-05-01T10:00:00",
    updatedAt: "2026-05-01T10:00:00",
  },
  {
    id: "badge-006",
    slug: "helpful-voice",
    name: "Helpful Voice",
    description: "Viết 25 bình luận có ích trên bài viết",
    category: "social",
    triggerType: "comment_count",
    triggerValue: 25,
    pointsReward: 100,
    icon: "💬",
    active: true,
    unlockCount: 245,
    createdAt: "2026-05-01T10:00:00",
    updatedAt: "2026-05-01T10:00:00",
  },
  {
    id: "badge-007",
    slug: "rising-influencer",
    name: "Rising Influencer",
    description: "Đạt 20 người theo dõi",
    category: "social",
    triggerType: "follower_count",
    triggerValue: 20,
    pointsReward: 180,
    icon: "📣",
    active: true,
    unlockCount: 94,
    createdAt: "2026-05-01T10:00:00",
    updatedAt: "2026-05-01T10:00:00",
  },
  {
    id: "badge-008",
    slug: "practice-marathon",
    name: "Practice Marathon",
    description: "Nộp 5 bài thực hành",
    category: "learning",
    triggerType: "practice_submit_count",
    triggerValue: 5,
    pointsReward: 250,
    icon: "🏃",
    active: true,
    unlockCount: 67,
    createdAt: "2026-05-01T10:00:00",
    updatedAt: "2026-05-01T10:00:00",
  },
];

/** @type {PointRule[]} */
let pointRulesStore = [
  {
    id: "rule-001",
    slug: "streak-weekly",
    name: "Streak 7 ngày",
    eventType: "streak_milestone",
    points: 20,
    intervalDays: 7,
    description: "Thưởng +20đ mỗi 7 ngày streak (§3.6)",
    active: true,
    updatedAt: "2026-06-01T08:00:00",
  },
  {
    id: "rule-002",
    slug: "daily-login",
    name: "Đăng nhập hàng ngày",
    eventType: "daily_login",
    points: 5,
    intervalDays: null,
    description: "Cộng 5đ mỗi ngày đăng nhập lần đầu",
    active: true,
    updatedAt: "2026-06-01T08:00:00",
  },
  {
    id: "rule-003",
    slug: "post-approved",
    name: "Bài viết được duyệt",
    eventType: "post_published",
    points: 15,
    intervalDays: null,
    description: "Mod duyệt bài → cộng điểm tích lũy",
    active: true,
    updatedAt: "2026-06-01T08:00:00",
  },
  {
    id: "rule-004",
    slug: "exam-pass-70",
    name: "Hoàn thành đề ≥ 70%",
    eventType: "exam_passed",
    points: 30,
    intervalDays: null,
    description: "Làm đề trắc nghiệm đạt ngưỡng điểm",
    active: true,
    updatedAt: "2026-06-01T08:00:00",
  },
];

export function getGamificationStats() {
  const activeBadges = badgesStore.filter((b) => b.active).length;
  const totalUnlocks = badgesStore.reduce((sum, b) => sum + b.unlockCount, 0);
  return {
    rankCount: ranksStore.filter((r) => r.active).length,
    badgeCount: badgesStore.length,
    activeBadges,
    inactiveBadges: badgesStore.length - activeBadges,
    pointRuleCount: pointRulesStore.filter((r) => r.active).length,
    totalUnlocks,
  };
}

export function getRankTiers() {
  return [...ranksStore].sort((a, b) => a.sortOrder - b.sortOrder || a.minPoints - b.minPoints);
}

export function getRankTierById(id) {
  return ranksStore.find((r) => r.id === id) ?? null;
}

export function getRankColorHex(colorKey) {
  return RANK_COLORS.find((c) => c.id === colorKey)?.hex ?? "#004ac6";
}

export function createRankTier(payload) {
  const validation = validateRankPayload(payload, ranksStore);
  if (!validation.ok) return validation;

  const entry = {
    id: `rank-${Date.now()}`,
    ...validation.data,
    updatedAt: nowIso(),
  };
  ranksStore = [...ranksStore, entry];
  return { ok: true, item: entry };
}

export function updateRankTier(id, payload) {
  const index = ranksStore.findIndex((r) => r.id === id);
  if (index < 0) return { ok: false, message: "Không tìm thấy cấp hạng." };

  const validation = validateRankPayload(payload, ranksStore, id);
  if (!validation.ok) return validation;

  const updated = {
    ...ranksStore[index],
    ...validation.data,
    updatedAt: nowIso(),
  };
  ranksStore = ranksStore.map((r, i) => (i === index ? updated : r));
  return { ok: true, item: updated };
}

export function deleteRankTier(id) {
  if (ranksStore.length <= 1) {
    return { ok: false, message: "Phải giữ ít nhất 1 cấp hạng." };
  }
  const target = ranksStore.find((r) => r.id === id);
  if (!target) return { ok: false, message: "Không tìm thấy cấp hạng." };
  ranksStore = ranksStore.filter((r) => r.id !== id);
  return { ok: true, item: target };
}

export function toggleRankTierActive(id) {
  const index = ranksStore.findIndex((r) => r.id === id);
  if (index < 0) return { ok: false, message: "Không tìm thấy cấp hạng." };
  const activeCount = ranksStore.filter((r) => r.active).length;
  if (ranksStore[index].active && activeCount <= 1) {
    return { ok: false, message: "Phải có ít nhất 1 cấp hạng đang bật." };
  }
  ranksStore = ranksStore.map((r, i) =>
    i === index ? { ...r, active: !r.active, updatedAt: nowIso() } : r,
  );
  return { ok: true };
}

export function getBadges() {
  return [...badgesStore].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export function getBadgeById(id) {
  return badgesStore.find((b) => b.id === id) ?? null;
}

export function createBadge(payload) {
  const validation = validateBadgePayload(payload, badgesStore);
  if (!validation.ok) return validation;

  const now = nowIso();
  const entry = {
    id: `badge-${Date.now()}`,
    ...validation.data,
    unlockCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  badgesStore = [entry, ...badgesStore];
  return { ok: true, item: entry };
}

export function updateBadge(id, payload) {
  const index = badgesStore.findIndex((b) => b.id === id);
  if (index < 0) return { ok: false, message: "Không tìm thấy danh hiệu." };

  const validation = validateBadgePayload(payload, badgesStore, id);
  if (!validation.ok) return validation;

  const updated = {
    ...badgesStore[index],
    ...validation.data,
    updatedAt: nowIso(),
  };
  badgesStore = badgesStore.map((b, i) => (i === index ? updated : b));
  return { ok: true, item: updated };
}

export function deleteBadge(id) {
  const target = badgesStore.find((b) => b.id === id);
  if (!target) return { ok: false, message: "Không tìm thấy danh hiệu." };
  badgesStore = badgesStore.filter((b) => b.id !== id);
  return { ok: true, item: target };
}

export function toggleBadgeActive(id) {
  const index = badgesStore.findIndex((b) => b.id === id);
  if (index < 0) return { ok: false, message: "Không tìm thấy danh hiệu." };
  badgesStore = badgesStore.map((b, i) =>
    i === index ? { ...b, active: !b.active, updatedAt: nowIso() } : b,
  );
  return { ok: true };
}

export function getPointRules() {
  return [...pointRulesStore].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export function getPointRuleById(id) {
  return pointRulesStore.find((r) => r.id === id) ?? null;
}

export function createPointRule(payload) {
  const validation = validatePointRulePayload(payload, pointRulesStore);
  if (!validation.ok) return validation;

  const entry = {
    id: `rule-${Date.now()}`,
    ...validation.data,
    updatedAt: nowIso(),
  };
  pointRulesStore = [entry, ...pointRulesStore];
  return { ok: true, item: entry };
}

export function updatePointRule(id, payload) {
  const index = pointRulesStore.findIndex((r) => r.id === id);
  if (index < 0) return { ok: false, message: "Không tìm thấy quy tắc." };

  const validation = validatePointRulePayload(payload, pointRulesStore, id);
  if (!validation.ok) return validation;

  const updated = {
    ...pointRulesStore[index],
    ...validation.data,
    updatedAt: nowIso(),
  };
  pointRulesStore = pointRulesStore.map((r, i) => (i === index ? updated : r));
  return { ok: true, item: updated };
}

export function deletePointRule(id) {
  const target = pointRulesStore.find((r) => r.id === id);
  if (!target) return { ok: false, message: "Không tìm thấy quy tắc." };
  pointRulesStore = pointRulesStore.filter((r) => r.id !== id);
  return { ok: true, item: target };
}

export function togglePointRuleActive(id) {
  const index = pointRulesStore.findIndex((r) => r.id === id);
  if (index < 0) return { ok: false, message: "Không tìm thấy quy tắc." };
  pointRulesStore = pointRulesStore.map((r, i) =>
    i === index ? { ...r, active: !r.active, updatedAt: nowIso() } : r,
  );
  return { ok: true };
}

/** Dùng cho getUserGamification — đọc ngưỡng từ store */
export function getActiveRankThresholds() {
  return getRankTiers()
    .filter((r) => r.active)
    .map((r) => ({ name: r.name, minPoints: r.minPoints }));
}

export async function hydrateGamificationFromApi() {
  if (USE_MOCK) {
    return;
  }

  try {
    const levels = await adminApi.getGamificationLevels();
    if ((levels ?? []).length > 0) {
      ranksStore = levels.map(mapLevelConfigToRankTier);
    }
  } catch {
    /* keep mock ranks */
  }

  try {
    const badges = await adminApi.getGamificationBadges();
    if ((badges ?? []).length > 0) {
      badgesStore = badges.map(mapBadgeAdminDto);
    }
  } catch {
    /* keep mock badges */
  }
}

export async function saveRankTiersToApi() {
  if (USE_MOCK) {
    return { ok: true };
  }

  try {
    await adminApi.updateGamificationLevels(mapRankTiersToUpdateLevelsRequest(getRankTiers()));
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error?.message ?? "Không lưu được cấp hạng." };
  }
}
