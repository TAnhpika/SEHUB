import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCircleQuestion,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";

export const SUBJECT_LINKS = [
  { to: "/community/final-exam", label: "Câu hỏi ôn tập", icon: faCircleQuestion },
  {
    to: "/community/pratical-exam",
    label: "Câu hỏi thực hành",
    icon: faBook,
  },
  { to: "/community/documents", label: "Tài liệu", icon: faFileLines },
];

function SubjectNavSection({ pathname, styles }) {
  return (
    <>
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
    </>
  );
}

export default SubjectNavSection;
