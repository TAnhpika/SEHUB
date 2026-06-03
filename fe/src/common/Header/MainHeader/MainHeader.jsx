import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faChevronDown,
  faMagnifyingGlass,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import logoSrc from "@/img/logo.png";
import styles from "./MainHeader.module.css";

function MainHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isHome = pathname === "/home";
  const isCommunity = pathname.startsWith("/community");
  const isSupport = pathname.startsWith("/support");

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

        <div className={styles.search}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={styles["search-icon"]} />
          <input
            type="search"
            className={styles["search-input"]}
            placeholder="Tìm kiếm bài viết, môn học..."
            aria-label="Tìm kiếm"
          />
        </div>

        <nav className={styles.nav} aria-label="Điều hướng chính">
          <Link
            to="/home"
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
          <button type="button" className={styles["notify-btn"]} aria-label="Thông báo (3 chưa đọc)">
            <FontAwesomeIcon icon={faBell} />
            <span className={styles["notify-badge"]}>3</span>
          </button>

          <div className={styles.profile}>
            <span className={styles.avatar} aria-hidden="true">
              {user?.initial ?? "S"}
            </span>
            <div className={styles["profile-meta"]}>
              <span className={styles.username}>{user?.username ?? "student"}</span>
              <span className={styles.level}>{user?.level ?? "Bronze"}</span>
            </div>
            <FontAwesomeIcon icon={faChevronDown} className={styles["profile-chevron"]} />

            <div className={styles["profile-menu"]}>
              <button type="button" className={styles["menu-item"]}>
                <FontAwesomeIcon icon={faUser} />
                Hồ sơ cá nhân
              </button>
              <button type="button" className={styles["menu-item"]} onClick={handleLogout}>
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
