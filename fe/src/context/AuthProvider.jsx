import { useCallback, useMemo, useState } from "react";
import {
  findTestAccount,
  toAuthUser,
} from "@/features/moderator/moderatorMockData";
import { AuthContext } from "./authContextValue";

const STORAGE_KEY = "sehubs_user";
const TOKEN_KEY = "sehubs_token";

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
  plan: "Premium",
};

function normalizeUser(stored) {
  if (!stored) return null;

  const isStaff = stored.role === "admin" || stored.role === "moderator";
  const base = isStaff ? stored : { ...MOCK_STUDENT, plan: stored.plan ?? MOCK_STUDENT.plan };

  return {
    ...base,
    ...stored,
    displayName: stored.displayName ?? base.displayName,
    initial: stored.initial ?? base.initial,
    role: stored.role ?? "student",
    plan: stored.plan ?? base.plan,
    roleLabel:
      stored.roleLabel ??
      (stored.role === "admin"
        ? "Quản trị viên"
        : stored.role === "moderator"
          ? "Kiểm duyệt viên"
          : undefined),
    isPremium: Boolean(stored.isPremium ?? isStaff),
  };
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = readStoredUser();
    if (stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
    return stored;
  });

  const login = useCallback((credentials) => {
    const identifier = credentials?.username?.trim() || MOCK_STUDENT.username;
    const password = credentials?.password ?? "";

    const testAccount = findTestAccount(identifier, password);
    if (testAccount) {
      const { password: _password, ...accountSafe } = testAccount;
      const nextUser = normalizeUser(
        testAccount.role === "student" ? accountSafe : toAuthUser(testAccount),
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      localStorage.setItem(TOKEN_KEY, "mock-jwt-token");
      setUser(nextUser);
      return nextUser;
    }

    const email = identifier.includes("@") ? identifier : `${identifier}@gmail.com`;
    const nextUser = normalizeUser({
      ...MOCK_STUDENT,
      username: identifier,
      email,
      displayName: credentials?.displayName ?? MOCK_STUDENT.displayName,
      role: "student",
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    localStorage.setItem(TOKEN_KEY, "mock-jwt-token");
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(({ fullName, email }) => {
    const trimmedEmail = email?.trim() || MOCK_STUDENT.email;
    const username = trimmedEmail.includes("@")
      ? trimmedEmail.split("@")[0]
      : trimmedEmail;
    const displayName = fullName?.trim() || username;

    const nextUser = normalizeUser({
      ...MOCK_STUDENT,
      username,
      email: trimmedEmail,
      displayName,
      initial: displayName.charAt(0).toUpperCase(),
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    localStorage.setItem(TOKEN_KEY, "mock-jwt-token");
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const activatePremium = useCallback(() => {
    setUser((prev) => {
      if (!prev || prev.isPremium) {
        return prev;
      }
      const next = { ...prev, isPremium: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isPremium: user?.plan === "Premium",
      isAdmin: user?.role === "admin",
      isModerator: user?.role === "moderator" || user?.role === "admin",
      login,
      register,
      logout,
      activatePremium,
    }),
    [user, login, register, logout, activatePremium],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
