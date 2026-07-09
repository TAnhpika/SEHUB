/**
 * @fileoverview Sidebar chính trong khu vực `/home`, gồm nav cốt lõi, môn học, tương tác và upsell Premium.
 *
 * @module common/Sidebar/MainSidebar
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faCommentDots, faHome, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "@/context";
import { useMainShell } from "@/common/context/MainShellContext";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import Button from "@/common/Button/Button";
import SubjectNavSection from "@/common/Sidebar/SubjectNavSection/SubjectNavSection";
import InteractionNavSection from "@/common/Sidebar/InteractionNavSection/InteractionNavSection";
import styles from "./MainSidebar.module.css";

/**
 * Các link điều hướng top-level luôn hiển thị trong sidebar chính.
 *
 * @constant {Array<{ to: string, label: string, icon: import('@fortawesome/fontawesome-svg-core').IconDefinition, end?: boolean }>}
 * @readonly
 */
const MAIN_LINKS = [
  { to: "/home", label: "Trang chủ", icon: faHome, end: true },
  { to: "/home/friends", label: "Tìm kiếm bạn bè", icon: faUserGroup },
];

/**
 * Sidebar trái dùng cho shell khu vực người dùng đã đăng nhập.
 *
 * Sidebar hỗ trợ:
 * - Drawer mobile với overlay portal và lock body scroll.
 * - Điều hướng môn học/tương tác có phụ thuộc quyền Premium.
 * - Khối CTA nâng cấp Premium và liên kết cộng đồng/feedback.
 *
 * @returns {import('react').ReactElement} Sidebar chính của `MainLayout`.
 *
 * @example
 * <MainSidebar />
 */
function MainSidebar() {
  const { pathname } = useLocation();
  const { isPremium } = useAuth();
  const { sidebarOpen, closeSidebar } = useMainShell();

  useLockBodyScroll(sidebarOpen);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  /**
   * Đóng drawer sau khi click điều hướng trên màn nhỏ để tránh che nội dung mới.
   *
   * @returns {void}
   */
  function handleNavClick() {
    if (window.innerWidth <= 1024) {
      closeSidebar();
    }
  }

  return (
    <>
      {sidebarOpen
        ? createPortal(
            <button
              type="button"
              className="shell-drawer-overlay"
              aria-label="Đóng menu"
              onClick={closeSidebar}
            />,
            document.body,
          )
        : null}

      <div className={styles.root}>
        <aside
          className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
          aria-label="Điều hướng chính"
        >
          <div className={styles.panel}>
            <div className={styles["panel-main"]}>
              <nav className={styles.nav}>
                {MAIN_LINKS.map((item) => {
                  const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);

                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`${styles.link} ${isActive ? styles.active : ""}`}
                      onClick={handleNavClick}
                    >
                      <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <SubjectNavSection
                pathname={pathname}
                styles={styles}
                scope="home"
                isPremium={isPremium}
                onNavigate={handleNavClick}
              />

              <InteractionNavSection pathname={pathname} styles={styles} isPremium={isPremium} onNavigate={handleNavClick} />
            </div>

            <div className={styles["panel-footer"]}>
              <div className={styles.premium}>
                <div className={styles["premium-header"]}>
                  <span className={styles["premium-icon"]} aria-hidden="true">
                    <FontAwesomeIcon icon={faAward} />
                  </span>
                  <p className={styles["premium-title"]}>Nâng cấp Premium</p>
                </div>
                <p className={styles["premium-desc"]}>
                  Xem full đáp án, tài liệu, AI không giới hạn
                </p>
                <Button
                  size="sm"
                  fullWidth
                  className={styles["premium-btn"]}
                  to="/home/premium"
                  onClick={handleNavClick}
                >
                  Xem gói ngay
                </Button>
              </div>

              <a
                href="https://discord.gg/BBeTyn6Heh"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["subject-link"]}
              >
                <FontAwesomeIcon icon={faDiscord} className={styles.icon} />
                Cộng đồng Discord
              </a>

              <Link to="/home/feedback" className={styles["subject-link"]} onClick={handleNavClick}>
                <FontAwesomeIcon icon={faCommentDots} className={styles.icon} />
                Gửi phản hồi
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default MainSidebar;
