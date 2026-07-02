import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useMainShell } from "@/common/context/MainShellContext";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import SubjectNavSection from "@/common/Sidebar/SubjectNavSection/SubjectNavSection";
import styles from "./FeedSidebar.module.css";

const MAIN_LINKS = [
  { to: "/community", label: "Trang chủ", icon: faHome, end: true },
  { to: "/home/friends", label: "Tìm kiếm bạn bè", icon: faUserGroup, requiresAuth: true },
];

function FeedSidebar() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useRequireAuth();
  const { sidebarOpen, closeSidebar } = useMainShell();

  useLockBodyScroll(sidebarOpen);

  function handleFindFriends() {
    requireAuth("Vui lòng đăng nhập để tìm kiếm bạn bè.");
  }

  function handleNavClick() {
    if (window.innerWidth <= 1024) {
      closeSidebar();
    }
  }

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Đóng menu"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
        aria-label="Điều hướng cộng đồng"
      >
        <div className={styles.panel}>
          <nav className={styles.nav}>
            {MAIN_LINKS.map((item) => {
              if (item.requiresAuth && !isAuthenticated) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={styles.link}
                    onClick={() => {
                      handleFindFriends();
                      handleNavClick();
                    }}
                  >
                    <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                    {item.label}
                  </button>
                );
              }

              if (item.requiresAuth && isAuthenticated) {
                const isActive = pathname.startsWith(item.to);

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
              }

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

          <SubjectNavSection pathname={pathname} styles={styles} onNavigate={handleNavClick} />
        </div>
      </aside>
    </>
  );
}

export default FeedSidebar;
