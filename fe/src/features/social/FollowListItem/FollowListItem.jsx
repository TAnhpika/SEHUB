import { Link } from "react-router-dom";
import UserAvatar from "@/common/UserAvatar/UserAvatar";
import FollowButton from "@/features/social/FollowButton/FollowButton";
import styles from "./FollowListItem.module.css";

function FollowListItem({
  user,
  currentUserId,
  compact = false,
  onFollowChange,
  onNavigate,
}) {
  const showFollowButton = Boolean(
    user?.userId && currentUserId && user.userId !== currentUserId,
  );

  function handleNavigate() {
    onNavigate?.();
  }

  return (
    <div className={`${styles.row} ${compact ? styles.compact : ""}`}>
      <Link
        to={`/profile/${user.username}`}
        className={styles.profileLink}
        onClick={handleNavigate}
      >
        <UserAvatar
          src={user.avatarUrl}
          initial={user.displayName ?? user.username}
          alt={user.displayName ?? user.username}
          size="sm"
          className={styles.avatar}
        />
        <span className={styles.meta}>
          <span className={styles.name}>{user.displayName ?? user.username}</span>
          <span className={styles.username}>@{user.username}</span>
        </span>
      </Link>

      {showFollowButton ? (
        <FollowButton
          userId={user.userId}
          initialIsFollowing={user.isFollowing}
          size="sm"
          className={styles.action}
          onChange={(state) => onFollowChange?.(user.userId, state)}
        />
      ) : null}
    </div>
  );
}

export default FollowListItem;
