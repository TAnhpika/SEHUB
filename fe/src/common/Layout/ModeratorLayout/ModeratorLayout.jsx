import { Outlet } from "react-router-dom";
import ModeratorHeader from "@/common/Header/ModeratorHeader/ModeratorHeader";
import ModeratorSidebar from "@/common/Sidebar/ModeratorSidebar/ModeratorSidebar";
import styles from "./ModeratorLayout.module.css";

function ModeratorLayout() {
  return (
    <div className={styles.layout}>
      <ModeratorSidebar />
      <div className={styles.main}>
        <ModeratorHeader />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default ModeratorLayout;
