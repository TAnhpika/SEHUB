import ExamAttemptHistoryCard from "./ExamAttemptHistoryCard";
import LearningActivityEmpty from "./LearningActivityEmpty";
import styles from "./LearningActivitySection.module.css";

/**
 * @param {{ items: import("./learningActivityTypes").ExamAttemptHistoryItem[] }} props
 */
function ExamAttemptHistoryList({ items }) {
  if (items.length === 0) {
    return <LearningActivityEmpty tab="exams" />;
  }

  return (
    <ul className={styles.list} id="learning-panel-exams" role="tabpanel" aria-labelledby="learning-tab-exams">
      {items.map((item) => (
        <li key={item.attemptId}>
          <ExamAttemptHistoryCard item={item} />
        </li>
      ))}
    </ul>
  );
}

export default ExamAttemptHistoryList;
