import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faComment,
  faGem,
  faMedal,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import styles from "./FriendProfileCard.module.css";

function FriendProfileCard({ profile }) {
  return (
    <aside className={styles.card}>
      <div className={styles.hero}>
        <span className={styles.badge} aria-hidden="true">
          <FontAwesomeIcon icon={faGem} />
        </span>
        <span className={styles.avatar} aria-hidden="true">
          {profile.initial}
        </span>
        <h1 className={styles.username}>{profile.username}</h1>
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
        <Button size="sm" className={styles["follow-btn"]}>
          <FontAwesomeIcon icon={faPlus} />
          Theo dõi
        </Button>
        <Button look="outline" size="sm" className={styles["message-btn"]}>
          <FontAwesomeIcon icon={faComment} />
          Nhắn tin
        </Button>
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
