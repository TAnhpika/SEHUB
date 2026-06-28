import FollowButton from "@/features/social/FollowButton/FollowButton";
import MessageUserButton from "@/features/social/MessageUserButton/MessageUserButton";
import UserReportButton from "@/features/reports/UserReportButton/UserReportButton";
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
      <UserReportButton
        userId={profile.userId}
        username={profile.username}
        source="profile"
        variant="button"
        className={styles.reportBtn}
        label="Báo cáo"
      />
    </div>
  );
}

export default ProfileInteractionActions;
