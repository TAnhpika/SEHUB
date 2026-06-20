import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faComment,
  faExpand,
  faEye,
  faEyeSlash,
  faLock,
  faPlay,
  faShuffle,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { useRequirePremium } from "@/hooks/useRequirePremium";
import ExamAiExplanation from "@/features/exams/ExamAiExplanation/ExamAiExplanation";
import ExamAttachmentViewer from "@/features/exams/ExamAttachmentViewer/ExamAttachmentViewer";
import ExamCommentsPanel from "@/features/exams/ExamCommentsPanel/ExamCommentsPanel";
import { getExamSession } from "@/features/exams/examSession";
import { getPracticeSession } from "@/features/exams/practiceSession";
import {
  buildExamQuestions,
  EXAM_PREVIEW_LABELS,
  EXAM_TYPE_LABELS,
  EXAM_USE_MOCK,
  loadExamMeta,
  loadQuestionWithAnswer,
  loadReviewQuestions,
  resolveExamApiId,
} from "@/features/exams/examDetailData";
import StudentDocumentViewer from "@/features/documents/StudentDocumentViewer/StudentDocumentViewer";
import { loadDocumentExamItem } from "@/features/documents/studentDocumentsData";
import PracticeExamSubmitPanel from "@/features/exams/PracticeExamSubmitPanel/PracticeExamSubmitPanel";
import PracticeBriefPanel from "@/features/exams/PracticeBriefPanel/PracticeBriefPanel";
import { getPracticeBrief } from "@/features/exams/practiceBriefData";
import {
  getSubjectDetailConfig,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import {
  canCommentOnExamQuestion,
  canSubmitPracticeExam,
  canTakeReviewExam,
  canUseReviewStudyTools,
  canViewExamAnswers,
} from "@/utils/examAccess";
import ExamQuestionReportButton from "@/features/exams/ExamQuestionReportButton/ExamQuestionReportButton";
import {
  getOrderedReviewQuestions,
  getReviewSession,
  isReviewCorrectAnswerRevealed,
  shuffleReviewQuestions,
  ensureReviewOptionOrder,
  toggleReviewCorrectAnswerReveal,
} from "@/features/exams/examReviewSessionStore";
import {
  buildDisplayOptions,
  mapCorrectAnswersToDisplay,
} from "@/features/exams/examReviewOptions";
import {
  getExamFocusDoPath,
  getExamResultPath,
  getPracticeDoPath,
  getPracticeResultPath,
} from "@/utils/examFocusPaths";
import styles from "./ExamDetailPage.module.css";

function ExamDetailPage({ page }) {
  const { courseCode, examId } = useParams();
  const navigate = useNavigate();
  const { pathname, search, state: locationState } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { requirePremium } = useRequirePremium();
  const scope = pathname.startsWith("/home/") ? "home" : "community";
  const username = user?.username ?? "guest";
  const config = getSubjectDetailConfig(page, scope);
  const decodedExamId = decodeURIComponent(examId ?? "");

  const [exam, setExam] = useState(null);
  const [examReady, setExamReady] = useState(false);
  const [apiExamId, setApiExamId] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchExam() {
      setExamReady(false);

      if (page === "documents") {
        try {
          const apiDoc = await loadDocumentExamItem(courseCode, decodedExamId, scope);
          if (!cancelled) {
            setExam(apiDoc);
            setApiExamId(null);
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
        return;
      }

      try {
        const meta = await loadExamMeta(courseCode, decodedExamId, page, scope, {
          apiExamId: locationState?.apiExamId,
        });
        if (!cancelled) {
          setExam(meta?.exam ?? null);
          setApiExamId(meta?.apiExamId ?? null);
        }
      } catch {
        if (!cancelled) {
          setExam(null);
          setApiExamId(null);
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
  }, [courseCode, decodedExamId, page, scope, locationState?.apiExamId]);

  useEffect(() => {
    if (!exam) return undefined;

    let cancelled = false;

    async function fetchQuestions() {
      const fallback = buildExamQuestions(exam.questionCount, page);

      if (page !== "review") {
        setQuestions(fallback);
        return;
      }

      if (!isAuthenticated && !apiExamId) {
        setQuestions(fallback);
        return;
      }

      try {
        let resolvedApiId = apiExamId;
        if (!resolvedApiId) {
          resolvedApiId = await resolveExamApiId(exam.id);
        }

        if (resolvedApiId) {
          const loaded = await loadReviewQuestions(resolvedApiId, exam.questionCount, page);
          if (!cancelled && loaded.length > 0) {
            setQuestions(loaded);
            if (!apiExamId) {
              setApiExamId(resolvedApiId);
            }
            return;
          }

          if (!cancelled && !EXAM_USE_MOCK) {
            setQuestions([]);
            return;
          }
        }
      } catch {
        /* fallback below */
      }

      if (!cancelled) {
        setQuestions(fallback);
      }
    }

    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [exam, page, isAuthenticated, apiExamId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionTick, setSessionTick] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    setSessionTick(0);
  }, [decodedExamId]);

  useEffect(() => {
    const questionIndex = Number(locationState?.questionIndex);
    if (!Number.isFinite(questionIndex) || questionIndex < 0) return;
    if (questionIndex >= questions.length) return;
    setCurrentIndex(questionIndex);
  }, [decodedExamId, locationState?.questionIndex, questions.length]);

  const isReviewExam = page === "review";

  const reviewSession = useMemo(() => {
    if (!exam || !isReviewExam) return { correctAnswerRevealed: false, order: null, optionOrders: {} };
    return getReviewSession(exam.id, username);
  }, [exam, isReviewExam, username, sessionTick]);

  const orderedQuestions = useMemo(() => {
    if (!exam) return [];
    if (!isReviewExam) return questions;
    return getOrderedReviewQuestions(questions, reviewSession);
  }, [exam, isReviewExam, questions, reviewSession]);

  const currentQuestion = orderedQuestions[currentIndex];

  useEffect(() => {
    if (!isReviewExam || !exam || !currentQuestion?.options?.length) return;

    const session = getReviewSession(exam.id, username);
    const key = String(currentQuestion.id);
    if (session.optionOrders?.[key]?.length === currentQuestion.options.length) {
      return;
    }

    ensureReviewOptionOrder(exam.id, username, currentQuestion.id, currentQuestion.options.length);
    setSessionTick((tick) => tick + 1);
  }, [isReviewExam, exam, currentQuestion?.id, currentQuestion?.options?.length, username]);

  const currentDisplayOptions = useMemo(() => {
    if (!currentQuestion?.options?.length || !exam) return [];
    const permutation = reviewSession.optionOrders?.[String(currentQuestion.id)];
    return buildDisplayOptions(currentQuestion.options, permutation);
  }, [currentQuestion, exam, reviewSession]);

  const displayCorrectAnswers = useMemo(
    () => mapCorrectAnswersToDisplay(currentQuestion, currentDisplayOptions),
    [currentQuestion, currentDisplayOptions],
  );

  const showCorrectAnswer = isReviewExam && canViewExamAnswers(user);
  const correctAnswerRevealed = isReviewExam
    ? isReviewCorrectAnswerRevealed(reviewSession)
    : false;

  useEffect(() => {
    if (currentIndex >= orderedQuestions.length && orderedQuestions.length > 0) {
      setCurrentIndex(orderedQuestions.length - 1);
    }
  }, [orderedQuestions.length, currentIndex]);

  useEffect(() => {
    if (!apiExamId || !showCorrectAnswer || !correctAnswerRevealed) {
      return undefined;
    }

    const question = orderedQuestions[currentIndex];
    if (!question) {
      return undefined;
    }

    let cancelled = false;

    async function fetchCorrectAnswer() {
      try {
        const answered = await loadQuestionWithAnswer(apiExamId, question.id);
        if (cancelled || !answered) return;

        setQuestions((prev) =>
          prev.map((item) => (item.id === answered.id ? answered : item)),
        );
      } catch {
        /* keep public question shape */
      }
    }

    fetchCorrectAnswer();
    return () => {
      cancelled = true;
    };
  }, [
    apiExamId,
    orderedQuestions,
    currentIndex,
    correctAnswerRevealed,
    showCorrectAnswer,
  ]);

  if (scope === "community" && !isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${pathname}${search}` }}
        replace
      />
    );
  }

  if (!examReady) {
    return (
      <div className={styles.page}>
        <p>Đang tải đề thi...</p>
      </div>
    );
  }

  if (!exam) {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (isReviewExam && orderedQuestions.length === 0) {
    return (
      <div className={styles.page}>
        <p>
          Không tải được câu hỏi từ hệ thống. Hãy mở đề thi đã được Admin xuất bản (có mã đề khớp
          API) hoặc thử tải lại trang.
        </p>
        <Link to={`${config.detailBase}/${exam.courseCode}`} className={styles.back}>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex >= orderedQuestions.length - 1;
  const isPracticeExam = page === "practice";
  const isDocumentsRoute = page === "documents";
  const isDocumentPage = isDocumentsRoute && exam.document;
  const revealCorrectAnswer = showCorrectAnswer && correctAnswerRevealed;
  const canTakeExam = isReviewExam
    ? canTakeReviewExam(user)
    : isPracticeExam
      ? canSubmitPracticeExam(user)
      : false;
  const commentsLocked = !canCommentOnExamQuestion(user);
  const canStudyTools = canUseReviewStudyTools(user);
  const typeLabel = EXAM_TYPE_LABELS[page] ?? exam.type;
  const previewLabel = EXAM_PREVIEW_LABELS[page] ?? "Mục";
  const listPath = `${config.detailBase}/${exam.courseCode}`;
  const submittedSession = getExamSession(exam.id);
  const practiceSession = isPracticeExam && currentQuestion
    ? getPracticeSession(exam.id, currentQuestion.id)
    : null;
  const hasSubmittedResult = isPracticeExam
    ? Boolean(practiceSession?.submitted)
    : Boolean(submittedSession?.submitted);
  const practiceBrief = isPracticeExam && currentQuestion
    ? getPracticeBrief(exam.id, currentIndex + 1, exam.courseCode, currentQuestion.text)
    : null;
  const resolvedApiExamId = apiExamId ?? exam.apiId ?? null;

  function bumpReviewSession() {
    setSessionTick((tick) => tick + 1);
  }

  function handleShuffleQuestions() {
    if (!requirePremium()) return;
    if (orderedQuestions.length < 2) {
      showToast("Cần ít nhất 2 câu để xáo thứ tự.");
      return;
    }
    shuffleReviewQuestions(
      exam.id,
      username,
      orderedQuestions.map((question) => question.id),
    );
    bumpReviewSession();
    setCurrentIndex(0);
    showToast("Đã xáo thứ tự câu hỏi trong phiên ôn tập.");
  }

  function handleToggleCorrectAnswer() {
    if (!requirePremium()) return;
    toggleReviewCorrectAnswerReveal(exam.id, username);
    bumpReviewSession();
    const willReveal = !isReviewCorrectAnswerRevealed(reviewSession);
    showToast(
      willReveal
        ? "Đã hiện đáp án đúng."
        : "Đã ẩn đáp án đúng — các lựa chọn vẫn hiển thị bình thường.",
    );
  }

  function goToPreviousQuestion() {
    if (isFirstQuestion) return;
    setCurrentIndex((index) => index - 1);
  }

  function goToNextQuestion() {
    if (isLastQuestion) return;
    setCurrentIndex((index) => index + 1);
  }

  function handleStartExam() {
    if (!isReviewExam && !isPracticeExam) return;
    if (!requirePremium()) return;

    if (isReviewExam) {
      navigate(getExamFocusDoPath(exam.courseCode, exam.id), { state: { scope } });
      return;
    }

    navigate(getPracticeDoPath(exam.courseCode, exam.id, currentIndex + 1, scope));
  }

  function handleViewResult() {
    if (isPracticeExam) {
      navigate(getPracticeResultPath(exam.courseCode, exam.id, currentIndex + 1, scope));
      return;
    }
    navigate(getExamResultPath(exam.courseCode, exam.id, scope));
  }

  return (
    <div className={styles.page}>
      <Link to={listPath} className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại
      </Link>

      {!isDocumentPage ? (
        <section className={styles["info-card"]} aria-label="Thông tin đề thi">
          <h2 className={styles["info-title"]}>Thông tin đề thi</h2>
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
              <dt>Tổng số câu</dt>
              <dd>{exam.questionCount}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {!isDocumentsRoute && resolvedApiExamId && (exam.attachments?.length ?? 0) > 0 ? (
        <ExamAttachmentViewer examApiId={resolvedApiExamId} attachments={exam.attachments} />
      ) : null}

      {!isDocumentsRoute && resolvedApiExamId && (exam.attachments?.length ?? 0) === 0 ? (
        <section className={styles["info-card"]} aria-label="File đề gốc">
          <h2 className={styles["info-title"]}>File đề gốc</h2>
          <p className={styles.subtitle}>Đề này chưa có file đính kèm trên Drive.</p>
        </section>
      ) : null}

      {isDocumentPage ? (
        <>
          <section className={styles["info-card"]} aria-label="Thông tin tài liệu">
            <h2 className={styles["info-title"]}>Thông tin tài liệu</h2>
            <dl className={styles["info-grid"]}>
              <div className={styles["info-item"]}>
                <dt>Tên file</dt>
                <dd>{exam.document.name}</dd>
              </div>
              <div className={styles["info-item"]}>
                <dt>Môn học</dt>
                <dd>{exam.courseCode}</dd>
              </div>
            </dl>
          </section>
          <StudentDocumentViewer document={exam.document} />
        </>
      ) : isDocumentsRoute ? (
        <section className={styles["info-card"]} aria-label="Tài liệu không tìm thấy">
          <p className={styles.subtitle}>Không tìm thấy file tài liệu này.</p>
        </section>
      ) : null}

      {isPracticeExam && scope === "home" ? (
        <PracticeExamSubmitPanel
          courseCode={exam.courseCode}
          examId={exam.id}
          examTitle={exam.id}
        />
      ) : null}

      {!isDocumentsRoute ? (
      <section className={styles["exam-panel"]} aria-label="Xem trước đề thi">
        <header className={styles["panel-header"]}>
          <div className={styles["panel-heading"]}>
            <h2 className={styles["exam-code"]}>{exam.id}</h2>
            {isReviewExam && <p className={styles.subtitle}>Luyện tập câu hỏi lẻ</p>}
            {isPracticeExam && (
              <p className={styles.subtitle}>
                Mỗi bài 85 phút · Làm trên IDE ngoài · Nộp file hoặc GitHub
              </p>
            )}
          </div>
          <div className={styles["panel-actions"]}>
            {hasSubmittedResult && canTakeExam && (
              <button type="button" className={styles["result-btn"]} onClick={handleViewResult}>
                Xem kết quả
              </button>
            )}
            {isReviewExam || isPracticeExam ? (
              <button
                type="button"
                className={`${styles["start-btn"]} ${canTakeExam && !hasSubmittedResult ? styles["start-btn-active"] : ""}`}
                onClick={handleStartExam}
                disabled={isPracticeExam && hasSubmittedResult}
              >
                <FontAwesomeIcon icon={canTakeExam ? faPlay : faLock} />
                {hasSubmittedResult && isPracticeExam
                  ? "Đã nộp bài này"
                  : canTakeExam
                    ? "Bắt đầu làm bài"
                    : !isAuthenticated
                      ? "Đăng nhập để làm bài"
                      : "Premium để làm bài"}
              </button>
            ) : (
              <button type="button" className={styles["start-btn"]} disabled>
                Bắt đầu làm bài
              </button>
            )}
          </div>
        </header>

        <div className={styles.workspace}>
          <div className={styles["main-column"]}>
            <article className={styles["question-card"]}>
              {!isReviewExam && currentQuestion && (
                <p className={styles["preview-label"]}>
                  {previewLabel} {currentIndex + 1}
                </p>
              )}
              {isReviewExam && currentQuestion && (
                <p className={styles["preview-label"]}>
                  Câu {currentQuestion.id} · {currentIndex + 1}/{orderedQuestions.length}
                  {correctAnswerRevealed ? " · Đáp án đã hiện" : ""}
                </p>
              )}
              <h3 className={styles["question-text"]}>{currentQuestion?.text}</h3>
              {currentQuestion?.questionType === "MultiSelect" && currentQuestion?.requiredSelectCount ? (
                <p className={styles["multi-hint"]}>
                  Chọn đúng {currentQuestion.requiredSelectCount} đáp án.
                </p>
              ) : null}

              {isPracticeExam && practiceBrief ? (
                <PracticeBriefPanel
                  brief={practiceBrief}
                  canDownload={canTakeExam}
                  compact
                  onDownloadBlocked={() => requirePremium()}
                />
              ) : null}

              {isReviewExam && currentDisplayOptions.length > 0 && (
                <ul className={styles.options}>
                  {currentDisplayOptions.map((option) => {
                    const isCorrect =
                      revealCorrectAnswer && displayCorrectAnswers.includes(option.key);

                    return (
                      <li key={option.optionId ?? option.key}>
                        <div
                          className={`${styles.option} ${isCorrect ? styles["option-correct"] : ""}`}
                        >
                          <span className={styles["option-key"]}>{option.key}</span>
                          <span className={styles["option-label"]}>{option.label}</span>
                          {isCorrect && (
                            <FontAwesomeIcon icon={faCheck} className={styles["option-check"]} />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {isReviewExam && !showCorrectAnswer && (
                <p className={styles["answer-hint"]}>
                  <FontAwesomeIcon icon={faLock} className={styles["answer-hint-icon"]} />
                  {!isAuthenticated
                    ? "Khách và tài khoản Basic xem câu hỏi — không hiển thị đáp án đúng."
                    : "Tài khoản Basic xem câu hỏi và lựa chọn — đáp án đúng chỉ dành cho Premium."}
                  {" "}
                  Bạn vẫn có thể dùng AI giải thích (10 token/ngày) bên dưới khi đã đăng nhập.
                </p>
              )}

              <footer className={styles["question-toolbar"]}>
                <div className={styles["toolbar-left"]}>
                  <button
                    type="button"
                    className={`${styles["tool-btn"]} ${canStudyTools ? styles["tool-btn-clickable"] : ""}`}
                    disabled={!canStudyTools || !currentQuestion || orderedQuestions.length < 2}
                    aria-label="Xáo thứ tự câu hỏi"
                    title={
                      canStudyTools
                        ? "Xáo thứ tự câu hỏi trong phiên ôn tập (Premium)"
                        : "Premium để xáo câu hỏi"
                    }
                    onClick={handleShuffleQuestions}
                  >
                    <FontAwesomeIcon icon={faShuffle} />
                  </button>
                  {isReviewExam ? (
                    <ExamQuestionReportButton
                      className={`${styles["tool-btn"]} ${styles["tool-btn-active"]}`}
                      examId={exam.id}
                      courseCode={exam.courseCode}
                      questionIndex={currentQuestion?.id ?? currentIndex + 1}
                      question={currentQuestion}
                    />
                  ) : (
                    <button type="button" className={styles["tool-btn"]} disabled aria-label="Bình luận câu hỏi">
                      <FontAwesomeIcon icon={faComment} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles["tool-btn"]} ${canStudyTools ? styles["tool-btn-clickable"] : ""} ${correctAnswerRevealed ? styles["tool-btn-answers-revealed"] : ""}`}
                    disabled={!canStudyTools}
                    aria-label={correctAnswerRevealed ? "Ẩn đáp án đúng" : "Hiện đáp án đúng"}
                    aria-pressed={correctAnswerRevealed}
                    title={
                      canStudyTools
                        ? correctAnswerRevealed
                          ? "Ẩn đáp án đúng — xem lại các lựa chọn bình thường"
                          : "Hiện đáp án đúng sau khi tự suy nghĩ (Premium)"
                        : "Premium để hiện đáp án đúng"
                    }
                    onClick={handleToggleCorrectAnswer}
                  >
                    <FontAwesomeIcon icon={correctAnswerRevealed ? faEyeSlash : faEye} />
                  </button>
                </div>

                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles["page-btn"]}
                    onClick={goToPreviousQuestion}
                    disabled={isFirstQuestion || !currentQuestion}
                    aria-label="Câu trước"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <span className={styles["page-indicator"]}>
                    {currentIndex + 1} / {orderedQuestions.length}
                  </span>
                  <button
                    type="button"
                    className={styles["page-btn"]}
                    onClick={goToNextQuestion}
                    disabled={isLastQuestion || !currentQuestion}
                    aria-label="Câu sau"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>

                <button
                  type="button"
                  className={`${styles["tool-btn"]} ${styles["toolbar-muted"]}`}
                  disabled
                  aria-label="Toàn màn hình"
                >
                  <FontAwesomeIcon icon={faExpand} />
                </button>
              </footer>
            </article>

            {isReviewExam && currentQuestion && (
              <ExamAiExplanation
                examId={apiExamId ?? exam.id}
                question={currentQuestion}
              />
            )}
          </div>

          {isReviewExam && currentQuestion && (
            <ExamCommentsPanel
              locked={commentsLocked}
              reason={!isAuthenticated ? "guest" : "premium"}
              examId={exam.id}
              questionId={currentQuestion.id}
              questionLabel={`Câu ${currentIndex + 1}`}
            />
          )}
        </div>
      </section>
      ) : null}

      {!isDocumentsRoute ? (
      <section className={styles.related} aria-label="Related Exams">
        <h2 className={styles["related-title"]}>Related Exams</h2>
        <p className={styles["related-empty"]}>Không có đề thi liên quan</p>
      </section>
      ) : null}
    </div>
  );
}

export default ExamDetailPage;
