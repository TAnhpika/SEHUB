import { Link, useLocation } from "react-router-dom";
import Button from "@/common/Button/Button";
import HeaderUserActions from "@/common/Header/HeaderUserActions/HeaderUserActions";
import { useAuth } from "@/context";
import logoSrc from "@/img/logo.png";
import mainHeaderStyles from "@/common/Header/MainHeader/MainHeader.module.css";
import styles from "./GuestHeader.module.css";

function GuestHeader() {
  const { pathname } = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const homePath = isAuthenticated ? "/home" : "/";
  const isHome = isAuthenticated ? pathname.startsWith("/home") : pathname === "/";
  const isCommunity = isAuthenticated
    ? pathname.startsWith("/home")
    : pathname.startsWith("/community");
  const isSupport = pathname.startsWith("/support");

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
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
            to={isAuthenticated ? "/home" : "/community"}
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
    </header>
  );
}

export default GuestHeader;
