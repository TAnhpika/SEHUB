import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHouse,
  faUser,
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
import ThemeSwitcher from "@/common/ThemeSwitcher/ThemeSwitcher";
import HeaderProfileMenu, { HeaderProfileLogoutItem } from "@/common/Header/shared/HeaderProfileMenu";
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

          <HeaderProfileMenu
            open={menuOpen}
            onToggle={() => setMenuOpen((open) => !open)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setMenuOpen(false);
              }
            }}
            initial={initial}
            displayName={displayName}
            roleLabel="Kiểm duyệt viên"
            rootClassName={styles.profile}
            rootOpenClassName={styles.profileOpen}
            triggerClassName={styles.profileTrigger}
            avatarClassName={styles.avatar}
            metaClassName={styles.profileMeta}
            nameClassName={styles.profileName}
            roleClassName={styles.profileRole}
            chevronClassName={styles.chevron}
            chevronOpenClassName={styles.chevronOpen}
            menuClassName={styles.menu}
          >
            <ThemeSwitcher variant="menu" />
            <div className={styles.menuDivider} />
            <p className={styles.menuHeading}>Tài khoản</p>
            <Link
              to={MODERATOR_HOME_PATH}
              className={styles.menuItem}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.menuIcon}>
                <FontAwesomeIcon icon={faUser} />
              </span>
              Xử lý báo cáo
            </Link>
            <div className={styles.menuWorkspace}>
              <WorkspaceSwitcher
                variant="menu-compact"
                onNavigate={() => setMenuOpen(false)}
              />
            </div>
            <div className={styles.menuDivider} />
            <HeaderProfileLogoutItem
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              iconClassName={`${styles.menuIcon} ${styles.menuIconDanger}`}
              onClick={handleLogout}
            />
          </HeaderProfileMenu>
        </div>
      </div>
    </header>
  );
}

export default ModeratorHeader;
