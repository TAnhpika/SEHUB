import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import HeaderUserActions from "@/common/Header/HeaderUserActions/HeaderUserActions";
import ThemeSwitcher from "@/common/ThemeSwitcher/ThemeSwitcher";
import { useMainShellOptional } from "@/common/context/MainShellContext";
import { useAuth } from "@/context";
import { getRoleHomePath } from "@/utils/roleHelpers";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import logoSrc from "@/img/logo.png";
import mainHeaderStyles from "@/common/Header/MainHeader/MainHeader.module.css";
import styles from "./GuestHeader.module.css";

function GuestHeader() {
  const { pathname } = useLocation();
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const mainShell = useMainShellOptional();
  const isCommunityShell = mainShell?.layout === "community";
  const [menuState, setMenuState] = useState({ open: false, atPath: pathname });
  const guestMenuOpen = menuState.open && menuState.atPath === pathname;
  const homePath = isAuthenticated ? getRoleHomePath(user) : "/";
  const isHome = isAuthenticated ? pathname === homePath : pathname === "/";
  const isCommunity = pathname.startsWith("/community");
  const isSupport = pathname.startsWith("/support");

  useLockBodyScroll(!isCommunityShell && guestMenuOpen);

  function setGuestMenuOpen(next) {
    setMenuState((prev) => {
      const wasOpen = prev.open && prev.atPath === pathname;
      const open = typeof next === "function" ? next(wasOpen) : next;
      return { open, atPath: pathname };
    });
  }

  const closeGuestMenu = useCallback(() => {
    setMenuState({ open: false, atPath: pathname });
  }, [pathname]);

  useEffect(() => {
    if (!guestMenuOpen || isCommunityShell) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeGuestMenu();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [guestMenuOpen, isCommunityShell, closeGuestMenu]);

  function handleGuestNavClick() {
    closeGuestMenu();
  }

  const navLinks = (
    <>
      <Link
        to={homePath}
        className={`${styles["drawer-link"]} ${isHome ? styles["drawer-link-active"] : ""}`}
        onClick={handleGuestNavClick}
      >
        Trang chủ
      </Link>
      <Link
        to="/community"
        className={`${styles["drawer-link"]} ${isCommunity ? styles["drawer-link-active"] : ""}`}
        onClick={handleGuestNavClick}
      >
        Cộng đồng
      </Link>
      <Link
        to="/support"
        className={`${styles["drawer-link"]} ${isSupport ? styles["drawer-link-active"] : ""}`}
        onClick={handleGuestNavClick}
      >
        Hỗ trợ
      </Link>
    </>
  );

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {isCommunityShell ? (
          <button
            type="button"
            className={mainHeaderStyles.menuBtn}
            aria-label={mainShell.sidebarOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            aria-expanded={mainShell.sidebarOpen}
            onClick={() => {
              if (mainShell.sidebarOpen) {
                mainShell.closeSidebar();
                return;
              }
              mainShell.setSidebarOpen(true);
            }}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        ) : (
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={guestMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            aria-expanded={guestMenuOpen}
            onClick={() => setGuestMenuOpen((open) => !open)}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        )}

        <Link to={homePath} className={styles.brand}>
          <img src={logoSrc} alt="" className={styles["brand-logo"]} decoding="async" aria-hidden="true" />
          <span className={styles["brand-text"]}>SEHub</span>
        </Link>

        <nav className={styles.nav} aria-label="Điều hướng chính">
          <Link
            to={homePath}
            className={`${styles["nav-link"]} ${isHome ? styles["nav-active"] : ""}`}
          >
            Trang chủ
          </Link>
          <Link
            to="/community"
            className={`${styles["nav-link"]} ${isCommunity ? styles["nav-active"] : ""}`}
          >
            Cộng đồng
          </Link>
          <Link
            to="/support"
            className={`${styles["nav-link"]} ${isSupport ? styles["nav-active"] : ""}`}
          >
            Hỗ trợ
          </Link>
        </nav>

        <div className={`${styles.actions} ${mainHeaderStyles.actions}`}>
          {isBootstrapping ? null : isAuthenticated ? (
            <HeaderUserActions />
          ) : (
            <>
              <ThemeSwitcher variant="compact" />
              <Link
                to="/login"
                className={styles["login-link"]}
                state={{ from: pathname }}
              >
                Đăng nhập
              </Link>
              <Button to="/register" size="sm" className={styles["signup-btn"]}>
                Đăng ký
              </Button>
            </>
          )}
        </div>
      </div>

      {!isCommunityShell && guestMenuOpen
        ? createPortal(
            <button
              type="button"
              className="shell-drawer-overlay"
              aria-label="Đóng menu"
              onClick={closeGuestMenu}
            />,
            document.body,
          )
        : null}

      {!isCommunityShell ? (
        <nav
          className={`${styles.drawer} ${guestMenuOpen ? styles.drawerOpen : ""}`}
          aria-label="Menu điều hướng di động"
          aria-hidden={!guestMenuOpen}
          data-scroll-lock-scrollable
        >
          <div className={styles["drawer-panel"]}>
            <div className={styles["drawer-nav"]}>{navLinks}</div>
            <div className={styles["drawer-divider"]} aria-hidden="true" />
            <div className={styles["drawer-actions"]}>
              {isBootstrapping ? null : isAuthenticated ? (
                <HeaderUserActions />
              ) : (
                <>
                  <ThemeSwitcher variant="compact" />
                  <Link
                    to="/login"
                    className={styles["drawer-login"]}
                    state={{ from: pathname }}
                    onClick={handleGuestNavClick}
                  >
                    Đăng nhập
                  </Link>
                  <Button
                    to="/register"
                    size="sm"
                    className={styles["drawer-signup"]}
                  >
                    Đăng ký
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

export default GuestHeader;
