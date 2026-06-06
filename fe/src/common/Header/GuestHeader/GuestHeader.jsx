import { Link, useLocation } from "react-router-dom";
import Button from "@/common/Button/Button";
import logoSrc from "@/img/logo.png";
import styles from "./GuestHeader.module.css";

function GuestHeader() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isCommunity = pathname.startsWith("/community");
  const isSupport = pathname.startsWith("/support");

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <img src={logoSrc} alt="" className={styles["brand-logo"]} decoding="async" aria-hidden="true" />
          <span className={styles["brand-text"]}>SEHub</span>
        </Link>

        <nav className={styles.nav} aria-label="Điều hướng chính">
          <Link
            to="/"
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

        <div className={styles.actions}>
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
        </div>
      </div>
    </header>
  );
}

export default GuestHeader;
