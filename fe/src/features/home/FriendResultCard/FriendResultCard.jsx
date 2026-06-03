import { Link } from "react-router-dom";
import styles from "./FriendResultCard.module.css";

function FriendResultCard({ user }) {
  return (
    <Link to={`/home/friends/${user.username}`} className={styles.card}>
      <span className={styles.avatar} aria-hidden="true">
        {user.initial}
      </span>

      <div className={styles.info}>
        <p className={styles.username}>{user.username}</p>
        <p className={styles.level}>
          Level: <span className={styles["level-value"]}>{user.level}</span>
        </p>
      </div>
    </Link>
  );
}

export default FriendResultCard;
