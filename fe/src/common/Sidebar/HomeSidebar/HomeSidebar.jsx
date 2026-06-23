import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import FtesPromoPanel from "@/common/Sidebar/FtesPromoPanel/FtesPromoPanel";
import FeaturedPostsPanel from "@/common/Sidebar/FeaturedPostsPanel/FeaturedPostsPanel";
import styles from "./HomeSidebar.module.css";

function HomeSidebar() {
  const { user } = useAuth();

  return (
    <aside className={styles.sidebar} aria-label="Thống kê & bài nổi bật">
      <div className={`${styles.panel} ${styles.streak}`}>
        <div className={styles["streak-header"]}>
          <span className={styles["streak-icon"]} aria-hidden="true">
            <FontAwesomeIcon icon={faFire} />
          </span>
          <div>
            <p className={styles["streak-title"]}>Streak {user?.streak ?? 0} ngày</p>
            <p className={styles["streak-desc"]}>+20 điểm nếu duy trì 7 ngày</p>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles["stat-value"]}>{user?.points ?? 240}</span>
            <span className={styles["stat-label"]}>Điểm</span>
          </div>
          <div className={styles.stat}>
            <span className={styles["stat-value"]}>{user?.level ?? "Silver"}</span>
            <span className={styles["stat-label"]}>Cấp độ</span>
          </div>
        </div>

        <div className={styles.progress}>
          <div className={styles["progress-bar"]}>
            <span
              className={styles["progress-fill"]}
              style={{ width: `${user?.levelProgress ?? 68}%` }}
            />
          </div>
          <p className={styles["progress-text"]}>
            <FontAwesomeIcon icon={faTrophy} />
            Còn {user?.pointsToNext ?? 60} điểm lên Gold
          </p>
        </div>
      </div>

      <FtesPromoPanel className={`${styles.panel} ${styles.ftes}`} />

      <FeaturedPostsPanel className={`${styles.panel} ${styles.featured}`} />
    </aside>
  );
}

export default HomeSidebar;
