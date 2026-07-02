import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Button from "@/common/Button/Button";
import { getSubmissionStatusLabel } from "@/features/exams/practiceExamSubmissions";
import { getExamDetailPath } from "@/utils/examFocusPaths";
import { formatLearningDate, formatLearningDateShort } from "./learningActivityFormat";
import styles from "./LearningActivitySection.module.css";

function getStatusBadgeClass(status) {
  if (status === "pass") return styles.badgePassStatus;
  if (status === "fail") return styles.badgeFailStatus;
  if (status === "reviewed") return styles.badgeReviewed;
  return styles.badgePending;
}

function shortenGithubUrl(url) {
  return url.replace(/^https?:\/\//, "");
}

/**
 * @param {{ item: import("./learningActivityTypes").PracticeHistoryItem }} props
 */
function PracticeSubmissionHistoryCard({ item }) {
  const detailPath = getExamDetailPath(item.courseCode, item.examCode, "home", "practice");

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>
          <span className={styles.cardCode}>{item.examCode}</span>
          {" · "}
          {item.examTitle}
        </h3>
        <span className={`${styles.badge} ${getStatusBadgeClass(item.status)}`}>
          {getSubmissionStatusLabel(item.status)}
        </span>
      </div>

      <a
        href={item.githubUrl}
        className={styles.repoLink}
        target="_blank"
        rel="noreferrer"
      >
        <FontAwesomeIcon icon={faGithub} /> {shortenGithubUrl(item.githubUrl)}
      </a>

      <p className={styles.cardMeta}>
        <span>
          <FontAwesomeIcon icon={faCalendarDays} />
          Nộp: {formatLearningDateShort(item.submittedAt)}
        </span>
        {item.reviewedAt ? (
          <span>Chấm: {formatLearningDateShort(item.reviewedAt)}</span>
        ) : (
          <span>Chấm: —</span>
        )}
      </p>

      {item.grade ? (
        <p className={styles.gradeLine}>
          <strong>Điểm:</strong> {item.grade}
        </p>
      ) : null}

      {item.feedback ? <p className={styles.feedback}>{item.feedback}</p> : null}

      {item.status === "pending" || item.status === "reviewed" ? (
        <p className={styles.feedback}>Bài đang chờ Mod/Admin chấm.</p>
      ) : null}

      <div className={styles.cardFoot}>
        <Button to={detailPath} look="outline" size="sm">
          Xem đề
        </Button>
      </div>
    </article>
  );
}

export default PracticeSubmissionHistoryCard;
