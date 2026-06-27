import { createContext, useCallback, useContext, useMemo, useState } from "react";

const MainShellContext = createContext(null);

export function MainShellProvider({ layout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      layout,
      sidebarOpen,
      setSidebarOpen,
      closeSidebar,
    }),
    [layout, sidebarOpen, closeSidebar],
  );

  return <MainShellContext.Provider value={value}>{children}</MainShellContext.Provider>;
}

export function useMainShell() {
  const context = useContext(MainShellContext);
  if (!context) {
    throw new Error("useMainShell must be used within MainShellProvider");
  }
  return context;
}

export function useMainShellOptional() {
  return useContext(MainShellContext);
}
