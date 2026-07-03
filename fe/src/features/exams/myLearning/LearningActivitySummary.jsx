import styles from "./LearningActivitySection.module.css";

/**
 * @param {{ examCount: number; practiceCount: number }} props
 */
function LearningActivitySummary({ examCount, practiceCount }) {
  return (
    <div className={styles.summary}>
      <div className={styles.summaryItem}>
        <span className={styles.summaryValue}>{examCount}</span>
        <span className={styles.summaryLabel}>Đề CK đã làm</span>
      </div>
      <div className={styles.summaryItem}>
        <span className={styles.summaryValue}>{practiceCount}</span>
        <span className={styles.summaryLabel}>TH đã nộp</span>
      </div>
    </div>
  );
}

export default LearningActivitySummary;
