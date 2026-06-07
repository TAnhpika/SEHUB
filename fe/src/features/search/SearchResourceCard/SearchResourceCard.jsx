import { Link } from "react-router-dom";
import styles from "./SearchResourceCard.module.css";

function SearchResourceCard({ item }) {
  return (
    <Link to={item.detailPath} className={styles.card}>
      <div className={styles.info}>
        <p className={styles.title}>{item.title}</p>
        <p className={styles.subtitle}>{item.subtitle ?? item.courseCode}</p>
      </div>
      <span className={styles.badge}>{item.typeLabel ?? item.type}</span>
    </Link>
  );
}

export default SearchResourceCard;
