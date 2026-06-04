import { useCallback, useMemo, useState } from "react";
import {
  findModeratorTestAccount,
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
};

function normalizeUser(stored) {
  if (!stored) return null;

  const base = stored.role === "student" ? MOCK_STUDENT : stored;
  const role = stored.role === "admin" ? "admin" : "moderator";

  return {
    ...base,
    ...stored,
    displayName: stored.displayName ?? base.displayName,
    initial: stored.initial ?? base.initial,
    role,
    roleLabel:
      stored.roleLabel ?? (role === "admin" ? "Quản trị viên" : "Kiểm duyệt viên"),
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

    const testAccount = findModeratorTestAccount(identifier, password);
    if (testAccount) {
      const nextUser = normalizeUser(toAuthUser(testAccount));
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
      role: "moderator",
      roleLabel: "Kiểm duyệt viên",
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

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isPremium: false,
      isAdmin: user?.role === "admin",
      isModerator: user?.role === "moderator" || user?.role === "admin",
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
