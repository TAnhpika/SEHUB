import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import styles from "./ModeratorBreadcrumb.module.css";

function ModeratorBreadcrumb({ current }) {
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      <Link to="/home">Trang chủ</Link>
      <FontAwesomeIcon icon={faChevronRight} className={styles.chevron} />
      <span>Đóng góp</span>
      <FontAwesomeIcon icon={faChevronRight} className={styles.chevron} />
      <span className={styles.current}>{current}</span>
    </nav>
  );
}

export default ModeratorBreadcrumb;
