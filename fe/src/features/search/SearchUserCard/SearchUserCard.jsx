import { Link } from "react-router-dom";
import styles from "./SearchUserCard.module.css";

function SearchUserCard({ user }) {
  const displayName = user.displayName ?? user.username;

  return (
    <Link to={`/profile/${user.username}`} className={styles.card}>
      <span className={styles.avatar} aria-hidden="true">
        {user.initial ?? displayName.charAt(0).toUpperCase()}
      </span>

      <div className={styles.info}>
        <p className={styles.name}>{displayName}</p>
        <p className={styles.handle}>@{user.username}</p>
      </div>

      <span className={styles.badge}>USER</span>
    </Link>
  );
}

export default SearchUserCard;
