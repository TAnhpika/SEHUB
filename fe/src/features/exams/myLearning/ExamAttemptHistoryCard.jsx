import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCalendarDays,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import {
  getPassStatus,
  getScoreGrade,
  getScoreOnTen,
} from "@/features/exams/examResultInsights";
import { buildExamResultHistoryPath } from "./examResultHistory";
import { formatLearningDate } from "./learningActivityFormat";
import styles from "./LearningActivitySection.module.css";

function resolveCourseCode(examCode) {
  const match = examCode?.match(/^([A-Z0-9]+)-/i);
  return match?.[1]?.toUpperCase() ?? "";
}

/**
 * @param {{ item: import("./learningActivityTypes").ExamAttemptHistoryItem }} props
 */
function ExamAttemptHistoryCard({ item }) {
  const scoreOnTen = getScoreOnTen(item.correctCount, item.totalQuestions);
  const passStatus = getPassStatus(scoreOnTen);
  const grade = getScoreGrade(item.scorePercent);
  const isPass = passStatus === "pass";
  const courseCode = resolveCourseCode(item.examCode);
  const resultPath = buildExamResultHistoryPath(courseCode, item.examCode, item.attemptId, "home");

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>
          <span className={styles.cardCode}>{item.examCode}</span>
          {" · "}
          {item.examTitle}
        </h3>
        <div className={styles.cardBadges}>
          <span
            className={`${styles.badge} ${isPass ? styles.badgePass : styles.badgeFail}`}
          >
            <FontAwesomeIcon icon={isPass ? faCheck : faXmark} />
            {isPass ? " Đạt" : " Chưa đạt"}
          </span>
          <span className={`${styles.badge} ${styles.badgeGrade}`}>{grade.label}</span>
        </div>
      </div>

      <p className={styles.cardMeta}>
        <span>
          <FontAwesomeIcon icon={faBook} />
          {item.major} · HK{item.semester}
        </span>
        <span>
          <FontAwesomeIcon icon={faCalendarDays} />
          {formatLearningDate(item.submittedAt)}
        </span>
        <span>{item.totalQuestions} câu</span>
      </p>

      <div className={styles.cardFoot}>
        <div className={styles.scoreRow}>
          <span className={styles.scoreMain}>{scoreOnTen.toFixed(1)}/10</span>
          <span className={styles.scoreDetail}>
            {item.correctCount}/{item.totalQuestions} đúng · {item.scorePercent}%
          </span>
          {item.rewardPoints ? (
            <span className={styles.rewardHint}>+{item.rewardPoints} điểm SEHUB</span>
          ) : null}
        </div>
        <Button to={resultPath} look="outline" size="sm">
          Xem lại
        </Button>
      </div>
    </article>
  );
}

export default ExamAttemptHistoryCard;
