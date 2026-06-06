import { Outlet, useMatch } from "react-router-dom";
import GuestHeader from "@/common/Header/GuestHeader/GuestHeader";
import FeedSidebar from "@/common/Sidebar/FeedSidebar/FeedSidebar";
import CommunitySidebar from "@/common/Sidebar/CommunitySidebar/CommunitySidebar";
import Footer from "@/common/Footer/Footer";
import styles from "./CommunityLayout.module.css";

function CommunityLayout() {
  const isFeedHome = useMatch({ path: "/community", end: true });
  const showStudentShell = isAuthenticated && !isFeedHome;

  const workspaceClass = [
    styles.workspace,
    isFeedHome && styles["workspace-feed"],
    showStudentShell && styles["workspace-auth"],
    !showStudentShell && isFeedHome && styles["workspace-feed"],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.layout}>
      <GuestHeader />

      <div className={workspaceClass}>
        <div className={styles["col-left"]}>
          <FeedSidebar />
      {showStudentShell ? <MainHeader /> : <GuestHeader />}

      <div className={workspaceClass}>
        <div className={styles["col-left"]}>
          {showStudentShell ? <MainSidebar /> : <FeedSidebar />}
        </div>

        <main className={styles["col-center"]} id="feed-top">
          <Outlet />
        </main>

        {!showStudentShell && isFeedHome && (
          <div className={styles["col-right"]}>
            <CommunitySidebar />
          </div>
        )}
      </div>

      <Footer />

      {showStudentShell && <ChatFab />}
    </div>
  );
}

export default CommunityLayout;
