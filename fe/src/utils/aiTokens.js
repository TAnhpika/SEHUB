import { isStaffRole, resolveIsPremium } from "@/utils/studentPlan";

/** Chi phí mỗi lần giải thích AI — §3.3 */
export const AI_EXPLAIN_TOKEN_COST = 10;

const STORAGE_PREFIX = "sehubs_ai_usage_";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getUserKey(user) {
  if (!user) return null;
  return user.username ?? user.email ?? null;
}

/**
 * Hạn mức token AI / ngày — §2.2, §2.3, §6
 * Guest: 0 · Free: 10 · Premium/Mod: 1000 · Admin: không giới hạn
 */
export function getAiDailyTokenLimit(user) {
  if (!user) return 0;
  if (user.role === "admin") return Number.POSITIVE_INFINITY;
  if (isStaffRole(user.role)) return 1000;
  if (resolveIsPremium(user)) return 1000;
  return 10;
}

function readUsage(userKey) {
  if (!userKey) return { date: todayKey(), used: 0 };

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userKey}`);
    if (!raw) return { date: todayKey(), used: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return { date: todayKey(), used: 0 };
    return { date: parsed.date, used: Number(parsed.used) || 0 };
  } catch {
    return { date: todayKey(), used: 0 };
  }
}

function writeUsage(userKey, usage) {
  if (!userKey) return;
  localStorage.setItem(`${STORAGE_PREFIX}${userKey}`, JSON.stringify(usage));
}

/**
 * @returns {{ limit: number, used: number, remaining: number, canExplain: boolean, cost: number }}
 */
export function getAiTokenSnapshot(user) {
  const limit = getAiDailyTokenLimit(user);
  const cost = AI_EXPLAIN_TOKEN_COST;

  if (!Number.isFinite(limit)) {
    return { limit, used: 0, remaining: Number.POSITIVE_INFINITY, canExplain: true, cost };
  }

  const userKey = getUserKey(user);
  const usage = readUsage(userKey);
  const remaining = Math.max(0, limit - usage.used);

  return {
    limit,
    used: usage.used,
    remaining,
    canExplain: remaining >= cost,
    cost,
  };
}

/**
 * Lazy reset theo ngày — §4.2
 * @returns {{ ok: boolean, snapshot: ReturnType<typeof getAiTokenSnapshot> }}
 */
export function consumeAiExplainTokens(user) {
  const snapshot = getAiTokenSnapshot(user);
  if (!user) return { ok: false, snapshot };
  if (!Number.isFinite(snapshot.limit)) return { ok: true, snapshot };

  const userKey = getUserKey(user);
  if (!userKey || !snapshot.canExplain) return { ok: false, snapshot };

  const usage = readUsage(userKey);
  const nextUsage = {
    date: todayKey(),
    used: usage.used + AI_EXPLAIN_TOKEN_COST,
  };
  writeUsage(userKey, nextUsage);

  return { ok: true, snapshot: getAiTokenSnapshot(user) };
}
