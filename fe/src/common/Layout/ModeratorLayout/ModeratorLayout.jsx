import { Outlet } from "react-router-dom";
import ModeratorHeader from "@/common/Header/ModeratorHeader/ModeratorHeader";
import ModeratorSidebar from "@/common/Sidebar/ModeratorSidebar/ModeratorSidebar";
import { ModeratorPageProvider } from "@/features/moderator/context/ModeratorPageContext";
import styles from "./ModeratorLayout.module.css";

function ModeratorLayout() {
  return (
    <ModeratorPageProvider>
      <div className={styles.layout}>
        <ModeratorSidebar />
        <div className={styles.main}>
          <ModeratorHeader />
          <div className={styles.content}>
            <Outlet />
          </div>
        </div>
      </div>
    </ModeratorPageProvider>
  );
}

export default ModeratorLayout;
