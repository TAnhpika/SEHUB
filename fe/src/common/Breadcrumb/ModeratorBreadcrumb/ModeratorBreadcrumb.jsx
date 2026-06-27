import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import styles from "./ModeratorBreadcrumb.module.css";

/**
 * @param {{ crumbs?: Array<{ label: string, to?: string }>, current?: string }} props
 * Pass `current` for the legacy final-exam wizard trail, or `crumbs` for custom segments.
 */
function ModeratorBreadcrumb({ crumbs = [], current }) {
  const resolvedCrumbs = current
    ? [
        { label: "Trang chủ", to: "/home" },
        { label: "Đóng góp" },
        { label: current },
      ]
    : crumbs;

  if (resolvedCrumbs.length === 0) return null;

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {resolvedCrumbs.map((crumb, index) => {
        const isLast = index === resolvedCrumbs.length - 1;

        return (
          <span key={`${crumb.label}-${index}`} className={styles.segment}>
            {index > 0 ? (
              <FontAwesomeIcon icon={faChevronRight} className={styles.chevron} aria-hidden />
            ) : null}
            {crumb.to && !isLast ? (
              <Link to={crumb.to} className={styles.link}>
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? styles.current : styles.text}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default ModeratorBreadcrumb;
