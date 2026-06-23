import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faChevronDown,
  faHouse,
  faMagnifyingGlass,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import WorkspaceSwitcher from "@/common/WorkspaceSwitcher/WorkspaceSwitcher";
import { useAuth } from "@/context";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import {
  MODERATOR_HOME_PATH,
  resolveModeratorPageTitle,
} from "@/features/moderator/moderatorNavData";
import ModeratorNotificationDropdown from "./ModeratorNotificationDropdown";
import ModeratorSettingsDropdown from "./ModeratorSettingsDropdown";
import styles from "./ModeratorHeader.module.css";

function ModeratorHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setSidebarOpen } = useModeratorPage();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = useMemo(
    () => resolveModeratorPageTitle(location.pathname),
    [location.pathname],
  );

  const displayName = user?.displayName ?? "Moderator";
  const initial = user?.initial ?? displayName.charAt(0).toUpperCase();
  const [openPanel, setOpenPanel] = useState(null);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.lead}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Mở menu"
            onClick={() => setSidebarOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to={MODERATOR_HOME_PATH} className={styles.breadcrumbLink}>
              <FontAwesomeIcon icon={faHouse} className={styles.breadcrumbIcon} />
              Moderator
            </Link>
            <span className={styles.breadcrumbSep} aria-hidden>
              /
            </span>
            <span className={styles.breadcrumbCurrent}>{pageTitle}</span>
          </nav>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>

        <div className={styles.searchWrap}>
          <label className={styles.search} htmlFor="moderator-global-search">
            <span className={styles.searchIconWrap} aria-hidden>
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </span>
            <input
              id="moderator-global-search"
              type="search"
              className={styles.searchInput}
              placeholder="Tìm báo cáo, bài viết, tài khoản..."
            />
          </label>
        </div>

        <div className={styles.actions}>
          <div className={styles.toolGroup} role="group" aria-label="Hành động nhanh">
            <ModeratorSettingsDropdown
              open={openPanel === "settings"}
              onToggle={() =>
                setOpenPanel((current) => (current === "settings" ? null : "settings"))
              }
              onClose={() => setOpenPanel(null)}
            />
            <ModeratorNotificationDropdown
              open={openPanel === "notifications"}
              onToggle={() =>
                setOpenPanel((current) => (current === "notifications" ? null : "notifications"))
              }
              onClose={() => setOpenPanel(null)}
            />
          </div>

          <div className={`${styles.profile} ${menuOpen ? styles.profileOpen : ""}`}>
            <button
              type="button"
              className={styles.profileTrigger}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
              onBlur={(e) => {
                if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
                  setMenuOpen(false);
                }
              }}
            >
              <span className={styles.avatar}>{initial}</span>
              <span className={styles.profileMeta}>
                <span className={styles.profileName}>{displayName}</span>
                <span className={styles.profileRole}>Kiểm duyệt viên</span>
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ""}`}
              />
            </button>

            {menuOpen ? (
              <div className={styles.menu} role="menu">
                <div className={styles.menuWorkspace}>
                  <WorkspaceSwitcher
                    variant="menu-compact"
                    onNavigate={() => setMenuOpen(false)}
                  />
                </div>
                <div className={styles.menuDivider} />
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <span className={`${styles.menuIcon} ${styles.menuIconDanger}`}>
                    <FontAwesomeIcon icon={faRightFromBracket} />
                  </span>
                  Đăng xuất
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export default ModeratorHeader;
