import { Link } from "react-router-dom";
import UserAvatar from "@/common/UserAvatar/UserAvatar";
import FollowButton from "@/features/social/FollowButton/FollowButton";
import MessageUserButton from "@/features/social/MessageUserButton/MessageUserButton";
import styles from "./SearchUserCard.module.css";

function SearchUserCard({ user, onFollowChange }) {
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
          <p className={styles.name}>{displayName}</p>
          <p className={styles.handle}>
            @{user.username}
            {user.level ? ` · ${user.level}` : ""}
          </p>
        </div>
      </Link>

      <div className={styles.actions}>
        <FollowButton
          userId={user.userId}
          initialIsFollowing={user.isFollowing}
          className={styles.actionBtn}
          onChange={(state) => onFollowChange?.(user.userId, state)}
        />
        <MessageUserButton
          userId={user.userId}
          className={styles.actionBtn}
          label="Nhắn tin"
        />
      </div>
    </div>
  );
}

export default SearchUserCard;
