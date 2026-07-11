import { Outlet, useMatch } from "react-router-dom";
import GuestHeader from "@/common/Header/GuestHeader/GuestHeader";
import FeedSidebar from "@/common/Sidebar/FeedSidebar/FeedSidebar";
import CommunitySidebar from "@/common/Sidebar/CommunitySidebar/CommunitySidebar";
import Footer from "@/common/Footer/Footer";
import { MainShellProvider, useMainShell } from "@/common/context/MainShellContext";
import styles from "./CommunityLayout.module.css";

function CommunityLayoutFrame({ isFeedHome }) {
  const { sidebarOpen } = useMainShell();

  const workspaceClass = [styles.workspace, isFeedHome && styles["workspace-feed"]]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.layout}>
      <GuestHeader />

      <div className={workspaceClass}>
        <div
          className={[
            styles["col-left"],
            sidebarOpen && styles["col-left-drawer-open"],
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <FeedSidebar />
        </div>

        <main
          className={[
            styles["col-center"],
            !isFeedHome && styles["col-center-balanced"],
          ]
            .filter(Boolean)
            .join(" ")}
          id="feed-top"
        >
          <Outlet />
        </main>

        {isFeedHome && (
          <div className={styles["col-right"]}>
            <CommunitySidebar />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function CommunityLayout() {
  const isFeedHome = useMatch({ path: "/community", end: true });

  return (
    <MainShellProvider layout="community">
      <CommunityLayoutFrame isFeedHome={Boolean(isFeedHome)} />
    </MainShellProvider>
  );
}

export default CommunityLayout;
