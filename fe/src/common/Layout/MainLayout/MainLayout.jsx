/**
 * @fileoverview Layout shell chính cho khu vực `/home`, điều phối header, sidebar, footer, chat và outlet.
 *
 * @module common/Layout/MainLayout
 */

import { Outlet, useMatch, useLocation } from "react-router-dom";
import MainHeader from "@/common/Header/MainHeader/MainHeader";
import MainSidebar from "@/common/Sidebar/MainSidebar/MainSidebar";
import HomeSidebar from "@/common/Sidebar/HomeSidebar/HomeSidebar";
import Footer from "@/common/Footer/Footer";
import ChatFab from "@/features/chat/ChatFab/ChatFab";
import { MainShellProvider, useMainShell } from "@/common/context/MainShellContext";
import { isHomeSubjectArea } from "@/utils/subjectPaths";
import styles from "./MainLayout.module.css";

/**
 * @typedef {Object} MainLayoutFrameProps
 * @property {boolean} hideRightSidebar - Ẩn cột phải khi vào các màn cần tập trung.
 * @property {boolean} isSubjectArea - Đang ở khu vực môn học/tài liệu/đề thi.
 * @property {boolean | null} isFriendsArea - Match route bạn bè.
 * @property {boolean} isFriendProfilePage - Đang ở hồ sơ bạn bè.
 * @property {boolean} isProfilePage - Đang ở hồ sơ cá nhân.
 * @property {boolean} isEditProfilePage - Đang ở màn sửa hồ sơ.
 * @property {boolean} isCreatePostPage - Đang ở màn tạo bài viết.
 * @property {boolean} isFeedbackPage - Đang ở màn gửi phản hồi.
 * @property {boolean} isMessagesPage - Đang ở màn nhắn tin.
 * @property {boolean} isPremiumPage - Đang ở trang Premium landing trong khu vực home.
 * @property {boolean} isCheckoutPage - Đang ở checkout Premium.
 * @property {boolean} isPaymentSuccessPage - Đang ở trang success sau thanh toán.
 * @property {boolean} isPostDetailPage - Đang ở chi tiết bài viết.
 * @property {boolean} isSearchPage - Đang ở trang tìm kiếm.
 */

/**
 * Frame trình bày của `MainLayout` sau khi đã resolve toàn bộ cờ route.
 *
 * Tách riêng component này để hook `useMainShell()` nằm bên trong `MainShellProvider`.
 *
 * @param {MainLayoutFrameProps} props - Các cờ điều khiển hiển thị shell.
 * @returns {import('react').ReactElement} Shell layout hoàn chỉnh với `Outlet`.
 */
function MainLayoutFrame({
  hideRightSidebar,
  isSubjectArea,
  isFriendsArea,
  isFriendProfilePage,
  isProfilePage,
  isEditProfilePage,
  isCreatePostPage,
  isFeedbackPage,
  isMessagesPage,
  isPremiumPage,
  isCheckoutPage,
  isPaymentSuccessPage,
  isPostDetailPage,
  isSearchPage,
}) {
  const { sidebarOpen } = useMainShell();

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
        <div
          className={[
            styles["col-left"],
            sidebarOpen && styles["col-left-drawer-open"],
          ]
            .filter(Boolean)
            .join(" ")}
        >
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
        !isSearchPage && <Footer />}
      {!isMessagesPage &&
        !isEditProfilePage &&
        !isPremiumPage &&
        !isCheckoutPage &&
        !isPaymentSuccessPage && <ChatFab />}
    </div>
  );
}

/**
 * Layout chính cho khu vực người dùng đã đăng nhập (`/home` và các route profile liên quan).
 *
 * Nhiệm vụ:
 * - Suy ra các route cần tối giản chrome (ẩn right sidebar/footer/chat).
 * - Bọc toàn bộ shell trong `MainShellProvider`.
 * - Cấp `Outlet` cho mọi page thuộc workspace chính.
 *
 * @returns {import('react').ReactElement} Layout chính bọc các route protected.
 *
 * @example
 * <Route element={<MainLayout />}>
 *   <Route path="/home" element={<HomePage />} />
 * </Route>
 */
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
    <MainShellProvider layout="main">
      <MainLayoutFrame
        hideRightSidebar={hideRightSidebar}
        isSubjectArea={isSubjectArea}
        isFriendsArea={isFriendsArea}
        isFriendProfilePage={Boolean(isFriendProfilePage)}
        isProfilePage={Boolean(isProfilePage)}
        isEditProfilePage={Boolean(isEditProfilePage)}
        isCreatePostPage={Boolean(isCreatePostPage)}
        isFeedbackPage={Boolean(isFeedbackPage)}
        isMessagesPage={Boolean(isMessagesPage)}
        isPremiumPage={Boolean(isPremiumPage)}
        isCheckoutPage={Boolean(isCheckoutPage)}
        isPaymentSuccessPage={Boolean(isPaymentSuccessPage)}
        isPostDetailPage={Boolean(isPostDetailPage)}
        isSearchPage={Boolean(isSearchPage)}
      />
    </MainShellProvider>
  );
}

export default MainLayout;
