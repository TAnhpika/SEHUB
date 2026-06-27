import { Link } from "react-router-dom";
import UserAvatar from "@/common/UserAvatar/UserAvatar";
import FollowButton from "@/features/social/FollowButton/FollowButton";
import styles from "./FriendResultCard.module.css";

function FriendResultCard({ user, onFollowChange }) {
  const displayName = user.displayName ?? user.username;

  return (
    <div className={styles.card}>
      <Link to={`/profile/${user.username}`} className={styles.link}>
        <UserAvatar
          src={user.avatarUrl}
          initial={user.initial ?? displayName}
          className={styles.avatar}
        />

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
