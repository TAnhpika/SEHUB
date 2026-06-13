import FollowButton from "@/features/social/FollowButton/FollowButton";
import MessageUserButton from "@/features/social/MessageUserButton/MessageUserButton";
import styles from "./ProfileInteractionActions.module.css";

function ProfileInteractionActions({ profile, onFollowChange }) {
  if (!profile?.userId) {
    return null;
  }

  return (
    <div className={styles.actions}>
      <FollowButton
        userId={profile.userId}
        initialIsFollowing={profile.isFollowing}
        className={styles.btn}
        onChange={onFollowChange}
      />
      <MessageUserButton userId={profile.userId} className={styles.messageBtn} />
    </div>
  );
}

export default ProfileInteractionActions;
