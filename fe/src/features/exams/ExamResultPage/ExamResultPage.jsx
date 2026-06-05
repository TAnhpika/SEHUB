import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCheck,
  faCircleCheck,
  faClock,
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { buildExamQuestions } from "@/features/exams/examDetailData";
import {
  clearExamSession,
  createExamSession,
  formatDuration,
  getExamSession,
  getScoreFeedback,
} from "@/features/exams/examSession";
import {
  getExamById,
  SUBJECT_DETAIL_CONFIG,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import styles from "./ExamResultPage.module.css";

function ScoreRing({ percent }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={styles["score-ring"]} aria-hidden="true">
      <svg viewBox="0 0 120 120" className={styles["score-ring-svg"]}>
        <circle
          cx="60"
          cy="60"
          r={radius}
          className={styles["score-ring-track"]}
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className={styles["score-ring-progress"]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles["score-ring-inner"]}>
        <span className={styles["score-ring-value"]}>{percent}%</span>
        <span className={styles["score-ring-label"]}>Điểm số</span>
      </div>
    </div>
  );
}

function ExamResultPage({ page = "review" }) {
  const { courseCode, examId } = useParams();
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);
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
  const feedback = getScoreFeedback(result.scorePercent);

  const correctPercent = Math.round((result.correctCount / result.total) * 100);
  const wrongPercent = Math.round((result.wrongCount / result.total) * 100);
  const emptyPercent = Math.round((result.unansweredCount / result.total) * 100);

  function handleRetry() {
    clearExamSession(exam.id);
    createExamSession(exam.id);
    navigate(doPath);
  }

  function getQuestionStatus(item) {
    if (!item.selectedAnswer) return "empty";
    return item.isCorrect ? "correct" : "wrong";
  }

  return (
    <div className={styles.page}>
      <Link to={detailPath} className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại đề thi
      </Link>

      <section className={styles.hero} aria-label="Tổng kết bài thi">
        <div className={styles["hero-icon"]} aria-hidden="true">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <div className={styles["hero-text"]}>
          <h1 className={styles.title}>Hoàn thành bài thi!</h1>
          <p className={styles.subtitle}>
            Mã đề <strong>{exam.id}</strong> · {exam.courseCode}
          </p>
        </div>
        <ScoreRing percent={result.scorePercent} />
        <div className={styles.feedback}>
          <span className={styles["feedback-badge"]}>{feedback.label}</span>
          <p className={styles["feedback-message"]}>{feedback.message}</p>
        </div>
      </section>

      <section className={styles.stats} aria-label="Thống kê bài làm">
        <h2 className={styles["section-title"]}>Thống kê bài làm</h2>
        <div className={styles["stats-grid"]}>
          <article className={`${styles["stat-card"]} ${styles["stat-correct"]}`}>
            <span className={styles["stat-icon"]}>
              <FontAwesomeIcon icon={faCheck} />
            </span>
            <p className={styles["stat-value"]}>{result.correctCount}</p>
            <p className={styles["stat-label"]}>Câu đúng</p>
          </article>
          <article className={`${styles["stat-card"]} ${styles["stat-wrong"]}`}>
            <span className={styles["stat-icon"]}>
              <FontAwesomeIcon icon={faXmark} />
            </span>
            <p className={styles["stat-value"]}>{result.wrongCount}</p>
            <p className={styles["stat-label"]}>Câu sai</p>
          </article>
          <article className={`${styles["stat-card"]} ${styles["stat-empty"]}`}>
            <span className={styles["stat-icon"]}>—</span>
            <p className={styles["stat-value"]}>{result.unansweredCount}</p>
            <p className={styles["stat-label"]}>Bỏ trống</p>
          </article>
          <article className={`${styles["stat-card"]} ${styles["stat-time"]}`}>
            <span className={styles["stat-icon"]}>
              <FontAwesomeIcon icon={faClock} />
            </span>
            <p className={styles["stat-value"]}>{formatDuration(durationMs)}</p>
            <p className={styles["stat-label"]}>Thời gian</p>
          </article>
        </div>

        <div className={styles["progress-bar"]} aria-label="Tỷ lệ đúng, sai, bỏ trống">
          <span
            className={styles["progress-correct"]}
            style={{ width: `${correctPercent}%` }}
          />
          <span
            className={styles["progress-wrong"]}
            style={{ width: `${wrongPercent}%` }}
          />
          <span
            className={styles["progress-empty"]}
            style={{ width: `${emptyPercent}%` }}
          />
        </div>
        <div className={styles.legend}>
          <span>
            <i className={styles["legend-dot-correct"]} /> Đúng {correctPercent}%
          </span>
          <span>
            <i className={styles["legend-dot-wrong"]} /> Sai {wrongPercent}%
          </span>
          <span>
            <i className={styles["legend-dot-empty"]} /> Bỏ trống {emptyPercent}%
          </span>
        </div>
      </section>

      <section className={styles.map} aria-label="Bảng câu hỏi">
        <div className={styles["map-head"]}>
          <h2 className={styles["section-title"]}>Bảng thống kê câu hỏi</h2>
          <p className={styles["map-meta"]}>
            {result.correctCount}/{result.total} câu đúng
          </p>
        </div>
        <div className={styles["map-grid"]}>
          {result.items.map((item, index) => {
            const status = getQuestionStatus(item);
            return (
              <span
                key={item.questionId}
                className={`${styles["map-cell"]} ${styles[`map-cell-${status}`]}`}
                title={`Câu ${index + 1}: ${
                  status === "correct" ? "Đúng" : status === "wrong" ? "Sai" : "Bỏ trống"
                }`}
              >
                {index + 1}
              </span>
            );
          })}
        </div>
      </section>

      <section className={styles.detail} aria-label="Chi tiết từng câu">
        <button
          type="button"
          className={styles["detail-toggle"]}
          onClick={() => setShowDetail((open) => !open)}
          aria-expanded={showDetail}
        >
          {showDetail ? "Ẩn chi tiết từng câu" : "Xem chi tiết từng câu"}
        </button>

        {showDetail && (
          <ul className={styles.list}>
            {result.items.map((item, index) => (
              <li key={item.questionId} className={styles.item}>
                <div className={styles["item-head"]}>
                  <span className={styles["item-index"]}>Câu {index + 1}</span>
                  <span
                    className={`${styles.badge} ${
                      item.isCorrect
                        ? styles["badge-correct"]
                        : item.selectedAnswer
                          ? styles["badge-wrong"]
                          : styles["badge-empty"]
                    }`}
                  >
                    {item.isCorrect ? "Đúng" : item.selectedAnswer ? "Sai" : "Bỏ trống"}
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
        )}
      </section>

      <section className={styles.actions} aria-label="Hành động">
        <Button onClick={handleRetry}>
          <FontAwesomeIcon icon={faRotateRight} />
          Làm lại
        </Button>
        <Button look="outline" to={detailPath}>
          Quay lại đề thi
        </Button>
        <Button look="soft" to="/community/final-exam">
          Khám phá đề khác
        </Button>
      </section>
    </div>
  );
}

export default ExamResultPage;
