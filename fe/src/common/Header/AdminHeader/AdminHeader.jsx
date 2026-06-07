import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faChevronDown,
  faGear,
  faHouse,
  faMagnifyingGlass,
  faRightFromBracket,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { flattenAdminNavItems } from "@/features/admin/adminNavData";
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
  const unread = user?.unreadNotifications ?? 0;

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
            <button type="button" className={styles.toolBtn} aria-label="Cài đặt">
              <FontAwesomeIcon icon={faGear} />
            </button>
            <button type="button" className={styles.toolBtn} aria-label="Thông báo">
              <FontAwesomeIcon icon={faBell} />
              {unread > 0 ? (
                <span className={styles.notifDot} aria-hidden />
              ) : null}
            </button>
          </div>

          <div
            className={`${styles.profile} ${menuOpen ? styles.profileOpen : ""}`}
          >
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
                <span className={styles.profileRole}>Quản trị viên</span>
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ""}`}
              />
            </button>

            {menuOpen ? (
              <div className={styles.menu} role="menu">
                <p className={styles.menuHeading}>Tài khoản</p>
                <Link
                  to="/admin"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.menuIcon}>
                    <FontAwesomeIcon icon={faUser} />
                  </span>
                  Dashboard
                </Link>
                <Link
                  to="/moderator/reports"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.menuIcon}>
                    <FontAwesomeIcon icon={faShieldHalved} />
                  </span>
                  Khu vực Moderator
                </Link>
                <Link
                  to="/home"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.menuIcon}>↗</span>
                  Trang sinh viên
                </Link>
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

export default AdminHeader;
