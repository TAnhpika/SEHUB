import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import styles from "./ModeratorBreadcrumb.module.css";

/**
 * @param {{ crumbs: Array<{ label: string, to?: string }> }} props
 */
function ModeratorBreadcrumb({ crumbs = [] }) {
  if (crumbs.length === 0) return null;

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

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
