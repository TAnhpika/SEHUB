import { Outlet, useMatch } from "react-router-dom";
import GuestHeader from "@/common/Header/GuestHeader/GuestHeader";
import MainHeader from "@/common/Header/MainHeader/MainHeader";
import FeedSidebar from "@/common/Sidebar/FeedSidebar/FeedSidebar";
import MainSidebar from "@/common/Sidebar/MainSidebar/MainSidebar";
import CommunitySidebar from "@/common/Sidebar/CommunitySidebar/CommunitySidebar";
import Footer from "@/common/Footer/Footer";
import ChatFab from "@/features/chat/ChatFab/ChatFab";
import { useAuth } from "@/context/AuthContext";
import styles from "./CommunityLayout.module.css";

function CommunityLayout() {
  const { isAuthenticated } = useAuth();
  const isFeedHome = useMatch({ path: "/community", end: true });

  const workspaceClass = [
    styles.workspace,
    isAuthenticated && styles["workspace-auth"],
    !isAuthenticated && isFeedHome && styles["workspace-feed"],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.layout}>
      {isAuthenticated ? <MainHeader /> : <GuestHeader />}

      <div className={workspaceClass}>
        <div className={styles["col-left"]}>
          {isAuthenticated ? <MainSidebar /> : <FeedSidebar />}
        </div>

        <main className={styles["col-center"]} id="feed-top">
          <Outlet />
        </main>

        {!isAuthenticated && isFeedHome && (
          <div className={styles["col-right"]}>
            <CommunitySidebar />
          </div>
        )}
      </div>

      <Footer />

      {isAuthenticated && <ChatFab />}
    </div>
  );
}

export default CommunityLayout;
