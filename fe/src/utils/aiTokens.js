import * as profilesApi from "@/api/profilesApi";
import { mapAiTokenStatusDto } from "@/api/profileMapper";
import { isStaffRole, resolveIsPremium } from "@/utils/studentPlan";

/** Chi phí mỗi lần giải thích AI — §3.3 */
export const AI_EXPLAIN_TOKEN_COST = 10;

const STORAGE_PREFIX = "sehubs_ai_usage_";
const CACHE_PREFIX = "sehubs_ai_tokens_cache_";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

let serverSnapshot = null;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getUserKey(user) {
  if (!user) return null;
  return user.username ?? user.email ?? null;
}

function readCachedSnapshot(userKey) {
  if (!userKey) return null;

  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${userKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return null;
    return parsed.snapshot ?? null;
  } catch {
    return null;
  }
}

function writeCachedSnapshot(userKey, snapshot) {
  if (!userKey || !snapshot) return;
  localStorage.setItem(
    `${CACHE_PREFIX}${userKey}`,
    JSON.stringify({ date: todayKey(), snapshot }),
  );
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

export function clearServerAiTokenSnapshot() {
  serverSnapshot = null;
}

export function setServerAiTokenSnapshot(dto, user = null) {
  if (!dto) {
    serverSnapshot = null;
    return;
  }

  serverSnapshot = {
    limit: Number(dto.limit ?? 0),
    used: Number(dto.used ?? 0),
    remaining: Number(dto.remaining ?? 0),
    costExplain: Number(dto.costExplain ?? AI_EXPLAIN_TOKEN_COST),
    costChat: Number(dto.costChat ?? AI_EXPLAIN_TOKEN_COST),
    canExplain: Boolean(dto.canExplain),
    canChat: Boolean(dto.canChat),
  };

  const userKey = getUserKey(user);
  if (userKey && !USE_MOCK) {
    writeCachedSnapshot(userKey, serverSnapshot);
  }
}

export function applyServerRemainingTokens(remaining, cost = AI_EXPLAIN_TOKEN_COST) {
  if (serverSnapshot == null || !Number.isFinite(remaining)) {
    return;
  }

  const safeRemaining = Math.max(0, Number(remaining));
  serverSnapshot = {
    ...serverSnapshot,
    remaining: safeRemaining,
    used: Math.max(0, serverSnapshot.limit - safeRemaining),
    canExplain: safeRemaining >= cost,
    canChat: safeRemaining >= (serverSnapshot.costChat ?? cost),
  };
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

function getMockSnapshot(user) {
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

function getCachedOrServerSnapshot(user) {
  if (serverSnapshot) {
    return serverSnapshot;
  }

  const cached = readCachedSnapshot(getUserKey(user));
  if (cached) {
    serverSnapshot = cached;
    return cached;
  }

  return null;
}

/**
 * @returns {{ limit: number, used: number, remaining: number, canExplain: boolean, cost: number }}
 */
export function getAiTokenSnapshot(user) {
  if (!user) {
    return { limit: 0, used: 0, remaining: 0, canExplain: false, cost: AI_EXPLAIN_TOKEN_COST };
  }

  if (!USE_MOCK) {
    const snapshot = getCachedOrServerSnapshot(user);
    if (snapshot) {
      return {
        limit: snapshot.limit,
        used: snapshot.used,
        remaining: snapshot.remaining,
        canExplain: snapshot.canExplain,
        cost: snapshot.costExplain ?? AI_EXPLAIN_TOKEN_COST,
      };
    }

    return {
      limit: getAiDailyTokenLimit(user),
      used: 0,
      remaining: getAiDailyTokenLimit(user),
      canExplain: getAiDailyTokenLimit(user) >= AI_EXPLAIN_TOKEN_COST,
      cost: AI_EXPLAIN_TOKEN_COST,
    };
  }

  return getMockSnapshot(user);
}

/**
 * Fetch authoritative AI token status from GET /profiles/me/ai-tokens.
 * localStorage is used only as a read-through cache when offline or before refresh completes.
 */
export async function refreshAiTokensFromServer(user) {
  if (!user || USE_MOCK) {
    return getAiTokenSnapshot(user);
  }

  try {
    const dto = await profilesApi.getMyAiTokens();
    setServerAiTokenSnapshot(mapAiTokenStatusDto(dto), user);
  } catch {
    const cached = readCachedSnapshot(getUserKey(user));
    if (cached) {
      serverSnapshot = cached;
    }
  }

  return getAiTokenSnapshot(user);
}

/**
 * @returns {{ ok: boolean, snapshot: ReturnType<typeof getAiTokenSnapshot> }}
 */
export function consumeAiExplainTokens(user) {
  const snapshot = getAiTokenSnapshot(user);
  if (!user) return { ok: false, snapshot };
  if (!Number.isFinite(snapshot.limit)) return { ok: true, snapshot };
  if (!snapshot.canExplain) return { ok: false, snapshot };

  if (USE_MOCK) {
    const userKey = getUserKey(user);
    if (!userKey) return { ok: false, snapshot };

    const usage = readUsage(userKey);
    writeUsage(userKey, {
      date: todayKey(),
      used: usage.used + AI_EXPLAIN_TOKEN_COST,
    });
    return { ok: true, snapshot: getAiTokenSnapshot(user) };
  }

  return { ok: true, snapshot };
}
