import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import FtesPromoPanel from "@/common/Sidebar/FtesPromoPanel/FtesPromoPanel";
import FeaturedPostsPanel from "@/common/Sidebar/FeaturedPostsPanel/FeaturedPostsPanel";
import { deriveNextLevelLabel, getRankDisplay, getRankIconClass } from "@/utils/rankDisplay";
import rankStyles from "@/utils/rankDisplay.module.css";
import styles from "./HomeSidebar.module.css";

const PLACEHOLDER = "—";

function getSidebarGamificationView(user, isBootstrapping) {
  if (isBootstrapping) {
    return {
      streakLabel: PLACEHOLDER,
      pointsLabel: PLACEHOLDER,
      levelLabel: PLACEHOLDER,
      levelRank: null,
      progressRank: null,
      levelProgress: 0,
      progressText: PLACEHOLDER,
      showTrophy: false,
    };
  }

  const nextLevel = user?.nextLevel ?? deriveNextLevelLabel(user?.level);
  const progressText = nextLevel
    ? `Còn ${user?.pointsToNext ?? 0} điểm lên ${nextLevel}`
    : "Đã đạt cấp cao nhất";

  return {
    streakLabel: user?.streak ?? 0,
    pointsLabel: user?.points ?? 0,
    levelLabel: user?.level ?? PLACEHOLDER,
    levelRank: getRankDisplay(user?.level),
    progressNextLevel: nextLevel,
    progressRank: nextLevel ? getRankDisplay(nextLevel) : null,
    levelProgress: nextLevel ? (user?.levelProgress ?? 0) : 100,
    progressText,
    showTrophy: !nextLevel,
  };
}

function HomeSidebar() {
  const { user, isBootstrapping } = useAuth();
  const gamification = getSidebarGamificationView(user, isBootstrapping);

  return (
    <aside className={styles.sidebar} aria-label="Thống kê & bài nổi bật">
      <div className={`${styles.panel} ${styles.streak}`}>
        <div className={styles["streak-header"]}>
          <span className={styles["streak-icon"]} aria-hidden="true">
            <FontAwesomeIcon icon={faFire} />
          </span>
          <div>
            <p className={styles["streak-title"]}>Streak {gamification.streakLabel} ngày</p>
            <p className={styles["streak-desc"]}>+20 điểm nếu duy trì 7 ngày</p>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles["stat-value"]}>{gamification.pointsLabel}</span>
            <span className={styles["stat-label"]}>Điểm</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles["stat-value"]} ${styles["stat-value-level"]}`}>
              {gamification.levelRank ? (
                <FontAwesomeIcon
                  icon={gamification.levelRank.icon}
                  className={getRankIconClass(user?.level, rankStyles)}
                  aria-hidden="true"
                />
              ) : null}
              {gamification.levelLabel}
            </span>
            <span className={styles["stat-label"]}>Cấp độ</span>
          </div>
        </div>

        <div className={styles.progress}>
          <div className={styles["progress-bar"]}>
            <span
              className={styles["progress-fill"]}
              style={{ width: `${gamification.levelProgress}%` }}
            />
          </div>
          <p className={styles["progress-text"]}>
            {gamification.showTrophy ? (
              <FontAwesomeIcon icon={faTrophy} className={styles["progress-trophy"]} />
            ) : (
              <FontAwesomeIcon
                icon={gamification.progressRank.icon}
                className={`${styles["progress-rank-icon"]} ${getRankIconClass(gamification.progressNextLevel, rankStyles)}`}
                aria-hidden="true"
              />
            )}
            {gamification.progressText}
          </p>
        </div>
      </div>

      <FeaturedPostsPanel
        variant="home"
        className={`${styles.panel} ${styles.featured}`}
      />

      <FtesPromoPanel className={styles.promo} />
    </aside>
  );
}

export default HomeSidebar;
