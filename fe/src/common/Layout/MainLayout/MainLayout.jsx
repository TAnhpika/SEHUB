import { Outlet, useMatch } from "react-router-dom";
import MainHeader from "@/common/Header/MainHeader/MainHeader";
import MainSidebar from "@/common/Sidebar/MainSidebar/MainSidebar";
import HomeSidebar from "@/common/Sidebar/HomeSidebar/HomeSidebar";
import Footer from "@/common/Footer/Footer";
import ChatFab from "@/features/chat/ChatFab/ChatFab";
import styles from "./MainLayout.module.css";

function MainLayout() {
  const isFriendsArea = useMatch({ path: "/home/friends", end: false });
  const isFriendProfilePage = useMatch("/home/friends/:username");
  const isProfilePage = useMatch({ path: "/profile/:username", end: true });
  const isEditProfilePage = useMatch("/profile/:username/edit");
  const isCreatePostPage = useMatch("/home/create-post");
  const isFeedbackPage = useMatch("/home/feedback");
  const isMessagesPage = useMatch("/home/messages");
  const isPostDetailPage = useMatch("/home/posts/:postId");
  const hideRightSidebar =
    isFriendsArea ||
    isProfilePage ||
    isEditProfilePage ||
    isCreatePostPage ||
    isFeedbackPage ||
    isMessagesPage ||
    isPostDetailPage;

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

      {!isProfilePage &&
        !isEditProfilePage &&
        !isFriendProfilePage &&
        !isCreatePostPage &&
        !isFeedbackPage &&
        !isMessagesPage &&
        !isPostDetailPage && (
        <Footer />
      )}
      {!isMessagesPage && !isEditProfilePage && <ChatFab />}
    </div>
  );
}

export default MainLayout;
