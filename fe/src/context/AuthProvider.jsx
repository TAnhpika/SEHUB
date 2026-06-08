import { useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "@/api/authApi";
import { deriveUsernameFromEmail, mapApiUser } from "@/api/authMapper";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  refreshSession,
  setAccessToken,
  setRefreshToken,
} from "@/api/httpClient";
import { resolveIsPremium, STUDENT_PLAN } from "@/utils/studentPlan";
import { consumeAiExplainTokens, getAiTokenSnapshot } from "@/utils/aiTokens";
import { AuthContext } from "./authContextValue";

const STORAGE_KEY = "sehubs_user";
const REMEMBER_KEY = "sehubs_remember_login";

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
  return nextUser;
}

function clearAuthSession(setUser) {
  clearAuthTokens();
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
        const nextUser = mapAndEnrichUser(me);
        persistUser(nextUser);
        setUser(nextUser);
      } catch {
        if (cancelled) return;
        try {
          if (getRefreshToken() && getRefreshToken() === refreshAtStart) {
            const refreshed = await refreshSession();
            if (cancelled) return;
            const me = await authApi.getMe();
            const nextUser = mapAndEnrichUser(me ?? refreshed.user);
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

  const activatePremium = useCallback(() => {
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
      login,
      register,
      googleLogin,
      logout,
      activatePremium,
    }),
    [
      user,
      isBootstrapping,
      aiTokenVersion,
      spendAiExplainTokens,
      login,
      register,
      googleLogin,
      logout,
      activatePremium,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
