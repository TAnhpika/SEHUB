import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCircleQuestion,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import { getSubjectNavLinks } from "@/utils/subjectPaths";

const SUBJECT_ICONS = {
  review: faCircleQuestion,
  practice: faBook,
  documents: faFileLines,
};

/**
 * @param {"community" | "home"} [scope="community"]
 */
function SubjectNavSection({ pathname, styles, scope = "community", onNavigate }) {
  const links = getSubjectNavLinks(scope).map((item) => ({
    ...item,
    icon: SUBJECT_ICONS[item.key],
  }));

  return (
    <>
      <div className={styles.divider} aria-hidden="true" />

      <div className={styles.section}>
        <p className={styles["section-title"]}>Môn học</p>
        <ul className={styles.list}>
          {links.map((item) => {
            const isActive =
              pathname === item.to || pathname.startsWith(`${item.to}/`);

            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`${styles["subject-link"]} ${isActive ? styles.active : ""}`}
                  onClick={onNavigate}
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
