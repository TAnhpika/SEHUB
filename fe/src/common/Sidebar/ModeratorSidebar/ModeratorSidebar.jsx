import { Link, NavLink } from "react-router-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import {
  getModeratorNavBadgeCounts,
  isModeratorNavActive,
  MODERATOR_NAV_GROUPS,
} from "@/features/moderator/moderatorNavData";
import styles from "./ModeratorSidebar.module.css";

function ModeratorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useModeratorPage();
  const displayName = user?.displayName ?? "Admin User";
  const badgeCounts = getModeratorNavBadgeCounts();

  function handleNavClick() {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h1 className={styles.logo}>
          <span>SEHub</span>
          <span>Moderator</span>
        </h1>
        <p className={styles.tagline}>Hệ thống kiểm duyệt</p>
      </div>

      <nav className={styles.nav} aria-label="Điều hướng kiểm duyệt">
        {MODERATOR_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles["link-active"] : ""}`
            }
          >
            <FontAwesomeIcon icon={item.icon} className={styles.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {isAdmin ? (
        <Link to="/admin" className={styles.adminLink}>
          → Khu vực Admin
        </Link>
      ) : null}

      <div className={styles.profile}>
        <div className={styles.avatar} aria-hidden>
          {user?.initial ?? "A"}
        </div>
        <div>
          <p className={styles.name}>{displayName}</p>
          <p className={styles.role}>{roleLabel}</p>
    <>
      {sidebarOpen ? (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
        aria-label="Sidebar kiểm duyệt"
      >
        <div className={styles.inner}>
          <div className={styles.brand}>
            <h1 className={styles.logo}>
              <span>SEHub</span>
              <span>Moderator</span>
            </h1>
            <p className={styles.tagline}>Hệ thống kiểm duyệt</p>
          </div>

          <nav className={styles.nav} aria-label="Điều hướng kiểm duyệt">
            {MODERATOR_NAV_GROUPS.map((group) => (
              <div key={group.id} className={styles.group}>
                <p className={styles.groupLabel}>{group.label}</p>
                {group.items.map((item) => {
                  const isActive = isModeratorNavActive(item, location.pathname);
                  const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

                  return (
                    <NavLink
                      key={item.id}
                      to={item.to}
                      end={false}
                      className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
                      onClick={handleNavClick}
                    >
                      <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                      <span className={styles.linkLabel}>{item.label}</span>
                      {badgeCount > 0 ? (
                        <span className={styles.badge} aria-label={`${badgeCount} chờ xử lý`}>
                          {badgeCount}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className={styles.footer}>
            <div className={styles.profile}>
              <div className={styles.avatar} aria-hidden>
                {user?.initial ?? "A"}
              </div>
              <div className={styles.profileText}>
                <p className={styles.name}>{displayName}</p>
                <p className={styles.email}>{user?.email ?? "admin@sehub.edu.vn"}</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.logout}
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default ModeratorSidebar;
