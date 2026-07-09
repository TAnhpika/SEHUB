/**
 * @fileoverview Layout khung chính cho khu vực Moderator trong SEHUB.
 *
 * Module này ghép `ModeratorSidebar`, `ModeratorHeader` và `Outlet` của React Router
 * vào cùng một shell, đồng thời bọc toàn bộ cây con bằng `ModeratorPageProvider`
 * để đồng bộ meta trang và trạng thái sidebar mobile.
 *
 * @module common/Layout/ModeratorLayout
 * @see {@link module:features/moderator/context/ModeratorPageContext} - Context điều phối header và sidebar.
 */

import { Outlet } from "react-router-dom";
import ModeratorHeader from "@/common/Header/ModeratorHeader/ModeratorHeader";
import ModeratorSidebar from "@/common/Sidebar/ModeratorSidebar/ModeratorSidebar";
import { ModeratorPageProvider } from "@/features/moderator/context/ModeratorPageContext";
import styles from "../StaffLayout/StaffLayout.module.css";

/**
 * Layout gốc cho mọi route thuộc workspace kiểm duyệt.
 *
 * Cấu trúc render:
 * - `ModeratorPageProvider` cung cấp state dùng chung cho header/sidebar.
 * - `ModeratorSidebar` hiển thị điều hướng nghiệp vụ.
 * - `ModeratorHeader` hiển thị breadcrumb, thông báo và menu hồ sơ.
 * - `Outlet` render trang moderator con theo route hiện tại.
 *
 * @returns {import('react').ReactElement} Cây layout moderator hoàn chỉnh.
 *
 * @example
 * <Route element={<ModeratorLayout />}>
 *   <Route path="/moderator/reports" element={<ReportsPage />} />
 * </Route>
 */
function ModeratorLayout() {
  return (
    <ModeratorPageProvider>
      <div className={styles.layout}>
        <ModeratorSidebar />
        <div className={styles.main}>
          <ModeratorHeader />
          <div className={styles.content} data-layout-scroll>
            <Outlet />
          </div>
        </div>
      </div>
    </ModeratorPageProvider>
  );
}

export default ModeratorLayout;
