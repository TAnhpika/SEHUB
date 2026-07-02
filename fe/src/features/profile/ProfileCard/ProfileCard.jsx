import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faCalendarDays,
  faClock,
  faComment,
  faFileLines,
  faMedal,
} from "@fortawesome/free-solid-svg-icons";
import ProfileCardMenu from "@/features/profile/ProfileCard/ProfileCardMenu";
import ProfileInteractionActions from "@/features/social/ProfileInteractionActions/ProfileInteractionActions";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import { getRankBadgeStyleClass, getRankDisplay } from "@/utils/rankDisplay";
import rankStyles from "@/utils/rankDisplay.module.css";
import styles from "./ProfileCard.module.css";

function ProfileCard({
  profile,
  isOwner = false,
  isPremiumUsername = false,
  onFollowChange,
}) {
  const rank = getRankDisplay(profile.level);

  return (
    <aside className={styles.card}>
      {isOwner && <ProfileCardMenu username={profile.username} />}

      <div className={styles.hero}>
        <span
          className={`${styles.badge} ${getRankBadgeStyleClass(profile.level, rankStyles)}`}
          aria-hidden="true"
        >
          <FontAwesomeIcon icon={rank.icon} />
        </span>
        <span className={styles.avatar} aria-hidden={Boolean(profile.avatarUrl)}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={`Avatar ${profile.displayName ?? profile.username}`}
              className={styles["avatar-image"]}
            />
          ) : (
            profile.initial
          )}
        </span>
        <h1
          className={withPremiumUsernameClass(styles.username, isPremiumUsername)}
        >
          {profile.displayName ?? profile.username}
        </h1>
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

      {!isOwner && profile.userId && onFollowChange ? (
        <ProfileInteractionActions profile={profile} onFollowChange={onFollowChange} />
      ) : null}

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
          <div className={styles["stat-item"]}>
            <FontAwesomeIcon icon={faComment} className={styles["stat-icon"]} />
            <span className={styles["stat-value"]}>{profile.stats.comments}</span>
            <span className={styles["stat-label"]}>Bình luận</span>
          </div>
          <div className={styles["stat-item"]}>
            <FontAwesomeIcon icon={faFileLines} className={styles["stat-icon"]} />
            <span className={styles["stat-value"]}>{profile.stats.posts}</span>
            <span className={styles["stat-label"]}>Bài viết</span>
          </div>
        </div>
      </div>

      <ul className={styles.meta}>
        <li>
          <FontAwesomeIcon icon={faCalendarDays} />
          Tham gia {profile.joinedAgo}
        </li>
        <li>
          <FontAwesomeIcon icon={faClock} />
          Cập nhật {profile.updatedAgo}
        </li>
      </ul>
    </aside>
  );
}

export default ProfileCard;
