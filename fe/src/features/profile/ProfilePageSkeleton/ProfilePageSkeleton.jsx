import pageStyles from "@/features/profile/ProfilePage/ProfilePage.module.css";
import styles from "./ProfilePageSkeleton.module.css";

function Shimmer({ className }) {
  return <span className={`${styles.skeleton} ${className ?? ""}`} aria-hidden="true" />;
}

function ProfilePageSkeleton({ showIntro = false }) {
  return (
    <div className={pageStyles.page} aria-busy="true" aria-label="Đang tải profile">
      <div className={pageStyles.sidebar}>
        <div className={styles.card}>
          <Shimmer className={styles.avatar} />
          <Shimmer className={styles.name} />
          <div className={styles.socialRow}>
            <Shimmer className={styles.social} />
            <Shimmer className={styles.social} />
          </div>
          <Shimmer className={styles.progress} />
          <div className={styles.statsGrid}>
            <Shimmer className={styles.stat} />
            <Shimmer className={styles.stat} />
            <Shimmer className={styles.stat} />
            <Shimmer className={styles.stat} />
          </div>
        </div>
      </div>

      <div className={pageStyles.main}>
        {showIntro ? <Shimmer className={styles.intro} /> : null}
        <Shimmer className={styles.panel} />
        <Shimmer className={styles.panelTall} />
        <Shimmer className={styles.panel} />
      </div>
    </div>
  );
}

export default ProfilePageSkeleton;
