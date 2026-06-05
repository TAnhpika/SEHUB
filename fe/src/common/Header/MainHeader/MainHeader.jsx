import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faMagnifyingGlass,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import NotificationDropdown from "./NotificationDropdown";
import StreakDropdown from "./StreakDropdown";
import logoSrc from "@/img/logo.png";
import styles from "./MainHeader.module.css";

function MainHeader() {
  const navigate = useNavigate();
  const { user, logout, isPremium } = useAuth();

  const displayName = user?.displayName ?? "Anhpika";
  const initial = user?.initial ?? displayName.charAt(0).toUpperCase();
  const unreadCount = user?.unreadNotifications ?? 7;
  const streakCount = user?.streak ?? 7;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/home" className={styles.brand}>
          <img
            src={logoSrc}
            alt=""
            className={styles["brand-logo"]}
            decoding="async"
            aria-hidden="true"
          />
          <span className={styles["brand-text"]}>SEHub</span>
        </Link>

        <div className={styles["search-wrap"]}>
          <div className={styles.search}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles["search-icon"]} />
            <input
              type="search"
              className={styles["search-input"]}
              placeholder="Tìm kiếm..."
              aria-label="Tìm kiếm"
            />
          </div>
        </div>

        <div className={styles.actions}>
          <NotificationDropdown unreadCount={unreadCount} />

          <StreakDropdown streakCount={streakCount} />

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
