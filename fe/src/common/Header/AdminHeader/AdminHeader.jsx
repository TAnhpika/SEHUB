import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faHouse } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useAdminPage } from "@/features/admin/context/AdminPageContext";
import { resolveAdminPageTitle } from "@/features/admin/adminNavData";
import WorkspaceSwitcher from "@/common/WorkspaceSwitcher/WorkspaceSwitcher";
import AdminNotificationDropdown from "./AdminNotificationDropdown";
import AdminSettingsMenu from "./AdminSettingsMenu";
import ThemeSwitcher from "@/common/ThemeSwitcher/ThemeSwitcher";
import HeaderProfileMenu, { HeaderProfileLogoutItem } from "@/common/Header/shared/HeaderProfileMenu";
import styles from "./AdminHeader.module.css";

function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setSidebarOpen } = useAdminPage();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = useMemo(
    () => resolveAdminPageTitle(location.pathname),
    [location.pathname],
  );

  const displayName = user?.displayName ?? "Admin";
  const initial = user?.initial ?? displayName.charAt(0).toUpperCase();

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
            <Link to="/admin" className={styles.breadcrumbLink}>
              <FontAwesomeIcon icon={faHouse} className={styles.breadcrumbIcon} />
              Admin
            </Link>
            <span className={styles.breadcrumbSep} aria-hidden>
              /
            </span>
            <span className={styles.breadcrumbCurrent}>{pageTitle}</span>
          </nav>
        </div>

        <div className={styles.actions}>
          <div className={styles.toolGroup} role="group" aria-label="Hành động nhanh">
            <AdminSettingsMenu />
            <AdminNotificationDropdown />
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
            roleLabel="Quản trị viên"
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

export default AdminHeader;
