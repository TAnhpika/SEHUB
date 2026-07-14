/**
 * @fileoverview Auth provider trung tâm của FE: lưu phiên, bootstrap `/me`, đồng bộ Premium và AI token.
 *
 * Module này chịu trách nhiệm:
 * - Khôi phục phiên đăng nhập từ access/refresh token.
 * - Enrich user từ dữ liệu auth, profile stats và subscription Premium.
 * - Cung cấp các action đăng nhập/đăng ký/đăng xuất/Google login cho toàn app.
 * - Đồng bộ snapshot AI token và trạng thái Premium vào `AuthContext`.
 *
 * @module context/AuthProvider
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "@/api/authApi";
import { deriveUsernameFromEmail, mapApiUser } from "@/api/authMapper";
import { mapProfileStatsToAuthUser, mapAiTokenStatusDto } from "@/api/profileMapper";
import { mapSubscriptionStatusDto } from "@/api/premiumMapper";
import {
  ApiError,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  refreshSession,
  setAccessToken,
  setRefreshToken,
} from "@/api/httpClient";
import { resolveIsPremium, STUDENT_PLAN } from "@/utils/studentPlan";
import { consumeAiExplainTokens, clearServerAiTokenSnapshot, getAiTokenSnapshot, setServerAiTokenSnapshot, applyServerRemainingTokens, refreshAiTokensFromServer } from "@/utils/aiTokens";
import { AuthContext } from "./authContextValue";

const STORAGE_KEY = "sehubs_user";
const REMEMBER_KEY = "sehubs_remember_login";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Xóa session mock cũ còn sót lại để tránh bootstrap sai user sau khi chuyển sang API thật.
 *
 * @returns {void}
 */
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

const DEV_SESSION_CLEARED_KEY = "sehubs_dev_session_cleared";

/**
 * Trong môi trường dev, cho phép clear session đúng một lần mỗi tab khi flag bật.
 *
 * @returns {void}
 */
function purgeDevSessionIfEnabled() {
  if (!import.meta.env.DEV || import.meta.env.VITE_DEV_CLEAR_SESSION !== "true") {
    return;
  }

  if (sessionStorage.getItem(DEV_SESSION_CLEARED_KEY)) {
    return;
  }

  sessionStorage.setItem(DEV_SESSION_CLEARED_KEY, "1");
  clearAuthTokens();
  localStorage.removeItem(STORAGE_KEY);
  clearServerAiTokenSnapshot();
}

purgeLegacyMockSession();
purgeDevSessionIfEnabled();

/**
 * @typedef {Object} AuthUserLike
 * @property {string | null} [id] - ID người dùng.
 * @property {string | null} [username] - Username đăng nhập.
 * @property {string | null} [displayName] - Tên hiển thị.
 * @property {string | null} [email] - Email tài khoản.
 * @property {string | null} [role] - Vai trò nghiệp vụ (`student`, `moderator`, `admin`...).
 * @property {string | null} [plan] - Gói hiện tại (`Basic`/`Premium`).
 * @property {boolean} [isPremium] - Cờ Premium legacy/fallback.
 * @property {string | null} [premiumExpiresAt] - Hạn Premium nếu có.
 * @property {string | null} [premiumPlanName] - Tên gói Premium đang dùng.
 * @property {boolean} [emailConfirmed] - Trạng thái xác thực email.
 */

/**
 * Chuẩn hóa user đọc từ storage/API để luôn có `plan` và `isPremium` nhất quán.
 *
 * @param {AuthUserLike | null | undefined} stored - User thô từ localStorage hoặc mapper khác.
 * @returns {AuthUserLike | null} User đã enrich; `null` nếu input rỗng.
 */
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

/**
 * Map DTO auth user từ backend rồi enrich theo nghiệp vụ Premium nội bộ.
 *
 * @param {Record<string, any>} dto - DTO user từ API auth.
 * @returns {AuthUserLike | null} User đã map và enrich.
 */
function mapAndEnrichUser(dto) {
  return enrichUser(mapApiUser(dto));
}

/**
 * Đọc user đã cache trong localStorage.
 *
 * @returns {AuthUserLike | null} User đã enrich hoặc `null` nếu không có/parse lỗi.
 */
export function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? enrichUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra có đủ token + user cache để coi là còn session lưu cục bộ hay không.
 *
 * @returns {boolean} `true` nếu local có access token hợp lệ và user cache.
 */
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

/**
 * Ghi hoặc xóa user hiện tại trong localStorage.
 *
 * @param {AuthUserLike | null} user - User cần persist; `null` để clear.
 * @returns {void}
 */
function persistUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Áp phiên auth mới sau login/register/googleLogin vào state, token store và localStorage.
 *
 * Nếu không dùng mock, module tiếp tục gọi `/me` để enrich thêm stats/subscription.
 *
 * @param {import('react').Dispatch<import('react').SetStateAction<AuthUserLike | null>>} setUser - Setter user state.
 * @param {import('react').Dispatch<import('react').SetStateAction<boolean>>} setIsBootstrapping - Setter cờ bootstrap.
 * @param {{ user: Record<string, any>, accessToken: string, refreshToken?: string | null }} loginResponse - Payload trả về sau auth thành công.
 * @param {{ onSessionApplied?: (user: AuthUserLike | null) => void }} [options] - Hook sau khi áp session (vd. nhắc profile thiếu).
 * @returns {AuthUserLike | null} User vừa áp vào session.
 */
function applyAuthSession(setUser, setIsBootstrapping, loginResponse, options = {}) {
  const nextUser = mapAndEnrichUser(loginResponse.user);
  setAccessToken(loginResponse.accessToken);
  setRefreshToken(loginResponse.refreshToken ?? null);
  persistUser(nextUser);
  setUser(nextUser);
  setIsBootstrapping(false);
  options.onSessionApplied?.(nextUser);

  if (!USE_MOCK) {
    authApi.getMe().then((me) => {
      const merged = applyMeEnrichment(nextUser, me);
      persistUser(merged);
      setUser(merged);
    }).catch(() => {
      /* keep login response user if /me enrichment fails */
    });
  }

  return nextUser;
}

/**
 * Merge dữ liệu `/me` vào user hiện tại, bao gồm stats hồ sơ, subscription Premium và AI tokens.
 *
 * @param {AuthUserLike | null} user - User nền hiện có trong state.
 * @param {Record<string, any> | null | undefined} meDto - DTO `/me` từ backend.
 * @returns {AuthUserLike | null} User đã enrich thêm thông tin mới.
 */
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
    setServerAiTokenSnapshot(mapAiTokenStatusDto(meDto.aiTokens), user);
  } else if (!USE_MOCK) {
    clearServerAiTokenSnapshot();
    refreshAiTokensFromServer(user).catch(() => {});
  } else {
    clearServerAiTokenSnapshot();
  }

  if (meDto.emailConfirmed !== undefined) {
    next = { ...next, emailConfirmed: Boolean(meDto.emailConfirmed) };
  }

  if (meDto.isProfileComplete !== undefined) {
    next = { ...next, isProfileComplete: Boolean(meDto.isProfileComplete) };
  }

  return next;
}

/**
 * Đồng bộ lại user từ API `/me` khi cần refresh dữ liệu mới nhất.
 *
 * @param {AuthUserLike | null} user - User hiện tại trong state.
 * @param {Record<string, any> | null} [meDto=null] - DTO `/me` đã có sẵn để tránh gọi lại API.
 * @returns {Promise<AuthUserLike | null>} User sau khi đồng bộ.
 *
 * @throws {Error} Khi `authApi.getMe()` thất bại trong API mode.
 */
async function syncUserFromApi(user, meDto = null) {
  if (!user || USE_MOCK) {
    return user;
  }

  const me = meDto ?? (await authApi.getMe());
  return applyMeEnrichment(user, me);
}

/**
 * Quyết định bootstrap error có cần clear hẳn session hay chỉ fallback tạm sang storage.
 *
 * @param {unknown} error - Lỗi phát sinh khi bootstrap `/me`.
 * @returns {boolean} `true` nếu lỗi auth 401/403 buộc phải làm sạch phiên.
 */
function shouldClearSessionOnBootstrapError(error) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/**
 * Fallback user từ localStorage vào state khi bootstrap lỗi nhưng chưa chắc phiên đã chết.
 *
 * @param {import('react').Dispatch<import('react').SetStateAction<AuthUserLike | null>>} setUser - Setter user state.
 * @returns {void}
 */
function applyStoredUserFallback(setUser) {
  const stored = readStoredUser();
  if (stored) {
    setUser(stored);
  }
}

/**
 * Xóa toàn bộ dấu vết phiên đăng nhập hiện tại ở token store, AI snapshot và local cache.
 *
 * @param {import('react').Dispatch<import('react').SetStateAction<AuthUserLike | null>>} setUser - Setter user state.
 * @returns {void}
 */
function clearAuthSession(setUser) {
  clearAuthTokens();
  clearServerAiTokenSnapshot();
  persistUser(null);
  setUser(null);
}

/**
 * @typedef {Object} AuthProviderProps
 * @property {import('react').ReactNode} children - Cây component được bọc bởi provider.
 */

/**
 * Provider auth toàn cục cho ứng dụng.
 *
 * `value` do provider cấp gồm:
 * - User/session state (`user`, `isAuthenticated`, `isBootstrapping`, `isPremium`...).
 * - Auth actions (`login`, `register`, `logout`, `googleLogin`...).
 * - Premium/AI helpers dùng trong các flow học tập và chatbot.
 *
 * @param {AuthProviderProps} props - Props provider.
 * @returns {import('react').ReactElement} `AuthContext.Provider` bao bọc toàn app.
 *
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
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
  const [profileIncompletePromptOpen, setProfileIncompletePromptOpen] = useState(false);

  const promptIfProfileIncomplete = useCallback((nextUser) => {
    if (nextUser?.isProfileComplete === false) {
      setProfileIncompletePromptOpen(true);
    }
  }, []);

  const dismissProfileIncompletePrompt = useCallback(() => {
    setProfileIncompletePromptOpen(false);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsBootstrapping(false);
      return undefined;
    }

    let cancelled = false;

    function handleForcedLogout() {
      if (!cancelled) {
        clearAuthSession(setUser);
        setIsBootstrapping(false);
      }
    }

    window.addEventListener("auth:forced-logout", handleForcedLogout);

    async function restoreSession() {
      const tokenAtStart = getAccessToken();
      const refreshAtStart = getRefreshToken();
      try {
        const me = await authApi.getMe();
        if (cancelled) return;
        const nextUser = applyMeEnrichment(mapAndEnrichUser(me), me);
        persistUser(nextUser);
        setUser(nextUser);
      } catch (error) {
        if (cancelled) return;

        if (!shouldClearSessionOnBootstrapError(error)) {
          applyStoredUserFallback(setUser);
          return;
        }

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
      window.removeEventListener("auth:forced-logout", handleForcedLogout);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login({
      emailOrUsername: credentials?.username?.trim() ?? "",
      password: credentials?.password ?? "",
    });
    return applyAuthSession(setUser, setIsBootstrapping, response, {
      onSessionApplied: promptIfProfileIncomplete,
    });
  }, [promptIfProfileIncomplete]);

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
    return applyAuthSession(setUser, setIsBootstrapping, response, {
      onSessionApplied: promptIfProfileIncomplete,
    });
  }, [promptIfProfileIncomplete]);

  const googleLogin = useCallback(async (idToken) => {
    const response = await authApi.googleLogin({ idToken });
    return applyAuthSession(setUser, setIsBootstrapping, response, {
      onSessionApplied: promptIfProfileIncomplete,
    });
  }, [promptIfProfileIncomplete]);

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await authApi.logout();
      }
    } catch {
      /* clear local session even if API logout fails */
    } finally {
      setProfileIncompletePromptOpen(false);
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

    await refreshAiTokensFromServer(user);
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
      isModerator: user?.role === "moderator",
      isStaff: user?.role === "admin" || user?.role === "moderator",
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
      profileIncompletePromptOpen,
      dismissProfileIncompletePrompt,
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
      profileIncompletePromptOpen,
      dismissProfileIncompletePrompt,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
