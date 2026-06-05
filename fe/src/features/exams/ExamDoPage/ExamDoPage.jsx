import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
  faClock,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { buildExamQuestions } from "@/features/exams/examDetailData";
import {
  createExamSession,
  formatDuration,
  getExamSession,
  saveExamAnswer,
  submitExamSession,
} from "@/features/exams/examSession";
import {
  getExamById,
  SUBJECT_DETAIL_CONFIG,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import styles from "./ExamDoPage.module.css";

const EXAM_DURATION_MS = 45 * 60 * 1000;

function ExamDoPage({ page = "review" }) {
  const { courseCode, examId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!exam) return;

    const existing = getExamSession(exam.id);
    if (existing?.submitted) {
      navigate(`${config.detailBase}/${exam.courseCode}/${encodeURIComponent(exam.id)}/result`, {
        replace: true,
      });
      return;
    }

    const session = existing ?? createExamSession(exam.id);
    setAnswers(session.answers ?? {});
    setStartedAt(session.startedAt ?? Date.now());
  }, [exam, config.detailBase, navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  if (page !== "review") {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (!exam) {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const detailPath = `${config.detailBase}/${exam.courseCode}/${encodeURIComponent(exam.id)}`;
  const resultPath = `${detailPath}/result`;
  const timeRemainingMs = Math.max(0, EXAM_DURATION_MS - elapsedMs);

  function handleSelectAnswer(answerKey) {
    const next = saveExamAnswer(exam.id, currentQuestion.id, answerKey);
    setAnswers({ ...next.answers });
  }

  function goToQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
  }

  function handleSubmit() {
    const unanswered = questions.length - answeredCount;
    const message =
      unanswered > 0
        ? `Bạn còn ${unanswered} câu chưa trả lời. Nộp bài ngay?`
        : "Bạn có chắc muốn nộp bài?";

    if (!window.confirm(message)) {
      return;
    }

    submitExamSession(exam.id, questions);
    showToast("Đã nộp bài thành công.");
    navigate(resultPath);
  }

  return (
    <div className={styles.page}>
      <Link to={detailPath} className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Thoát bài thi
      </Link>

      <section className={styles.panel} aria-label="Làm bài trắc nghiệm">
        <header className={styles.header}>
          <div className={styles["header-main"]}>
            <h1 className={styles["exam-code"]}>{exam.id}</h1>
            <p className={styles.meta}>
              {answeredCount}/{exam.questionCount} câu đã trả lời
            </p>
          </div>

          <div className={styles["header-actions"]}>
            <span className={styles.timer} aria-live="polite">
              <FontAwesomeIcon icon={faClock} />
              {formatDuration(timeRemainingMs)}
            </span>
            <Button size="sm" onClick={handleSubmit}>
              <FontAwesomeIcon icon={faPaperPlane} />
              Nộp bài
            </Button>
          </div>
        </header>

        <div className={styles.body}>
          <div className={styles["question-area"]}>
            <p className={styles["question-label"]}>Câu {currentIndex + 1}</p>
            <p className={styles["question-text"]}>{currentQuestion.text}</p>

            <ul className={styles.options}>
              {currentQuestion.options.map((option) => {
                const isSelected = answers[String(currentQuestion.id)] === option.key;

                return (
                  <li key={option.key}>
                    <button
                      type="button"
                      className={`${styles.option} ${isSelected ? styles["option-selected"] : ""}`}
                      onClick={() => handleSelectAnswer(option.key)}
                    >
                      <span className={styles["option-key"]}>{option.key}</span>
                      <span>{option.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <footer className={styles.toolbar}>
              <button
                type="button"
                className={styles["nav-btn"]}
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={isFirstQuestion}
                aria-label="Câu trước"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              <span className={styles.indicator}>
                {currentIndex + 1} / {exam.questionCount}
              </span>

              <button
                type="button"
                className={styles["nav-btn"]}
                onClick={() => goToQuestion(currentIndex + 1)}
                disabled={isLastQuestion}
                aria-label="Câu sau"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </footer>
          </div>

          <aside className={styles.palette} aria-label="Danh sách câu hỏi">
            <h2 className={styles["palette-title"]}>Bảng câu hỏi</h2>
            <div className={styles.grid}>
              {questions.map((question, index) => {
                const isAnswered = Boolean(answers[String(question.id)]);
                const isActive = index === currentIndex;

                return (
                  <button
                    key={question.id}
                    type="button"
                    className={[
                      styles["grid-btn"],
                      isAnswered && styles["grid-btn-answered"],
                      isActive && styles["grid-btn-active"],
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => goToQuestion(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default ExamDoPage;
