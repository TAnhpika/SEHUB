import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { getAiExplanation } from "@/features/exams/examAiExplainData";
import styles from "./ExamAiExplanation.module.css";

function ExamAiExplanation({ question, locked = false }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const explanation = getAiExplanation(question);

  if (locked) {
    return (
      <section className={styles.locked} aria-label="AI giải thích — Premium">
        <div className={styles["locked-inner"]}>
          <FontAwesomeIcon icon={faRobot} className={styles["locked-icon"]} />
          <p className={styles["locked-title"]}>AI giải thích chi tiết</p>
          <p className={styles["locked-desc"]}>
            Nâng cấp Premium để xem giải thích đáp án bằng AI cho từng câu hỏi.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label="AI giải thích chi tiết" key={refreshKey}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.icon} aria-hidden="true">
            <FontAwesomeIcon icon={faRobot} />
          </span>
          <h3 className={styles.title}>AI giải thích chi tiết</h3>
        </div>
        <button
          type="button"
          className={styles.refresh}
          onClick={() => setRefreshKey((key) => key + 1)}
        >
          Yêu cầu giải thích lại
        </button>
      </header>

      <p className={styles.intro}>{explanation.intro}</p>

      <ul className={styles.bullets}>
        {explanation.bullets.map((item) => (
          <li key={item.label}>
            <strong>{item.label}</strong>: {item.text}
          </li>
        ))}
      </ul>

      <p className={styles.note}>{explanation.note}</p>
    </section>
  );
}

export default ExamAiExplanation;
