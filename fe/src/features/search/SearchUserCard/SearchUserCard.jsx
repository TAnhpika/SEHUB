import { Link } from "react-router-dom";
import FollowButton from "@/features/social/FollowButton/FollowButton";
import styles from "./SearchUserCard.module.css";

function SearchUserCard({ user, onFollowChange }) {
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
          <p className={styles.name}>{displayName}</p>
          <p className={styles.handle}>
            @{user.username}
            {user.level ? ` · ${user.level}` : ""}
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

export default SearchUserCard;
