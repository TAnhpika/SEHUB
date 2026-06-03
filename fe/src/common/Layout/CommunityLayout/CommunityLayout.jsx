import { Outlet, useMatch } from "react-router-dom";
import GuestHeader from "@/common/Header/GuestHeader/GuestHeader";
import FeedSidebar from "@/common/Sidebar/FeedSidebar/FeedSidebar";
import CommunitySidebar from "@/common/Sidebar/CommunitySidebar/CommunitySidebar";
import Footer from "@/common/Footer/Footer";
import styles from "./CommunityLayout.module.css";

function CommunityLayout() {
  const isFeedHome = useMatch({ path: "/community", end: true });

  return (
    <div className={styles.layout}>
      <GuestHeader />

      <div
        className={`${styles.workspace} ${isFeedHome ? styles["workspace-feed"] : ""}`}
      >
        <div className={styles["col-left"]}>
          <FeedSidebar />
        </div>

        <main className={styles["col-center"]} id="feed-top">
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

export default CommunityLayout;
