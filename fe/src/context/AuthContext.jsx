import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "sehubs_user";
const TOKEN_KEY = "sehubs_token";

const MOCK_USER = {
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

  return {
    ...MOCK_USER,
    ...stored,
    displayName: MOCK_USER.displayName,
    initial: MOCK_USER.initial,
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
    const username = credentials?.username?.trim() || MOCK_USER.username;
    const email = username.includes("@") ? username : `${username}@gmail.com`;

    const nextUser = normalizeUser({
      ...MOCK_USER,
      username,
      email,
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
      login,
      logout,
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
