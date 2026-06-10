import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
  faClock,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { buildExamQuestions, EXAM_TYPE_LABELS, loadExamMeta, loadReviewQuestions, resolveExamApiId } from "@/features/exams/examDetailData";
import {
  persistAttemptAnswers,
  startOrResumeAttempt,
  submitApiAttempt,
  syncAttemptAnswersToUi,
} from "@/features/exams/examApiSession";
import {
  createExamSession,
  formatDuration,
  getExamSession,
  saveExamAnswer,
  submitExamSession,
} from "@/features/exams/examSession";
import {
  getExamById,
  getSubjectDetailConfig,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import { canTakeReviewExam } from "@/utils/examAccess";
import {
  getExamDetailPath,
  getExamFocusResultPath,
  isExamFocusPath,
  resolveExamScope,
} from "@/utils/examFocusPaths";
import styles from "./ExamDoPage.module.css";

/** §3.3 — Làm bài trực tuyến: 45 phút (mock; production có thể cấu hình theo đề) */
const EXAM_DURATION_MS = 45 * 60 * 1000;

function ExamDoPage({ page = "review" }) {
  const { courseCode, examId } = useParams();
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isFocusMode = isExamFocusPath(pathname);
  const scope = isFocusMode
    ? resolveExamScope(pathname, locationState)
    : pathname.startsWith("/home/")
      ? "home"
      : "community";
  const config = getSubjectDetailConfig(page, scope);
  const decodedExamId = decodeURIComponent(examId ?? "");

  const [exam, setExam] = useState(null);
  const [examReady, setExamReady] = useState(false);
  const [apiExamId, setApiExamId] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [useApiFlow, setUseApiFlow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchExam() {
      setExamReady(false);
      const mockExam = getExamById(courseCode, decodedExamId, page, scope);
      if (mockExam) {
        if (!cancelled) {
          setExam(mockExam);
          setApiExamId(null);
          setExamReady(true);
        }
        return;
      }

      try {
        const meta = await loadExamMeta(courseCode, decodedExamId, page, scope);
        if (!cancelled) {
          setExam(meta?.exam ?? null);
          setApiExamId(meta?.apiExamId ?? null);
        }
      } catch {
        if (!cancelled) {
          setExam(null);
        }
      } finally {
        if (!cancelled) {
          setExamReady(true);
        }
      }
    }

    fetchExam();
    return () => {
      cancelled = true;
    };
  }, [courseCode, decodedExamId, page, scope]);

  const detailPath = exam
    ? getExamDetailPath(exam.courseCode, exam.id, scope)
    : config?.detailBase ?? "/home/final-exam";
  const resultPath = isFocusMode
    ? getExamFocusResultPath(exam?.courseCode ?? courseCode ?? "", exam?.id ?? decodedExamId)
    : `${detailPath}/result`;

  const submitExam = useCallback(
    async (auto = false) => {
      if (!exam) return;

      try {
        if (useApiFlow && apiExamId && attemptId) {
          await submitApiAttempt(exam.id, apiExamId, attemptId, questions, startedAt);
        } else {
          submitExamSession(exam.id, questions);
        }
      } catch (error) {
        showToast(error.message ?? "Không nộp được bài thi.");
        return;
      }

      showToast(auto ? "Hết giờ — hệ thống đã nộp bài tự động." : "Đã nộp bài thành công.");
      navigate(resultPath, isFocusMode ? { state: { scope } } : undefined);
    },
    [
      exam,
      useApiFlow,
      apiExamId,
      attemptId,
      questions,
      startedAt,
      isFocusMode,
      navigate,
      resultPath,
      scope,
      showToast,
    ],
  );

  useEffect(() => {
    if (!exam || !examReady || !canTakeReviewExam(user)) return undefined;

    let cancelled = false;

    async function initSession() {
      const existing = getExamSession(exam.id);
      if (existing?.submitted) {
        navigate(resultPath, { replace: true });
        return;
      }

      let nextQuestions = buildExamQuestions(exam.questionCount, page);
      let nextApiExamId = apiExamId;
      let nextAttemptId = existing?.attemptId ?? null;
      let nextAnswers = existing?.answers ?? {};
      let nextStartedAt = existing?.startedAt ?? Date.now();
      let apiEnabled = false;

      if (canTakeReviewExam(user) && page === "review") {
        try {
          if (!nextApiExamId) {
            nextApiExamId = exam.apiId ?? (await resolveExamApiId(exam.id));
          }

          if (nextApiExamId) {
            const loadedQuestions = await loadReviewQuestions(
              nextApiExamId,
              exam.questionCount,
              page,
            );

            if (loadedQuestions.length > 0) {
              nextQuestions = loadedQuestions;
              const attempt = await startOrResumeAttempt(nextApiExamId);
              nextAttemptId = attempt.id;
              nextAnswers = syncAttemptAnswersToUi(nextQuestions, attempt);
              nextStartedAt = attempt.startedAt
                ? new Date(attempt.startedAt).getTime()
                : Date.now();
              apiEnabled = true;
            }
          }
        } catch {
          apiEnabled = false;
        }
      }

      if (cancelled) return;

      setQuestions(nextQuestions);
      setApiExamId(nextApiExamId);
      setAttemptId(nextAttemptId);
      setAnswers(nextAnswers);
      setStartedAt(nextStartedAt);
      setUseApiFlow(apiEnabled);

      createExamSession(exam.id, {
        apiExamId: nextApiExamId,
        attemptId: nextAttemptId,
        startedAt: nextStartedAt,
        answers: nextAnswers,
      });
      setSessionReady(true);
    }

    initSession();
    return () => {
      cancelled = true;
    };
  }, [exam, examReady, apiExamId, page, user, navigate, resultPath]);

  useEffect(() => {
    if (!sessionReady) return;
    document.title = exam ? `Đang làm bài — ${exam.id} | SEHUB` : "Đang làm bài | SEHUB";
    return () => {
      document.title = "SEHUB";
    };
  }, [sessionReady, exam]);

  useEffect(() => {
    if (!sessionReady || !isFocusMode) return;

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionReady, isFocusMode]);

  useEffect(() => {
    if (!sessionReady) return;

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sessionReady, startedAt]);

  const timeRemainingMs = Math.max(0, EXAM_DURATION_MS - elapsedMs);

  useEffect(() => {
    if (!sessionReady || timeRemainingMs > 0) return;
    submitExam(true);
  }, [sessionReady, timeRemainingMs, submitExam]);

  if (page !== "review") {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (!canTakeReviewExam(user)) {
    return <Navigate to="/home/premium" replace />;
  }

  if (!examReady || !exam || !sessionReady) {
    return examReady && !exam ? (
      <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />
    ) : null;
  }

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const typeLabel = EXAM_TYPE_LABELS[page] ?? exam.type;
  const isTimeCritical = timeRemainingMs <= 5 * 60 * 1000;

  async function handleSelectAnswer(answerKey) {
    const next = saveExamAnswer(exam.id, currentQuestion.id, answerKey);
    setAnswers({ ...next.answers });

    if (useApiFlow && apiExamId && attemptId) {
      try {
        await persistAttemptAnswers(apiExamId, attemptId, questions, next.answers);
      } catch (error) {
        showToast(error.message ?? "Không lưu được câu trả lời.");
      }
    }
  }

  function goToQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
  }

  function handleSubmitClick() {
    const unanswered = questions.length - answeredCount;
    const message =
      unanswered > 0
        ? `Bạn còn ${unanswered} câu chưa trả lời. Nộp bài ngay?`
        : "Bạn có chắc muốn nộp bài?";

    if (!window.confirm(message)) return;
    submitExam(false);
  }

  function handleExitClick(event) {
    if (answeredCount > 0) {
      const ok = window.confirm(
        "Tiến độ làm bài đang được lưu tạm. Thoát và quay lại xem đề?",
      );
      if (!ok) event.preventDefault();
    }
  }

  function handleExitFocus() {
    const message =
      answeredCount > 0
        ? "Tiến độ đã lưu tạm. Thoát màn làm bài và quay lại xem đề?"
        : "Thoát màn làm bài và quay lại xem đề?";
    if (!window.confirm(message)) return;
    navigate(detailPath);
  }

  const exitControl = isFocusMode ? (
    <button type="button" className={styles.back} onClick={handleExitFocus}>
      <FontAwesomeIcon icon={faArrowLeft} />
      Thoát bài thi
    </button>
  ) : (
    <Link to={detailPath} className={styles.back} onClick={handleExitClick}>
      <FontAwesomeIcon icon={faArrowLeft} />
      Thoát bài thi
    </Link>
  );

  return (
    <div className={`${styles.page} ${isFocusMode ? styles.pageFocus : ""}`}>
      {!isFocusMode && exitControl}

      {!isFocusMode && (
        <section className={styles["info-card"]} aria-label="Thông tin bài thi">
          <h2 className={styles["info-title"]}>Đang làm bài</h2>
          <dl className={styles["info-grid"]}>
            <div className={styles["info-item"]}>
              <dt>Mã đề</dt>
              <dd>{exam.id}</dd>
            </div>
            <div className={styles["info-item"]}>
              <dt>Loại</dt>
              <dd>{typeLabel}</dd>
            </div>
            <div className={styles["info-item"]}>
              <dt>Tiến độ</dt>
              <dd>
                {answeredCount}/{exam.questionCount} câu
              </dd>
            </div>
            <div className={styles["info-item"]}>
              <dt>Thời gian còn lại</dt>
              <dd className={isTimeCritical ? styles["time-critical"] : ""}>
                <FontAwesomeIcon icon={faClock} className={styles["time-icon"]} />
                {formatDuration(timeRemainingMs)}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <section
        className={`${styles["exam-panel"]} ${isFocusMode ? styles["exam-panel-focus"] : ""}`}
        aria-label="Làm bài trắc nghiệm"
      >
        {isFocusMode ? (
          <header className={styles["focus-toolbar"]}>
            {exitControl}
            <div className={styles["focus-meta"]}>
              <span>
                <strong>{exam.id}</strong>
              </span>
              <span>
                {answeredCount}/{exam.questionCount} câu
              </span>
              <span className={isTimeCritical ? styles["time-critical"] : ""}>
                <FontAwesomeIcon icon={faClock} className={styles["time-icon"]} />
                {formatDuration(timeRemainingMs)}
              </span>
            </div>
            <button type="button" className={styles["submit-btn"]} onClick={handleSubmitClick}>
              <FontAwesomeIcon icon={faPaperPlane} />
              Nộp bài
            </button>
          </header>
        ) : (
          <header className={styles["panel-header"]}>
            <div className={styles["panel-heading"]}>
              <h2 className={styles["exam-code"]}>{exam.id}</h2>
              <p className={styles.subtitle}>
                Câu {currentIndex + 1} / {exam.questionCount} · Chọn một đáp án
              </p>
            </div>
            <div className={styles["panel-actions"]}>
              <button type="button" className={styles["submit-btn"]} onClick={handleSubmitClick}>
                <FontAwesomeIcon icon={faPaperPlane} />
                Nộp bài
              </button>
            </div>
          </header>
        )}

        <div className={styles.workspace}>
          <div className={styles["main-column"]}>
            <article className={styles["question-card"]}>
              <p className={styles["question-label"]}>Câu {currentIndex + 1}</p>
              <h3 className={styles["question-text"]}>{currentQuestion.text}</h3>

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
                        <span className={styles["option-label"]}>{option.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <footer className={styles["question-toolbar"]}>
                <div className={styles["toolbar-spacer"]} />

                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles["page-btn"]}
                    onClick={() => goToQuestion(currentIndex - 1)}
                    disabled={isFirstQuestion}
                    aria-label="Câu trước"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <span className={styles["page-indicator"]}>
                    {currentIndex + 1} / {exam.questionCount}
                  </span>
                  <button
                    type="button"
                    className={styles["page-btn"]}
                    onClick={() => goToQuestion(currentIndex + 1)}
                    disabled={isLastQuestion}
                    aria-label="Câu sau"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>

                <div className={styles["toolbar-spacer"]} />
              </footer>
            </article>
          </div>

          <aside className={styles.palette} aria-label="Bảng câu hỏi">
            <header className={styles["palette-header"]}>
              <h3 className={styles["palette-title"]}>Bảng câu hỏi</h3>
              <p className={styles["palette-meta"]}>
                {answeredCount}/{exam.questionCount} đã trả lời
              </p>
            </header>

            <ul className={styles.legend} aria-label="Chú thích trạng thái">
              <li>
                <span className={`${styles.dot} ${styles["dot-current"]}`} /> Đang làm
              </li>
              <li>
                <span className={`${styles.dot} ${styles["dot-answered"]}`} /> Đã trả lời
              </li>
              <li>
                <span className={`${styles.dot} ${styles["dot-empty"]}`} /> Chưa trả lời
              </li>
            </ul>

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
                    aria-label={`Câu ${index + 1}${isAnswered ? ", đã trả lời" : ", chưa trả lời"}`}
                    aria-current={isActive ? "true" : undefined}
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
