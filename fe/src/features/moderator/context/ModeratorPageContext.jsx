import { createContext, useContext, useMemo, useState } from "react";

const ModeratorPageContext = createContext(null);

const EMPTY_META = {
  title: "",
  description: "",
  crumbs: [],
  actions: null,
};

export function ModeratorPageProvider({ children }) {
  const [pageMeta, setPageMeta] = useState(EMPTY_META);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const value = useMemo(
    () => ({
      pageMeta,
      setPageMeta,
      sidebarOpen,
      setSidebarOpen,
    }),
    [pageMeta, sidebarOpen],
  );

  return (
    <ModeratorPageContext.Provider value={value}>{children}</ModeratorPageContext.Provider>
  );
}

export function useModeratorPage() {
  const context = useContext(ModeratorPageContext);
  if (!context) {
    throw new Error("useModeratorPage must be used within ModeratorPageProvider");
  }
  return context;
}
