import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faGear,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./ModeratorHeader.module.css";

const TOP_LINKS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Báo cáo", to: "/moderator/reports" },
  { label: "Thêm đề TH", to: "/moderator/practice-exams/add" },
];

function ModeratorHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.search}>
        <FontAwesomeIcon icon={faMagnifyingGlass} className={styles["search-icon"]} />
        <input
          type="search"
          className={styles["search-input"]}
          placeholder="Tìm kiếm..."
          aria-label="Tìm kiếm"
        />
      </div>

      <nav className={styles.nav} aria-label="Liên kết nhanh">
        {TOP_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className={styles["nav-link"]}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} aria-label="Thông báo">
          <FontAwesomeIcon icon={faBell} />
          <span className={styles.badge} aria-hidden />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Cài đặt">
          <FontAwesomeIcon icon={faGear} />
        </button>
      </div>
    </header>
  );
}

export default ModeratorHeader;
