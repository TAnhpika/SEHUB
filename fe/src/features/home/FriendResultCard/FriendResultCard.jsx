import styles from "./FriendResultCard.module.css";

function FriendResultCard({ user }) {
  return (
    <article className={styles.card}>
      <span className={styles.avatar} aria-hidden="true">
        {user.initial}
      </span>

      <div className={styles.info}>
        <p className={styles.username}>{user.username}</p>
        <p className={styles.level}>
          Level: <span className={styles["level-value"]}>{user.level}</span>
        </p>
      </div>
    </article>
  );
}

export default FriendResultCard;
