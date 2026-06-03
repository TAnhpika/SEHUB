import { Outlet, useMatch } from "react-router-dom";
import MainHeader from "@/common/Header/MainHeader/MainHeader";
import MainSidebar from "@/common/Sidebar/MainSidebar/MainSidebar";
import HomeSidebar from "@/common/Sidebar/HomeSidebar/HomeSidebar";
import Footer from "@/common/Footer/Footer";
import styles from "./MainLayout.module.css";

function MainLayout() {
  const isFriendsArea = useMatch({ path: "/home/friends", end: false });
  const isFriendProfilePage = useMatch("/home/friends/:username");
  const isProfilePage = useMatch("/profile/:username");
  const hideRightSidebar = isFriendsArea || isProfilePage;

  return (
    <div className={styles.layout}>
      <MainHeader />

      <div className={`${styles.workspace} ${hideRightSidebar ? styles["workspace-single"] : ""}`}>
        <div className={styles["col-left"]}>
          <MainSidebar />
        </div>

        <main className={styles["col-center"]} id="home-top">
          <Outlet />
        </main>

        {!hideRightSidebar && (
          <div className={styles["col-right"]}>
            <HomeSidebar />
          </div>
        )}
      </div>

      {!isProfilePage && !isFriendProfilePage && <Footer />}
    </div>
  );
}

export default MainLayout;
