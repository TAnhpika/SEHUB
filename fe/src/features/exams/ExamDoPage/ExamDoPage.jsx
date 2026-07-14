import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
  faClock,
  faPaperPlane,
  faTableCells,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import PostImagesGallery from "@/features/posts/PostImagesGallery/PostImagesGallery";
import { useAuth } from "@/context";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { buildExamQuestions, EXAM_TYPE_LABELS, EXAM_USE_MOCK, loadExamMeta, loadReviewQuestions, resolveExamApiId } from "@/features/exams/examDetailData";
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
  getOrCreateExamSession,
  resolveExamTimeRemainingLevel,
  saveExamAnswers,
  submitExamSession,
  usesApiAttempt,
} from "@/features/exams/examSession";
import {
  getExamById,
  getSubjectDetailConfig,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import { canTakeReviewExam } from "@/utils/examAccess";
import {
  getExamDetailPath,
  getExamResultPath,
  isExamFocusPath,
  resolveExamScope,
} from "@/utils/examFocusPaths";
import {
  getSelectedAnswerKeys,
  isMultiSelectQuestion,
  isQuestionAnswered,
  setSingleSelectAnswer,
  toggleMultiSelectAnswer,
} from "@/features/exams/examQuestionTypes";
import {
  resolveOptionKeyFromDigit,
  shouldIgnoreExamShortcut,
} from "@/features/exams/examDoKeyboard";
import styles from "./ExamDoPage.module.css";

/** §3.3 — Làm bài trực tuyến: 45 phút (mock; production có thể cấu hình theo đề) */
const EXAM_DURATION_MS = 45 * 60 * 1000;

const TIME_LEVEL_CLASS_KEYS = {
  safe: "timeLevelSafe",
  caution: "timeLevelCaution",
  warning: "timeLevelWarning",
  critical: "timeLevelCritical",
};

function ExamTimerDisplay({ timeRemainingMs, totalDurationMs, styles, className = "" }) {
  const level = resolveExamTimeRemainingLevel(timeRemainingMs, totalDurationMs);
  const levelClass = styles[TIME_LEVEL_CLASS_KEYS[level]] ?? "";

  return (
    <span
      className={[styles.examTimer, levelClass, className].filter(Boolean).join(" ")}
      role="timer"
      aria-live="polite"
      aria-label={`Thời gian còn lại ${formatDuration(timeRemainingMs)}`}
    >
      <FontAwesomeIcon icon={faClock} className={styles["time-icon"]} aria-hidden="true" />
      {formatDuration(timeRemainingMs)}
    </span>
  );
}

function ExamDoPage({ page = "review" }) {
  const { courseCode, examId } = useParams();
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchExam() {
      setExamReady(false);
      if (EXAM_USE_MOCK) {
        const mockExam = getExamById(courseCode, decodedExamId, page, scope);
        if (mockExam) {
          if (!cancelled) {
            setExam(mockExam);
            setApiExamId(null);
            setExamReady(true);
          }
          return;
        }
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
  const resultPath = exam
    ? getExamResultPath(exam.courseCode, exam.id, scope)
    : getExamResultPath(courseCode ?? "", decodedExamId, scope);

  const submitExam = useCallback(
    async (auto = false) => {
      if (!exam) return;

      const session = getExamSession(exam.id);
      const effectiveApiExamId = apiExamId ?? session?.apiExamId;
      const effectiveAttemptId = attemptId ?? session?.attemptId;
      const shouldUseApi =
        Boolean(effectiveApiExamId && effectiveAttemptId)
        && (useApiFlow || usesApiAttempt(session));

      try {
        setIsSubmitting(true);
        if (shouldUseApi) {
          await submitApiAttempt(
            exam.id,
            effectiveApiExamId,
            effectiveAttemptId,
            questions,
            startedAt,
            session?.answers ?? {},
          );
        } else {
          submitExamSession(exam.id, questions);
        }
      } catch (error) {
        setIsSubmitting(false);
        showToast(error.message ?? "Không nộp được bài thi.");
        return;
      }

      showToast(auto ? "Hết giờ — hệ thống đã nộp bài tự động." : "Đã nộp bài thành công.");
      navigate(resultPath);
    },
    [
      exam,
      useApiFlow,
      apiExamId,
      attemptId,
      questions,
      startedAt,
      navigate,
      resultPath,
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
              const attempt = await startOrResumeAttempt(nextApiExamId);
              nextQuestions = loadedQuestions;
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

  const goToQuestion = useCallback((index) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    setIsPaletteOpen(false);
  }, [questions.length]);

  const handleSelectAnswer = useCallback(
    async (answerKey) => {
      const question = questions[currentIndex];
      if (!question || !exam) return;

      const isMultiQuestion = isMultiSelectQuestion(question);
      const requiredSelectCount =
        question.requiredSelectCount ?? question.correctAnswers?.length ?? 2;
      const session = getOrCreateExamSession(exam.id);
      const nextAnswers = isMultiQuestion
        ? toggleMultiSelectAnswer(
            question.id,
            answerKey,
            session.answers,
            requiredSelectCount,
          )
        : setSingleSelectAnswer(question.id, answerKey, session.answers);

      const next = saveExamAnswers(exam.id, nextAnswers);
      setAnswers({ ...next.answers });

      if (useApiFlow && apiExamId && attemptId) {
        try {
          await persistAttemptAnswers(apiExamId, attemptId, questions, next.answers);
        } catch (error) {
          showToast(error.message ?? "Không lưu được câu trả lời.");
        }
      }
    },
    [exam, questions, currentIndex, useApiFlow, apiExamId, attemptId, showToast],
  );

  useEffect(() => {
    if (!sessionReady || !exam) return undefined;

    const question = questions[currentIndex];
    if (!question?.options?.length) return undefined;

    function handleKeyDown(event) {
      if (shouldIgnoreExamShortcut(event) || isSubmitting) return;

      if (event.key === "ArrowLeft") {
        if (currentIndex <= 0) return;
        event.preventDefault();
        goToQuestion(currentIndex - 1);
        return;
      }

      if (event.key === "ArrowRight") {
        if (currentIndex >= questions.length - 1) return;
        event.preventDefault();
        goToQuestion(currentIndex + 1);
        return;
      }

      if (/^[1-6]$/.test(event.key)) {
        const optionKey = resolveOptionKeyFromDigit(event.key, question.options);
        if (!optionKey) return;
        event.preventDefault();
        handleSelectAnswer(optionKey);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    sessionReady,
    exam,
    questions,
    currentIndex,
    isSubmitting,
    goToQuestion,
    handleSelectAnswer,
  ]);

  if (page !== "review") {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (!canTakeReviewExam(user)) {
    return <Navigate to="/home/premium" replace />;
  }

  if (!examReady || !exam || !sessionReady) {
    if (examReady && !exam) {
      return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
    }

    return (
      <div
        className={isFocusMode ? styles.loadingShellFocus : styles.loadingShell}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className={styles.loading}>
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.loadingText}>Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = questions.filter((question) =>
    isQuestionAnswered(question.id, answers, question),
  ).length;
  const isMultiQuestion = isMultiSelectQuestion(currentQuestion);
  const selectedKeys = currentQuestion
    ? getSelectedAnswerKeys(currentQuestion.id, answers)
    : [];
  const requiredSelectCount =
    currentQuestion?.requiredSelectCount ?? currentQuestion?.correctAnswers?.length ?? 2;
  const typeLabel = EXAM_TYPE_LABELS[page] ?? exam.type;

  async function handleSubmitClick() {
    const unanswered = questions.length - answeredCount;
    const message =
      unanswered > 0
        ? `Bạn còn ${unanswered} câu chưa trả lời. Nộp bài ngay?`
        : "Bạn có chắc muốn nộp bài?";

    const confirmed = await confirm({
      title: "Nộp bài",
      description: message,
      confirmLabel: "Nộp bài",
    });
    if (!confirmed) return;
    await submitExam(false);
  }

  async function handleExitClick(event) {
    if (answeredCount > 0) {
      event.preventDefault();
      const ok = await confirm({
        title: "Thoát bài thi",
        description: "Tiến độ làm bài đang được lưu tạm. Thoát và quay lại xem đề?",
        confirmLabel: "Thoát",
      });
      if (ok) {
        navigate(detailPath);
      }
    }
  }

  async function handleExitFocus() {
    const message =
      answeredCount > 0
        ? "Tiến độ đã lưu tạm. Thoát màn làm bài và quay lại xem đề?"
        : "Thoát màn làm bài và quay lại xem đề?";
    const confirmed = await confirm({
      title: "Thoát bài thi",
      description: message,
      confirmLabel: "Thoát",
    });
    if (!confirmed) return;
    navigate(detailPath);
  }

  const exitControl = isFocusMode ? (
    <button type="button" className={styles.back} onClick={handleExitFocus}>
      <FontAwesomeIcon icon={faArrowLeft} />
      <span className={styles.backLabel}>Thoát bài thi</span>
    </button>
  ) : (
    <Link to={detailPath} className={styles.back} onClick={handleExitClick}>
      <FontAwesomeIcon icon={faArrowLeft} />
      <span className={styles.backLabel}>Thoát bài thi</span>
    </Link>
  );

  const questionNav = (
    <div className={styles.pagination}>
      <QuestionNavControls
        currentIndex={currentIndex}
        questionCount={exam.questionCount}
        isFirstQuestion={isFirstQuestion}
        isLastQuestion={isLastQuestion}
        onPrev={() => goToQuestion(currentIndex - 1)}
        onNext={() => goToQuestion(currentIndex + 1)}
        isPaletteOpen={isPaletteOpen}
        onPaletteToggle={() => setIsPaletteOpen((open) => !open)}
        styles={styles}
      />
    </div>
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
              <dd>
                <ExamTimerDisplay
                  timeRemainingMs={timeRemainingMs}
                  totalDurationMs={EXAM_DURATION_MS}
                  styles={styles}
                />
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
              <ExamTimerDisplay
                timeRemainingMs={timeRemainingMs}
                totalDurationMs={EXAM_DURATION_MS}
                styles={styles}
              />
            </div>
            <button
              type="button"
              className={styles["submit-btn"]}
              onClick={handleSubmitClick}
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              {isSubmitting ? "Đang nộp ..." : "Nộp bài"}
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
              <button
                type="button"
                className={styles["submit-btn"]}
                onClick={handleSubmitClick}
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                {isSubmitting ? "Đang nộp ..." : "Nộp bài"}
              </button>
            </div>
          </header>
        )}

        <div className={styles.workspace}>
          <div className={styles["main-column"]}>
            <article className={styles["question-card"]}>
              <RichTextContent
                value={currentQuestion.text}
                className={styles["question-text"]}
              />
              <PostImagesGallery images={currentQuestion.images} />

              {isMultiQuestion ? (
                <p className={styles["multi-hint"]}>
                  Chọn đúng {requiredSelectCount} đáp án ({selectedKeys.length}/{requiredSelectCount}).
                </p>
              ) : null}

              <ul className={styles.options}>
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedKeys.includes(option.key);

                  return (
                    <li key={option.key}>
                      <button
                        type="button"
                        className={`${styles.option} ${isSelected ? styles["option-selected"] : ""}`}
                        aria-label={`Đáp án ${option.key}`}
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
                {questionNav}
                <div className={styles["toolbar-spacer"]} />
              </footer>
            </article>
          </div>

          <aside
            id="exam-question-palette"
            className={`${styles.palette} ${isPaletteOpen ? styles.paletteExpanded : ""}`}
            aria-label="Bảng câu hỏi"
          >
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
                const isAnswered = isQuestionAnswered(question.id, answers, question);
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

        <nav className={styles.mobileExamNav} aria-label="Điều hướng câu hỏi">
          {questionNav}
        </nav>
      </section>
    </div>
  );
}

function QuestionNavControls({
  currentIndex,
  questionCount,
  isFirstQuestion,
  isLastQuestion,
  onPrev,
  onNext,
  isPaletteOpen,
  onPaletteToggle,
  styles,
}) {
  return (
    <>
      <button
        type="button"
        className={`${styles["page-btn"]} ${styles["page-btn-text"]}`}
        onClick={onPrev}
        disabled={isFirstQuestion}
        aria-label="Câu trước"
      >
        <FontAwesomeIcon icon={faChevronLeft} className={styles["page-btn-icon"]} />
        <span className={styles["page-btn-label"]}>Trước</span>
      </button>
      <button
        type="button"
        className={`${styles.paletteToggle} ${isPaletteOpen ? styles.paletteToggleActive : ""}`}
        onClick={onPaletteToggle}
        aria-expanded={isPaletteOpen}
        aria-controls="exam-question-palette"
        aria-label={isPaletteOpen ? "Đóng bảng câu hỏi" : "Mở bảng câu hỏi"}
      >
        <FontAwesomeIcon icon={faTableCells} />
      </button>
      <span className={styles["page-indicator"]}>
        <span className={styles["page-indicator-current"]}>{currentIndex + 1}</span>
        <span className={styles["page-indicator-sep"]}>/</span>
        <span className={styles["page-indicator-total"]}>{questionCount}</span>
      </span>
      <button
        type="button"
        className={`${styles["page-btn"]} ${styles["page-btn-text"]}`}
        onClick={onNext}
        disabled={isLastQuestion}
        aria-label="Câu sau"
      >
        <span className={styles["page-btn-label"]}>Sau</span>
        <FontAwesomeIcon icon={faChevronRight} className={styles["page-btn-icon"]} />
      </button>
    </>
  );
}

export default ExamDoPage;
