import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "sehubs_user";
const TOKEN_KEY = "sehubs_token";

const MOCK_USER = {
  username: "minhpt_se",
  displayName: "Minh Phạm",
  initial: "M",
  level: "Silver",
  points: 240,
  streak: 5,
  levelProgress: 68,
  pointsToNext: 60,
  role: "student",
};

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback((credentials) => {
    const nextUser = {
      ...MOCK_USER,
      username: credentials?.username?.trim() || MOCK_USER.username,
      displayName: credentials?.displayName?.trim() || MOCK_USER.displayName,
      initial: (credentials?.username?.trim()?.[0] || MOCK_USER.initial).toUpperCase(),
    };

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
