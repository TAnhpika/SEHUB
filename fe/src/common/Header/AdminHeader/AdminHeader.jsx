import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import WorkspaceSwitcher from "@/common/WorkspaceSwitcher/WorkspaceSwitcher";
import { flattenAdminNavItems } from "@/features/admin/adminNavData";
import AdminNotificationDropdown from "./AdminNotificationDropdown";
import AdminSettingsMenu from "./AdminSettingsMenu";
import ThemeSwitcher from "@/common/ThemeSwitcher/ThemeSwitcher";
import HeaderProfileMenu, { HeaderProfileLogoutItem } from "@/common/Header/shared/HeaderProfileMenu";
import styles from "./AdminHeader.module.css";

function resolvePageTitle(pathname, search) {
  const params = new URLSearchParams(search);
  if (pathname === "/admin/users" && params.get("status") === "banned") {
    return "Tài khoản bị khóa";
  }

  const flat = flattenAdminNavItems();
  const sorted = [...flat].sort((a, b) => b.to.length - a.to.length);
  for (const item of sorted) {
    const basePath = item.to.split("?")[0];
    if (item.end && pathname === basePath) return item.label;
    if (!item.end && pathname.startsWith(basePath) && basePath !== "/admin") {
      return item.label;
    }
  }
  if (pathname === "/admin") return "Dashboard";
  if (pathname === "/admin/activity") return "Nhật ký hoạt động";
  if (pathname.startsWith("/admin/users/")) return "Chi tiết tài khoản";
  if (pathname.includes("/edit")) return "Sửa đề thi";
  if (pathname.includes("/new")) return "Thêm đề thi";
  return "Quản trị";
}

function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = useMemo(
    () => resolvePageTitle(location.pathname, location.search),
    [location.pathname, location.search],
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
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>

        <div className={styles.searchWrap}>
          <label className={styles.search} htmlFor="admin-global-search">
            <span className={styles.searchIconWrap} aria-hidden>
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </span>
            <input
              id="admin-global-search"
              type="search"
              className={styles.searchInput}
              placeholder="Tìm kiếm user, đề thi, báo cáo..."
            />
          </label>
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
