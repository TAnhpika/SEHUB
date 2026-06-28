import Shimmer from "@/common/Skeleton/Shimmer";
import styles from "./ExamDetailSkeleton.module.css";

function InfoItemSkeleton() {
  return (
    <div>
      <Shimmer className={styles["info-label"]} />
      <Shimmer className={styles["info-value"]} />
    </div>
  );
}

function ExamDetailSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Đang tải đề thi">
      <Shimmer className={styles.back} />

      <div className={styles["info-card"]}>
        <Shimmer className={styles["info-title"]} />
        <div className={styles["info-grid"]}>
          {Array.from({ length: 4 }, (_, index) => (
            <InfoItemSkeleton key={index} />
          ))}
        </div>
      </div>

      <div className={styles["exam-panel"]}>
        <div className={styles["panel-header"]}>
          <div>
            <Shimmer className={styles["exam-code"]} />
            <Shimmer className={styles["panel-subtitle"]} />
          </div>
          <Shimmer className={styles["start-btn"]} />
        </div>

        <div className={styles.workspace}>
          <div className={styles["question-card"]}>
            <Shimmer className={styles["question-label"]} />
            <Shimmer className={styles["question-text"]} />
            <Shimmer className={styles["question-text-short"]} />
            <div className={styles.options}>
              {Array.from({ length: 4 }, (_, index) => (
                <Shimmer key={index} className={styles.option} />
              ))}
            </div>
          </div>

          <div className={styles.sidebar}>
            <Shimmer className={styles["sidebar-card"]} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamDetailSkeleton;
