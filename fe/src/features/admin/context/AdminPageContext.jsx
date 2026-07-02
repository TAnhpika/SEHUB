import { createContext, useContext, useMemo, useState } from "react";

const AdminPageContext = createContext(null);

export function AdminPageProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
    }),
    [sidebarOpen],
  );

  return <AdminPageContext.Provider value={value}>{children}</AdminPageContext.Provider>;
}

export function useAdminPage() {
  const context = useContext(AdminPageContext);
  if (!context) {
    throw new Error("useAdminPage must be used within AdminPageProvider");
  }
  return context;
}
