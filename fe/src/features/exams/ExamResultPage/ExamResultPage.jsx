import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck, faRotateRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { buildExamQuestions } from "@/features/exams/examDetailData";
import {
  clearExamSession,
  createExamSession,
  formatDuration,
  getExamSession,
} from "@/features/exams/examSession";
import {
  getExamById,
  SUBJECT_DETAIL_CONFIG,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import styles from "./ExamResultPage.module.css";

function ExamResultPage({ page = "review" }) {
  const { courseCode, examId } = useParams();
  const navigate = useNavigate();
  const config = SUBJECT_DETAIL_CONFIG[page];
  const decodedExamId = decodeURIComponent(examId ?? "");

  const exam = useMemo(
    () => getExamById(courseCode, decodedExamId, page),
    [courseCode, decodedExamId, page],
  );

  const questions = useMemo(
    () => (exam ? buildExamQuestions(exam.questionCount, page) : []),
    [exam, page],
  );

  const session = useMemo(
    () => (exam ? getExamSession(exam.id) : null),
    [exam],
  );

  if (page !== "review") {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (!exam) {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (!session?.submitted || !session.result) {
    return (
      <Navigate
        to={`${config.detailBase}/${exam.courseCode}/${encodeURIComponent(exam.id)}`}
        replace
      />
    );
  }

  const { result, startedAt, submittedAt } = session;
  const detailPath = `${config.detailBase}/${exam.courseCode}/${encodeURIComponent(exam.id)}`;
  const doPath = `${detailPath}/do`;
  const durationMs = submittedAt - startedAt;

  function handleRetry() {
    clearExamSession(exam.id);
    createExamSession(exam.id);
    navigate(doPath);
  }

  return (
    <div className={styles.page}>
      <Link to={detailPath} className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại đề thi
      </Link>

      <section className={styles.summary} aria-label="Kết quả bài thi">
        <div className={styles.score}>
          <span className={styles["score-value"]}>{result.scorePercent}%</span>
          <p className={styles["score-label"]}>
            {result.correctCount}/{result.total} câu đúng
          </p>
        </div>

        <div className={styles.meta}>
          <p>
            <strong>Mã đề:</strong> {exam.id}
          </p>
          <p>
            <strong>Thời gian làm bài:</strong> {formatDuration(durationMs)}
          </p>
        </div>

        <div className={styles.actions}>
          <Button onClick={handleRetry}>
            <FontAwesomeIcon icon={faRotateRight} />
            Làm lại
          </Button>
          <Button look="outline" to="/community/final-exam">
            Khám phá đề khác
          </Button>
        </div>
      </section>

      <section className={styles.review} aria-label="Chi tiết từng câu">
        <h2 className={styles["review-title"]}>Chi tiết bài làm</h2>

        <ul className={styles.list}>
          {result.items.map((item, index) => (
            <li key={item.questionId} className={styles.item}>
              <div className={styles["item-head"]}>
                <span className={styles["item-index"]}>Câu {index + 1}</span>
                <span
                  className={`${styles.badge} ${
                    item.isCorrect ? styles["badge-correct"] : styles["badge-wrong"]
                  }`}
                >
                  <FontAwesomeIcon icon={item.isCorrect ? faCheck : faXmark} />
                  {item.isCorrect ? "Đúng" : "Sai"}
                </span>
              </div>

              <p className={styles["item-text"]}>{item.text}</p>

              <ul className={styles.options}>
                {item.options.map((option) => {
                  const isCorrect = option.key === item.correctAnswer;
                  const isSelected = option.key === item.selectedAnswer;

                  return (
                    <li
                      key={option.key}
                      className={[
                        styles.option,
                        isCorrect && styles["option-correct"],
                        isSelected && !isCorrect && styles["option-wrong"],
                        isSelected && styles["option-selected"],
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className={styles["option-key"]}>{option.key}</span>
                      <span>{option.label}</span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ExamResultPage;
