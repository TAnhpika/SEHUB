import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import {
  findTestAccount,
  toAuthUser,
} from "@/features/moderator/moderatorMockData";
import { resolveIsPremium, STUDENT_PLAN } from "@/utils/studentPlan";
import { consumeAiExplainTokens, getAiTokenSnapshot } from "@/utils/aiTokens";
import { AuthContext } from "./authContextValue";

const STORAGE_KEY = "sehubs_user";
const TOKEN_KEY = "sehubs_token";

/** Sinh viên Free mặc định — đăng ký / OAuth / đăng nhập thường (§2.2) */
const MOCK_STUDENT = {
  username: "anhcoding12345",
  email: "tngo28299@gmail.com",
  displayName: "Anhpika",
  initial: "A",
  level: "Silver",
  points: 240,
  streak: 7,
  unreadNotifications: 7,
  levelProgress: 68,
  pointsToNext: 60,
  role: "student",
  plan: STUDENT_PLAN.FREE,
  aiTokensDaily: 10,
};

function normalizeUser(stored) {
  if (!stored) return null;

  const isStaff = stored.role === "admin" || stored.role === "moderator";
  const base = isStaff
    ? stored
    : {
        ...MOCK_STUDENT,
        plan: stored.plan === STUDENT_PLAN.PREMIUM ? STUDENT_PLAN.PREMIUM : STUDENT_PLAN.FREE,
      };

  const merged = {
    ...base,
    ...stored,
    displayName: stored.displayName ?? base.displayName,
    initial: stored.initial ?? base.initial,
    role: stored.role ?? "student",
    plan: isStaff
      ? stored.plan ?? base.plan
      : stored.plan === STUDENT_PLAN.PREMIUM
        ? STUDENT_PLAN.PREMIUM
        : STUDENT_PLAN.FREE,
    roleLabel:
      stored.roleLabel ??
      (stored.role === "admin"
        ? "Quản trị viên"
        : stored.role === "moderator"
          ? "Kiểm duyệt viên"
          : undefined),
    aiTokensDaily:
      stored.aiTokensDaily ??
      (resolveIsPremium({ ...stored, role: stored.role ?? "student", plan: stored.plan }) ? 1000 : 10),
  };

  return {
    ...merged,
    isPremium: resolveIsPremium(merged),
  };
}

export function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function hasStoredSession() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY) && localStorage.getItem(TOKEN_KEY));
  } catch {
    return false;
  }
}

function buildStudentUser(overrides = {}) {
  const displayName = overrides.displayName ?? MOCK_STUDENT.displayName;
  return normalizeUser({
    ...MOCK_STUDENT,
    ...overrides,
    role: "student",
    plan: overrides.plan === STUDENT_PLAN.PREMIUM ? STUDENT_PLAN.PREMIUM : STUDENT_PLAN.FREE,
    displayName,
    initial: overrides.initial ?? displayName.charAt(0).toUpperCase(),
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [aiTokenVersion, setAiTokenVersion] = useState(0);

  const commitSession = useCallback((nextUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    localStorage.setItem(TOKEN_KEY, "mock-jwt-token");
    flushSync(() => {
      setUser(nextUser);
    });
    return nextUser;
  }, []);

  const login = useCallback(
    (credentials) => {
      const identifier = credentials?.username?.trim() || MOCK_STUDENT.username;
      const password = credentials?.password ?? "";

      if (credentials?.provider === "google") {
        const displayName = credentials.displayName?.trim() || "Google User";
        return commitSession(
          buildStudentUser({
            username: credentials.username ?? "google_user",
            email: credentials.email ?? "google.user@gmail.com",
            displayName,
          }),
        );
      }

      const testAccount = findTestAccount(identifier, password);
      if (testAccount) {
        const { password: _password, ...accountSafe } = testAccount;
        return commitSession(
          normalizeUser(
            testAccount.role === "student" ? accountSafe : toAuthUser(testAccount),
          ),
        );
      }

      const email = identifier.includes("@") ? identifier : `${identifier}@gmail.com`;
      const displayName = credentials?.displayName ?? MOCK_STUDENT.displayName;

      return commitSession(
        buildStudentUser({
          username: identifier,
          email,
          displayName,
        }),
      );
    },
    [commitSession],
  );

  const register = useCallback(
    ({ fullName, email, provider }) => {
      if (provider === "google") {
        const displayName = fullName?.trim() || "Google User";
        return commitSession(
          buildStudentUser({
            username: "google_user",
            email: email?.trim() || "google.user@gmail.com",
            displayName,
          }),
        );
      }

      const trimmedEmail = email?.trim() || MOCK_STUDENT.email;
      const username = trimmedEmail.includes("@")
        ? trimmedEmail.split("@")[0]
        : trimmedEmail;
      const displayName = fullName?.trim() || username;

      return commitSession(
        buildStudentUser({
          username,
          email: trimmedEmail,
          displayName,
        }),
      );
    },
    [commitSession],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const activatePremium = useCallback(() => {
    setUser((prev) => {
      if (!prev || resolveIsPremium(prev)) {
        return prev;
      }
      const next = normalizeUser({
        ...prev,
        plan: STUDENT_PLAN.PREMIUM,
        aiTokensDaily: 1000,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
      isPremium: resolveIsPremium(user),
      isAdmin: user?.role === "admin",
      isModerator: user?.role === "moderator" || user?.role === "admin",
      aiTokens: getAiTokenSnapshot(user),
      spendAiExplainTokens,
      login,
      register,
      logout,
      activatePremium,
    }),
    [user, aiTokenVersion, spendAiExplainTokens, login, register, logout, activatePremium],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
