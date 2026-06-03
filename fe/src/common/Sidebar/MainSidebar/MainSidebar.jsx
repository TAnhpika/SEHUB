import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCircleQuestion,
  faFileLines,
  faHome,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./MainSidebar.module.css";

const MAIN_LINKS = [
  { to: "/home", label: "Trang chủ", icon: faHome, end: true },
  { to: "/home/friends", label: "Tìm kiếm bạn bè", icon: faUserGroup },
];

const SUBJECT_LINKS = [
  { to: "/community/final-exam", label: "Câu hỏi ôn tập", icon: faCircleQuestion },
  { to: "/community/pratical-exam", label: "Câu hỏi thực hành", icon: faBook },
  { to: "/community/documents", label: "Tài liệu", icon: faFileLines },
];

function MainSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className={styles.sidebar} aria-label="Điều hướng chính">
      <div className={styles.panel}>
        <nav className={styles.nav}>
          {MAIN_LINKS.map((item) => {
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
              const isActive =
                pathname === item.to || pathname.startsWith(`${item.to}/`);

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
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default MainSidebar;
