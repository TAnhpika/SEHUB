import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCircleQuestion,
  faFileLines,
  faHome,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./FeedSidebar.module.css";

const MAIN_LINKS = [
  { to: "/community", label: "Trang chủ", icon: faHome, end: true },
  { label: "Tìm kiếm bạn bè", icon: faUserGroup, requiresAuth: true },
];

const SUBJECT_LINKS = [
  { to: "/community/final-exam", label: "Câu hỏi ôn tập", icon: faCircleQuestion },
  { to: "/community/pratical-exam", label: "Câu hỏi thực hành", icon: faBook },
  { to: "/community/documents", label: "Tài liệu", icon: faFileLines },
];

function FeedSidebar() {
  const { pathname } = useLocation();
  const { requireAuth } = useRequireAuth();

  function handleFindFriends() {
    requireAuth("Vui lòng đăng nhập để tìm kiếm bạn bè.");
  }

  return (
    <aside className={styles.sidebar} aria-label="Điều hướng cộng đồng">
      <div className={styles.panel}>
        <nav className={styles.nav}>
          {MAIN_LINKS.map((item) => {
            if (item.requiresAuth) {
              return (
                <button
                  key={item.label}
                  type="button"
                  className={styles.link}
                  onClick={handleFindFriends}
                >
                  <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                  {item.label}
                </button>
              );
            }

            const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);

            return (
              <Link
                key={item.label}
                to={item.to}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
              >
                <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.section}>
          <p className={styles["section-title"]}>Môn học</p>
          <ul className={styles.list}>
            {SUBJECT_LINKS.map((item) => {
              const isActive = item.to
                ? pathname === item.to || pathname.startsWith(`${item.to}/`)
                : false;

              if (item.to) {
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className={`${styles["subject-link"]} ${isActive ? styles.active : ""}`}
                    >
                      <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <button type="button" className={styles["subject-link"]}>
                    <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default FeedSidebar;
