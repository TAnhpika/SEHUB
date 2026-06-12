import { Link } from "react-router-dom";
import FollowButton from "@/features/social/FollowButton/FollowButton";
import styles from "./FriendResultCard.module.css";

function FriendResultCard({ user, onFollowChange }) {
  const displayName = user.displayName ?? user.username;

  return (
    <div className={styles.card}>
      <Link to={`/profile/${user.username}`} className={styles.link}>
        <span className={styles.avatar} aria-hidden="true">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className={styles["avatar-image"]} />
          ) : (
            user.initial ?? displayName.charAt(0).toUpperCase()
          )}
        </span>

        <div className={styles.info}>
          <p className={styles.username}>{displayName}</p>
          <p className={styles.level}>
            @{user.username} · Level:{" "}
            <span className={styles["level-value"]}>{user.level ?? "BRONZE"}</span>
          </p>
        </div>
      </Link>

      <FollowButton
        userId={user.userId}
        initialIsFollowing={user.isFollowing}
        className={styles.follow}
        onChange={(state) => onFollowChange?.(user.userId, state)}
      />
    </div>
  );
}

export default FriendResultCard;
