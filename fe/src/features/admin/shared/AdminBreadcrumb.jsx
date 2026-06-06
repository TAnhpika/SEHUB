import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import styles from "./adminPage.module.css";

/**
 * @param {{ items: { label: string, to?: string }[] }} props
 */
function AdminBreadcrumb({ items }) {
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className={styles.breadcrumbItem}>
            {index > 0 ? (
              <FontAwesomeIcon icon={faChevronRight} className={styles.breadcrumbSep} />
            ) : null}
            {item.to && !isLast ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span className={isLast ? styles.breadcrumbCurrent : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default AdminBreadcrumb;
