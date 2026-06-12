import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import FollowButton from "@/features/social/FollowButton/FollowButton";
import FriendButton from "@/features/social/FriendButton/FriendButton";
import MessageUserButton from "@/features/social/MessageUserButton/MessageUserButton";
import * as friendsApi from "@/api/friendsApi";
import styles from "./ProfileInteractionActions.module.css";

function ProfileInteractionActions({ profile, onFollowChange }) {
  const location = useLocation();
  const pendingRequestHint = location.state?.friendRequestId ?? null;

  const [friendStatus, setFriendStatus] = useState(() =>
    pendingRequestHint ? "PendingIncoming" : "None",
  );
  const [friendRequestId, setFriendRequestId] = useState(() => pendingRequestHint);

  useEffect(() => {
    let cancelled = false;

    async function fetchFriendStatus() {
      if (!profile?.userId) return;

      try {
        const data = await friendsApi.getFriendStatus(profile.userId);
        if (!cancelled) {
          setFriendStatus(data.status ?? "None");
          setFriendRequestId(data.requestId ?? null);
        }
      } catch {
        if (!cancelled) {
          setFriendStatus("None");
          setFriendRequestId(null);
        }
      }
    }

    fetchFriendStatus();

    return () => {
      cancelled = true;
    };
  }, [profile?.userId]);

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
      <FriendButton
        userId={profile.userId}
        initialStatus={friendStatus}
        initialRequestId={friendRequestId}
        className={styles.btn}
        onChange={({ status, requestId }) => {
          setFriendStatus(status);
          setFriendRequestId(requestId);
        }}
      />
      <MessageUserButton userId={profile.userId} className={styles.messageBtn} />
    </div>
  );
}

export default ProfileInteractionActions;
