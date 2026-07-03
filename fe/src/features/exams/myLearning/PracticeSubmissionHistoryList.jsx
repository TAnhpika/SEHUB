import PracticeSubmissionHistoryCard from "./PracticeSubmissionHistoryCard";
import LearningActivityEmpty from "./LearningActivityEmpty";
import styles from "./LearningActivitySection.module.css";

/**
 * @param {{ items: import("./learningActivityTypes").PracticeHistoryItem[] }} props
 */
function PracticeSubmissionHistoryList({ items }) {
  if (items.length === 0) {
    return <LearningActivityEmpty tab="practice" />;
  }

  return (
    <ul
      className={styles.list}
      id="learning-panel-practice"
      role="tabpanel"
      aria-labelledby="learning-tab-practice"
    >
      {items.map((item) => (
        <li key={item.id}>
          <PracticeSubmissionHistoryCard item={item} />
        </li>
      ))}
    </ul>
  );
}

export default PracticeSubmissionHistoryList;
