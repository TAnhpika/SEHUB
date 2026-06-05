import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import styles from "./adminPage.module.css";

/**
 * @param {{ to: string, label: string }} props
 */
function AdminBackLink({ to, label }) {
  return (
    <Link
      to={to}
      className={styles.backLink}
      aria-label={`Quay lại ${label}`}
      title={`Quay lại ${label}`}
    >
      <FontAwesomeIcon icon={faChevronLeft} className={styles.backIcon} aria-hidden />
      Quay lại
    </Link>
  );
}

export default AdminBackLink;
