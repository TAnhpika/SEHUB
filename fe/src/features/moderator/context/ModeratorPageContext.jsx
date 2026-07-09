/**
 * @fileoverview React Context quản lý meta trang và trạng thái sidebar khu vực Moderator SEHUB.
 *
 * Cung cấp `ModeratorPageProvider` bọc layout Moderator và hook `useModeratorPage` để:
 * - Đồng bộ title, description, breadcrumb và actions từ `ModeratorPageShell` lên header.
 * - Điều khiển mở/đóng sidebar trên mobile.
 *
 * @module features/moderator/context/ModeratorPageContext
 * @see {@link module:features/moderator/components/ModeratorPageShell} — ghi meta trang qua `setPageMeta`
 */

import { createContext, useContext, useMemo, useState } from "react";

/**
 * Context nội bộ; giá trị `null` khi chưa bọc bởi `ModeratorPageProvider`.
 *
 * @type {import('react').Context<ModeratorPageContextValue | null>}
 */
const ModeratorPageContext = createContext(null);

/**
 * Giá trị meta trang rỗng — dùng khởi tạo state và reset khi unmount shell.
 *
 * @constant {ModeratorPageMeta}
 * @readonly
 */
const EMPTY_META = {
  title: "",
  description: "",
  crumbs: [],
  actions: null,
};

/**
 * @typedef {Object} ModeratorPageCrumb
 * @property {string} label - Nhãn breadcrumb hiển thị trên header.
 * @property {string} [to] - Đường dẫn điều hướng; bỏ qua cho mục cuối.
 */

/**
 * @typedef {Object} ModeratorPageMeta
 * @property {string} title - Tiêu đề trang hiện tại.
 * @property {string} description - Mô tả phụ trang.
 * @property {ReadonlyArray<ModeratorPageCrumb>} crumbs - Chuỗi breadcrumb.
 * @property {import('react').ReactNode | null} actions - Hành động header (nút, menu).
 */

/**
 * @typedef {Object} ModeratorPageContextValue
 * @property {ModeratorPageMeta} pageMeta - Meta trang đang hiển thị trên layout.
 * @property {import('react').Dispatch<import('react').SetStateAction<ModeratorPageMeta>>} setPageMeta - Cập nhật meta (thường từ `ModeratorPageShell`).
 * @property {boolean} sidebarOpen - Sidebar mobile đang mở hay đóng.
 * @property {import('react').Dispatch<import('react').SetStateAction<boolean>>} setSidebarOpen - Bật/tắt sidebar.
 */

/**
 * @typedef {Object} ModeratorPageProviderProps
 * @property {import('react').ReactNode} children - Cây component con (thường là `ModeratorLayout`).
 */

/**
 * Provider bọc toàn bộ layout Moderator, cung cấp meta trang và state sidebar.
 *
 * @param {ModeratorPageProviderProps} props - Props của provider.
 * @returns {import('react').ReactElement} Context provider với value memoized.
 *
 * @example
 * <ModeratorPageProvider>
 *   <ModeratorLayout />
 * </ModeratorPageProvider>
 */
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

/**
 * Hook truy cập context Moderator — meta trang và điều khiển sidebar.
 *
 * @returns {ModeratorPageContextValue} Giá trị context gồm `pageMeta`, `setPageMeta`, `sidebarOpen`, `setSidebarOpen`.
 * @throws {Error} Khi gọi ngoài `ModeratorPageProvider` (message: `useModeratorPage must be used within ModeratorPageProvider`).
 *
 * @example
 * const { pageMeta, setSidebarOpen } = useModeratorPage();
 * // pageMeta.title — tiêu đề do ModeratorPageShell đồng bộ
 */
export function useModeratorPage() {
  const context = useContext(ModeratorPageContext);
  if (!context) {
    throw new Error("useModeratorPage must be used within ModeratorPageProvider");
  }
  return context;
}
