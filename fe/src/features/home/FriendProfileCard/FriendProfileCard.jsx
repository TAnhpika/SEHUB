import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faGem,
  faMedal,
} from "@fortawesome/free-solid-svg-icons";
import FollowButton from "@/features/social/FollowButton/FollowButton";
import FriendButton from "@/features/social/FriendButton/FriendButton";
import MessageUserButton from "@/features/social/MessageUserButton/MessageUserButton";
import * as friendsApi from "@/api/friendsApi";
import styles from "./FriendProfileCard.module.css";

function FriendProfileCard({ profile, onFollowChange }) {
  const [friendStatus, setFriendStatus] = useState("None");
  const [friendRequestId, setFriendRequestId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFriendStatus() {
      if (!profile.userId) return;

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
  }, [profile.userId]);

  return (
    <aside className={styles.card}>
      <div className={styles.hero}>
        <span className={styles.badge} aria-hidden="true">
          <FontAwesomeIcon icon={faGem} />
        </span>
        <span className={styles.avatar} aria-hidden="true">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className={styles["avatar-image"]} />
          ) : (
            profile.initial
          )}
        </span>
        <h1 className={styles.username}>{profile.displayName ?? profile.username}</h1>
      </div>

      <div className={styles.social}>
        <div className={styles["social-item"]}>
          <span className={styles["social-value"]}>{profile.followers}</span>
          <span className={styles["social-label"]}>Người theo dõi</span>
        </div>
        <span className={styles.divider} aria-hidden="true" />
        <div className={styles["social-item"]}>
          <span className={styles["social-value"]}>{profile.following}</span>
          <span className={styles["social-label"]}>Đang theo dõi</span>
        </div>
      </div>

      <div className={styles.actions}>
        <FollowButton
          userId={profile.userId}
          initialIsFollowing={profile.isFollowing}
          className={styles["follow-btn"]}
          onChange={onFollowChange}
        />
        <FriendButton
          userId={profile.userId}
          initialStatus={friendStatus}
          initialRequestId={friendRequestId}
          className={styles["follow-btn"]}
          onChange={({ status, requestId }) => {
            setFriendStatus(status);
            setFriendRequestId(requestId);
          }}
        />
        <MessageUserButton userId={profile.userId} className={styles["message-btn"]} />
      </div>

      <div className={styles.progress}>
        <div className={styles["progress-head"]}>
          <span className={styles["progress-title"]}>Đến {profile.nextLevel}</span>
          <span className={styles["progress-meta"]}>{profile.pointsToNext} điểm nữa</span>
        </div>
        <div className={styles["progress-bar"]}>
          <span
            className={styles["progress-fill"]}
            style={{ width: `${profile.levelProgress}%` }}
          />
        </div>
      </div>

      <div className={styles.stats}>
        <h2 className={styles["stats-title"]}>Thống kê</h2>
        <div className={styles["stats-grid"]}>
          <div className={styles["stat-item"]}>
            <FontAwesomeIcon icon={faBullseye} className={styles["stat-icon"]} />
            <span className={styles["stat-value"]}>{profile.stats.points}</span>
            <span className={styles["stat-label"]}>Điểm</span>
          </div>
          <div className={styles["stat-item"]}>
            <FontAwesomeIcon icon={faMedal} className={styles["stat-icon"]} />
            <span className={styles["stat-value"]}>{profile.stats.exams}</span>
            <span className={styles["stat-label"]}>Bài thi</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default FriendProfileCard;
