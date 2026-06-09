import { Outlet, useMatch, useLocation } from "react-router-dom";
import MainHeader from "@/common/Header/MainHeader/MainHeader";
import MainSidebar from "@/common/Sidebar/MainSidebar/MainSidebar";
import HomeSidebar from "@/common/Sidebar/HomeSidebar/HomeSidebar";
import Footer from "@/common/Footer/Footer";
import ChatFab from "@/features/chat/ChatFab/ChatFab";
import { isHomeSubjectArea } from "@/utils/subjectPaths";
import styles from "./MainLayout.module.css";

function MainLayout() {
  const { pathname } = useLocation();
  const isSubjectArea = isHomeSubjectArea(pathname);
  const isFriendsArea = useMatch({ path: "/home/friends", end: false });
  const isFriendProfilePage = useMatch("/home/friends/:username");
  const isProfilePage = useMatch({ path: "/profile/:username", end: true });
  const isEditProfilePage = useMatch("/profile/:username/edit");
  const isCreatePostPage = useMatch("/home/create-post");
  const isFeedbackPage = useMatch("/home/feedback");
  const isMessagesPage = useMatch("/home/messages");
  const isPremiumPage = useMatch({ path: "/home/premium", end: true });
  const isCheckoutPage = useMatch("/home/premium/checkout/:planId");
  const isPaymentSuccessPage = useMatch("/home/premium/success/:planId");
  const isPostDetailPage = useMatch("/home/posts/:postId");
  const isSearchPage = useMatch("/home/search");
  const hideRightSidebar =
    isSubjectArea ||
    isSearchPage ||
    isFriendsArea ||
    isProfilePage ||
    isEditProfilePage ||
    isCreatePostPage ||
    isFeedbackPage ||
    isMessagesPage ||
    isPremiumPage ||
    isCheckoutPage ||
    isPaymentSuccessPage;

  return (
    <div className={styles.layout}>
      <MainHeader />

      <div
        className={[
          styles.workspace,
          hideRightSidebar && styles["workspace-single"],
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles["col-left"]}>
          <MainSidebar />
        </div>

        <main
          className={[
            styles["col-center"],
            isSubjectArea && styles["col-center-balanced"],
          ]
            .filter(Boolean)
            .join(" ")}
          id="home-top"
        >
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
        !isPremiumPage &&
        !isCheckoutPage &&
        !isPaymentSuccessPage &&
        !isPostDetailPage &&
        !isSearchPage && (
        <Footer />
      )}
      {!isMessagesPage &&
        !isEditProfilePage &&
        !isPremiumPage &&
        !isCheckoutPage &&
        !isPaymentSuccessPage && <ChatFab />}
    </div>
  );
}

export default MainLayout;
