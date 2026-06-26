import { useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "@/api/authApi";
import { deriveUsernameFromEmail, mapApiUser } from "@/api/authMapper";
import { mapProfileStatsToAuthUser, mapAiTokenStatusDto } from "@/api/profileMapper";
import { mapSubscriptionStatusDto } from "@/api/premiumMapper";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  refreshSession,
  setAccessToken,
  setRefreshToken,
} from "@/api/httpClient";
import { resolveIsPremium, STUDENT_PLAN } from "@/utils/studentPlan";
import { consumeAiExplainTokens, clearServerAiTokenSnapshot, getAiTokenSnapshot, setServerAiTokenSnapshot, applyServerRemainingTokens } from "@/utils/aiTokens";
import { AuthContext } from "./authContextValue";

const STORAGE_KEY = "sehubs_user";
const REMEMBER_KEY = "sehubs_remember_login";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function purgeLegacyMockSession() {
  try {
    const token = localStorage.getItem("sehubs_token");
    const raw = localStorage.getItem(STORAGE_KEY);
    const isMockToken = !token || token === "mock-jwt-token";
    let isMockUser = false;

    if (raw) {
      const parsed = JSON.parse(raw);
      isMockUser =
        parsed?.displayName === "Anhpika" ||
        parsed?.email === "tngo28299@gmail.com" ||
        !parsed?.id;
    }

    if (isMockToken || isMockUser) {
      localStorage.removeItem("sehubs_token");
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch {
    localStorage.removeItem("sehubs_token");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  }
}

purgeLegacyMockSession();

function enrichUser(stored) {
  if (!stored) return null;

  const plan =
    stored.plan ??
    (stored.isPremium ? STUDENT_PLAN.PREMIUM : STUDENT_PLAN.FREE);
  const merged = { ...stored, plan };

  return {
    ...merged,
    isPremium: resolveIsPremium(merged) || Boolean(stored.isPremium),
  };
}

function mapAndEnrichUser(dto) {
  return enrichUser(mapApiUser(dto));
}

export function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? enrichUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function hasStoredSession() {
  try {
    const token = getAccessToken();
    return Boolean(
      token && token !== "mock-jwt-token" && localStorage.getItem(STORAGE_KEY),
    );
  } catch {
    return false;
  }
}

function persistUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function applyAuthSession(setUser, setIsBootstrapping, loginResponse) {
  const nextUser = mapAndEnrichUser(loginResponse.user);
  setAccessToken(loginResponse.accessToken);
  setRefreshToken(loginResponse.refreshToken ?? null);
  persistUser(nextUser);
  setUser(nextUser);
  setIsBootstrapping(false);

  if (!USE_MOCK) {
    authApi.getMe().then((me) => {
      const merged = applyMeEnrichment(nextUser, me);
      persistUser(merged);
      setUser(merged);
    });
  }

  return nextUser;
}

function applyMeEnrichment(user, meDto) {
  if (!user || !meDto || USE_MOCK) {
    return user;
  }

  let next = user;

  if (meDto.stats) {
    next = mapProfileStatsToAuthUser(next, meDto.stats);
  }

  if (meDto.subscription) {
    const subscription = mapSubscriptionStatusDto(meDto.subscription);
    next = enrichUser({
      ...next,
      isPremium: Boolean(subscription.isActive),
      plan: subscription.isActive ? STUDENT_PLAN.PREMIUM : STUDENT_PLAN.FREE,
      premiumExpiresAt: subscription.expiresAt ?? null,
      premiumPlanName: subscription.planName ?? null,
    });
  }

  if (meDto.aiTokens) {
    setServerAiTokenSnapshot(mapAiTokenStatusDto(meDto.aiTokens));
  } else {
    clearServerAiTokenSnapshot();
  }

  if (meDto.emailConfirmed !== undefined) {
    next = { ...next, emailConfirmed: Boolean(meDto.emailConfirmed) };
  }

  return next;
}

async function syncUserFromApi(user, meDto = null) {
  if (!user || USE_MOCK) {
    return user;
  }

  const me = meDto ?? (await authApi.getMe());
  return applyMeEnrichment(user, me);
}

function clearAuthSession(setUser) {
  clearAuthTokens();
  clearServerAiTokenSnapshot();
  persistUser(null);
  setUser(null);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!getAccessToken()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return readStoredUser();
  });
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getAccessToken()));
  const [aiTokenVersion, setAiTokenVersion] = useState(0);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsBootstrapping(false);
      return undefined;
    }

    let cancelled = false;

    async function restoreSession() {
      const tokenAtStart = getAccessToken();
      const refreshAtStart = getRefreshToken();
      try {
        const me = await authApi.getMe();
        if (cancelled) return;
        const nextUser = applyMeEnrichment(mapAndEnrichUser(me), me);
        persistUser(nextUser);
        setUser(nextUser);
      } catch {
        if (cancelled) return;
        try {
          if (getRefreshToken() && getRefreshToken() === refreshAtStart) {
            const refreshed = await refreshSession();
            if (cancelled) return;
            const me = await authApi.getMe();
            const nextUser = applyMeEnrichment(mapAndEnrichUser(me ?? refreshed.user), me);
            persistUser(nextUser);
            setUser(nextUser);
            return;
          }
        } catch {
          /* fall through to clear */
        }
        if (getAccessToken() === tokenAtStart) {
          clearAuthSession(setUser);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login({
      emailOrUsername: credentials?.username?.trim() ?? "",
      password: credentials?.password ?? "",
    });
    return applyAuthSession(setUser, setIsBootstrapping, response);
  }, []);

  const register = useCallback(async ({ fullName, email, password }) => {
    const trimmedEmail = email?.trim() ?? "";
    const username = deriveUsernameFromEmail(trimmedEmail);
    const displayName = fullName?.trim() || username;

    const response = await authApi.register({
      email: trimmedEmail,
      username,
      password: password ?? "",
      displayName,
    });
    return applyAuthSession(setUser, setIsBootstrapping, response);
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const response = await authApi.googleLogin({ idToken });
    return applyAuthSession(setUser, setIsBootstrapping, response);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await authApi.logout();
      }
    } catch {
      /* clear local session even if API logout fails */
    } finally {
      clearAuthSession(setUser);
    }
  }, []);

  const activatePremium = useCallback(async () => {
    try {
      if (getAccessToken()) {
        const me = await authApi.getMe();
        const nextUser = applyMeEnrichment(mapAndEnrichUser(me), me);
        persistUser(nextUser);
        setUser(nextUser);
        return nextUser;
      }
    } catch {
      /* fallback below */
    }

    setUser((prev) => {
      if (!prev || resolveIsPremium(prev)) {
        return prev;
      }
      const next = enrichUser({
        ...prev,
        plan: STUDENT_PLAN.PREMIUM,
        isPremium: true,
      });
      persistUser(next);
      return next;
    });
  }, []);

  const spendAiExplainTokens = useCallback(() => {
    if (!user) return { ok: false, snapshot: getAiTokenSnapshot(null) };
    const result = consumeAiExplainTokens(user);
    if (result.ok) {
      setAiTokenVersion((version) => version + 1);
    }
    return result;
  }, [user]);

  const refreshAiTokens = useCallback(async () => {
    if (!user || USE_MOCK) {
      setAiTokenVersion((version) => version + 1);
      return getAiTokenSnapshot(user);
    }

    try {
      const me = await authApi.getMe();
      if (me?.aiTokens) {
        setServerAiTokenSnapshot(mapAiTokenStatusDto(me.aiTokens));
      } else {
        clearServerAiTokenSnapshot();
      }
    } catch {
      clearServerAiTokenSnapshot();
    }

    setAiTokenVersion((version) => version + 1);
    return getAiTokenSnapshot(user);
  }, [user]);

  const applyAiTokenRemaining = useCallback((remaining) => {
    if (remaining == null || USE_MOCK) return;
    applyServerRemainingTokens(remaining);
    setAiTokenVersion((version) => version + 1);
  }, []);

  const markEmailVerified = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, emailConfirmed: true };
      persistUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      isPremium: resolveIsPremium(user),
      isAdmin: user?.role === "admin",
      isModerator: user?.role === "moderator" || user?.role === "admin",
      aiTokens: getAiTokenSnapshot(user),
      spendAiExplainTokens,
      refreshAiTokens,
      applyAiTokenRemaining,
      login,
      register,
      googleLogin,
      logout,
      activatePremium,
      markEmailVerified,
    }),
    [
      user,
      isBootstrapping,
      aiTokenVersion,
      spendAiExplainTokens,
      refreshAiTokens,
      applyAiTokenRemaining,
      login,
      register,
      googleLogin,
      logout,
      activatePremium,
      markEmailVerified,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
