import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faMagnifyingGlass,
  faRightFromBracket,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import NotificationDropdown from "./NotificationDropdown";
import { NOTIFICATIONS } from "./notificationData";
import StreakDropdown from "./StreakDropdown";
import logoSrc from "@/img/logo.png";
import styles from "./MainHeader.module.css";

function MainHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout, isAdmin, isModerator, isPremium } = useAuth();
  const brandTo = isAdmin ? "/admin" : "/home";
  const isSearchPage = location.pathname === "/home/search";
  const [searchQuery, setSearchQuery] = useState(() =>
    isSearchPage ? (searchParams.get("q") ?? "") : "",
  );

  useEffect(() => {
    if (isSearchPage) {
      setSearchQuery(searchParams.get("q") ?? "");
    }
  }, [isSearchPage, searchParams]);

  const displayName = user?.displayName ?? "Anhpika";
  const initial = user?.initial ?? displayName.charAt(0).toUpperCase();
  const unreadCount =
    NOTIFICATIONS.length > 0
      ? NOTIFICATIONS.filter((item) => !item.read).length
      : (user?.unreadNotifications ?? 0);

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    navigate(`/home/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to={brandTo} className={styles.brand}>
          <img
            src={logoSrc}
            alt=""
            className={styles["brand-logo"]}
            decoding="async"
            aria-hidden="true"
          />
          <span className={styles["brand-text"]}>SEHub</span>
        </Link>

        <form className={styles["search-wrap"]} onSubmit={handleSearchSubmit}>
          <div className={styles.search}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles["search-icon"]} />
            <input
              type="search"
              className={styles["search-input"]}
              placeholder="Tìm kiếm..."
              aria-label="Tìm kiếm"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </form>

        <div className={styles.actions}>
          <NotificationDropdown unreadCount={unreadCount} />

          <StreakDropdown />

          <div className={styles.profile}>
            <button type="button" className={styles["profile-trigger"]} aria-haspopup="menu">
              <span className={styles.avatar} aria-hidden="true">
                {initial}
              </span>
              <span className={withPremiumUsernameClass(styles.email, isPremium)}>
                {displayName}
              </span>
              <FontAwesomeIcon icon={faChevronDown} className={styles.chevron} />
            </button>

            <div className={styles["profile-menu"]} role="menu">
              {isAdmin ? (
                <Link to="/admin" className={styles["menu-item"]} role="menuitem">
                  <FontAwesomeIcon icon={faShieldHalved} />
                  Quản trị hệ thống
                </Link>
              ) : null}
              {isModerator ? (
                <Link to="/moderator/reports" className={styles["menu-item"]} role="menuitem">
                  <FontAwesomeIcon icon={faShieldHalved} />
                  Kiểm duyệt
                </Link>
              ) : null}
              <Link
                to={`/profile/${user?.username ?? "anhcoding12345"}`}
                className={styles["menu-item"]}
                role="menuitem"
              >
                <FontAwesomeIcon icon={faUser} />
                Hồ sơ cá nhân
              </Link>
              <button
                type="button"
                className={styles["menu-item"]}
                role="menuitem"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default MainHeader;
