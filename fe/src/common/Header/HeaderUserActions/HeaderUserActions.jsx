import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import WorkspaceSwitcher from "@/common/WorkspaceSwitcher/WorkspaceSwitcher";
import { useAuth } from "@/context";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import NotificationDropdown from "@/common/Header/MainHeader/NotificationDropdown";
import StreakDropdown from "@/common/Header/MainHeader/StreakDropdown";
import ThemeSwitcher from "@/common/ThemeSwitcher/ThemeSwitcher";
import { useHoverDropdown } from "@/hooks/useHoverDropdown";
import styles from "@/common/Header/MainHeader/MainHeader.module.css";

function HeaderUserActions() {
  const navigate = useNavigate();
  const { user, logout, isPremium } = useAuth();
  const { open: profileOpen, rootProps: profileHoverProps, handleTriggerClick, hide: closeProfileMenu } =
    useHoverDropdown();

  const displayName = user?.displayName ?? "Anhpika";
  const initial = user?.initial ?? displayName.charAt(0).toUpperCase();

  function handleProfileClick() {
    closeProfileMenu();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  function handleLogout() {
    handleProfileClick();
    logout();
    navigate("/");
  }

  return (
    <>
      <NotificationDropdown />
      <StreakDropdown />
      <div
        className={`${styles.profile} ${profileOpen ? styles.profileOpen : ""}`.trim()}
        {...profileHoverProps}
      >
        <button
          type="button"
          className={styles["profile-trigger"]}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          onClick={handleTriggerClick}
        >
          <span className={styles.avatar} aria-hidden="true">
            {initial}
          </span>
          <span className={withPremiumUsernameClass(styles.email, isPremium)}>
            {displayName}
          </span>
          <FontAwesomeIcon icon={faChevronDown} className={styles.chevron} />
        </button>

        <div className={styles["profile-menu"]} role="menu">
          <ThemeSwitcher variant="menu" />
          <div className={styles["menu-divider"]} role="separator" />
          <WorkspaceSwitcher
            variant="menu-compact"
            showHeading
            onNavigate={handleProfileClick}
          />
          <Link
            to={`/profile/${user?.username ?? "anhcoding12345"}`}
            className={styles["menu-item"]}
            role="menuitem"
            onClick={handleProfileClick}
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
    </>
  );
}

export default HeaderUserActions;
