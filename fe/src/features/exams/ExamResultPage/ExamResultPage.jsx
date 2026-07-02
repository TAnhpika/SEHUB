import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faChartColumn,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faClock,
  faDownload,
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import ExamAiExplanation from "@/features/exams/ExamAiExplanation/ExamAiExplanation";
import ExamQuestionReportButton from "@/features/exams/ExamQuestionReportButton/ExamQuestionReportButton";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  getMockPeerComparison,
  getPassStatus,
  getScoreGrade,
  getScoreOnTen,
} from "@/features/exams/examResultInsights";
import { buildExamQuestions, EXAM_USE_MOCK, loadExamMeta } from "@/features/exams/examDetailData";
import {
  clearExamSession,
  createExamSession,
  formatDuration,
  getExamSession,
  getScoreFeedback,
} from "@/features/exams/examSession";
import {
  clearPracticeSession,
  createPracticeSession,
  getPracticeSession,
} from "@/features/exams/practiceSession";
import {
  getExamById,
  getSubjectDetailConfig,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import { resolveExamTermFromCode } from "@/features/exams/finalExam/examTermOptions";
import {
  getExamDetailPath,
  getExamFocusDoPath,
  getPracticeDoPath,
  isExamFocusPath,
  resolveExamScope,
} from "@/utils/examFocusPaths";
import { loadHistoryExamSession } from "@/features/exams/myLearning/examResultHistory";
import { getMyLearningPath } from "@/features/exams/myLearning/myLearningPaths";
import styles from "./ExamResultPage.module.css";

function getReviewExamTitle(exam) {
  const resolved = resolveExamTermFromCode(exam.id ?? exam.paperCode ?? exam.title);
  const termLabel = exam.termLabel ?? resolved?.termLabel;
  const year = exam.year ?? resolved?.year;

  if (termLabel && year) {
    return `${termLabel} ${year} Final Examination`;
  }

  return exam.title ?? exam.id ?? "Final Examination";
}

function getReviewAccuracyPercent(correctCount, total) {
  if (!total) return 0;
  return Math.round((correctCount / total) * 1000) / 10;
}

function getReviewScoreOnTen(correctCount, total) {
  if (!total) return "0.00";
  return ((correctCount / total) * 10).toFixed(2);
}

function getOptionReviewState(item, optionKey) {
  const correctKeys = item.correctAnswers?.length
    ? item.correctAnswers
    : item.correctAnswer
      ? String(item.correctAnswer)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
  const selectedKeys = item.selectedAnswers?.length
    ? item.selectedAnswers
    : item.selectedAnswer
      ? String(item.selectedAnswer)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

  const isCorrect = correctKeys.includes(optionKey);
  const isSelected = selectedKeys.includes(optionKey);

  if (isCorrect && isSelected) return "correct-selected";
  if (isCorrect) return "correct";
  if (isSelected) return "wrong";
  return "neutral";
}

function getQuestionReviewStatus(item) {
  const hasAnswer = Boolean(item.selectedAnswer || item.selectedAnswers?.length);
  if (!hasAnswer) return "empty";
  return item.isCorrect ? "correct" : "wrong";
}

function getAllReviewEntries(items) {
  return items.map((item, index) => ({ item, index }));
}

function ReviewQuestionsSidebar({ entries, activeIndex, onSelect }) {
  if (entries.length === 0) {
    return null;
  }

  const correctCount = entries.filter(({ item }) => getQuestionReviewStatus(item) === "correct").length;
  const wrongCount = entries.filter(({ item }) => getQuestionReviewStatus(item) === "wrong").length;
  const emptyCount = entries.length - correctCount - wrongCount;

  const statusLabel = (status) => {
    if (status === "correct") return "Đúng";
    if (status === "wrong") return "Sai";
    return "Chưa trả lời";
  };

  return (
    <aside className={styles.reviewSidebar} aria-label="Danh sách câu hỏi">
      <div className={styles.reviewSidebarHead}>
        <h2 className={styles.reviewSidebarTitle}>Danh sách câu</h2>
        <p className={styles.reviewSidebarMeta}>
          {correctCount > 0 ? `${correctCount} đúng` : null}
          {correctCount > 0 && wrongCount > 0 ? " · " : null}
          {wrongCount > 0 ? `${wrongCount} sai` : null}
          {(correctCount > 0 || wrongCount > 0) && emptyCount > 0 ? " · " : null}
          {emptyCount > 0 ? `${emptyCount} chưa trả lời` : null}
        </p>
        <p className={styles.reviewSidebarHint}>Nhấn số câu để xem chi tiết</p>
      </div>

      <div className={styles.reviewSidebarGrid}>
        {entries.map(({ item, index }) => {
          const status = getQuestionReviewStatus(item);
          return (
            <button
              key={item.questionId}
              type="button"
              className={`${styles.reviewSidebarCell} ${styles[`reviewSidebarCell-${status}`]} ${
                activeIndex === index ? styles.reviewSidebarCellActive : ""
              }`}
              title={`Câu ${index + 1}: ${statusLabel(status)}`}
              onClick={() => onSelect(index)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ReviewQuestionCard({
  item,
  index,
  examId,
  courseCode,
  total,
  isFirst,
  isLast,
  onPrevious,
  onNext,
}) {
  const status = getQuestionReviewStatus(item);
  const isCorrect = item.isCorrect;
  const hasAnswer = status !== "empty";
  const questionForAi = {
    id: item.questionId,
    text: item.text,
    options: item.options ?? [],
  };

  return (
    <article className={`${styles["review-question"]} ${styles[`review-question-${status}`]}`}>
      <div className={styles["review-question-header"]}>
        <div className={styles["review-question-head"]}>
          <div className={styles["review-question-title-wrap"]}>
            <span
              className={`${styles["review-question-index"]} ${styles[`review-question-index-${status}`]}`}
            >
              {index + 1}
            </span>
            <RichTextContent
              value={item.text}
              className={styles["review-question-text"]}
            />
          </div>
          <div className={styles.reviewQuestionActions}>
            <ExamQuestionReportButton
              className={`${styles.reviewReportBtn} ${styles.reviewReportBtnActive}`}
              examId={examId}
              courseCode={courseCode}
              questionIndex={index + 1}
              question={questionForAi}
            />
            <span
              className={`${styles["review-status-badge"]} ${
                !hasAnswer
                  ? styles["review-status-empty"]
                  : isCorrect
                    ? styles["review-status-correct"]
                    : styles["review-status-wrong"]
              }`}
            >
              <FontAwesomeIcon icon={!hasAnswer ? faClock : isCorrect ? faCheck : faXmark} />
              {!hasAnswer ? "CHƯA TRẢ LỜI" : isCorrect ? "CHÍNH XÁC" : "CHƯA ĐÚNG"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles["review-question-body"]}>
        <ul className={styles["review-options"]}>
          {(item.options ?? []).map((option) => {
            const optionState = getOptionReviewState(item, option.key);
            return (
              <li
                key={option.key}
                className={`${styles["review-option"]} ${styles[`review-option-${optionState}`]}`}
              >
                <span className={styles["review-option-key"]}>{option.key}</span>
                <div className={styles["review-option-body"]}>
                  <span className={styles["review-option-label"]}>{option.label}</span>
                  {optionState === "wrong" && (
                    <span className={styles["review-option-tag-wrong"]}>LỰA CHỌN CỦA BẠN</span>
                  )}
                  {optionState === "correct" && (
                    <span className={styles["review-option-tag-correct"]}>ĐÁP ÁN ĐÚNG</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <ExamAiExplanation key={item.questionId} examId={examId} question={questionForAi} />

        <div className={styles.reviewPagination}>
          <button
            type="button"
            className={styles.reviewPageBtn}
            onClick={onPrevious}
            disabled={isFirst}
            aria-label="Câu trước"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            <span>Câu trước</span>
          </button>
          <span className={styles.reviewPageIndicator}>
            {index + 1} / {total}
          </span>
          <button
            type="button"
            className={styles.reviewPageBtn}
            onClick={onNext}
            disabled={isLast}
            aria-label="Câu sau"
          >
            <span>Câu sau</span>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </article>
  );
}

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
  const { courseCode, examId, questionIndex } = useParams();
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [showDetail, setShowDetail] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const isReviewFocusMode = page === "review" && isExamFocusPath(pathname);
  const scope = resolveExamScope(pathname, locationState);
  const config = getSubjectDetailConfig(page, scope);
  const isPracticeExam = page === "practice";
  const decodedExamId = decodeURIComponent(examId ?? "");
  const questionNumber = Math.max(1, Number(questionIndex) || 1);
  const historyAttemptId = searchParams.get("attemptId");

  const [exam, setExam] = useState(null);
  const [examReady, setExamReady] = useState(false);
  const [remoteSession, setRemoteSession] = useState(null);
  const [remoteSessionState, setRemoteSessionState] = useState("idle");

  useEffect(() => {
    let cancelled = false;

    async function fetchExam() {
      setExamReady(false);
      if (EXAM_USE_MOCK) {
        const mockExam = getExamById(courseCode, decodedExamId, page, scope);
        if (mockExam) {
          if (!cancelled) {
            setExam(mockExam);
            setExamReady(true);
          }
          return;
        }
      }

      try {
        const meta = await loadExamMeta(courseCode, decodedExamId, page, scope);
        if (!cancelled) {
          setExam(meta?.exam ?? null);
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

  const questions = useMemo(
    () => (exam ? buildExamQuestions(exam.questionCount, page) : []),
    [exam, page],
  );

  const question = isPracticeExam ? questions[questionNumber - 1] : null;

  const session = useMemo(() => {
    if (!exam) return null;
    if (isPracticeExam) {
      return question ? getPracticeSession(exam.id, question.id) : null;
    }

    const localSession = getExamSession(exam.id);
    if (localSession?.submitted && localSession.result) {
      return localSession;
    }

    return remoteSession;
  }, [exam, isPracticeExam, question, remoteSession]);

  useEffect(() => {
    if (isPracticeExam || !historyAttemptId || !exam?.apiId) {
      return undefined;
    }

    const localSession = getExamSession(exam.id);
    if (localSession?.submitted && localSession.result) {
      return undefined;
    }

    let cancelled = false;

    async function fetchHistorySession() {
      setRemoteSessionState("loading");
      setRemoteSession(null);

      try {
        const loaded = await loadHistoryExamSession(exam.apiId, historyAttemptId);
        if (!cancelled) {
          setRemoteSession(loaded);
          setRemoteSessionState("ready");
        }
      } catch {
        if (!cancelled) {
          setRemoteSessionState("error");
        }
      }
    }

    fetchHistorySession();
    return () => {
      cancelled = true;
    };
  }, [exam?.apiId, exam?.id, historyAttemptId, isPracticeExam]);

  useEffect(() => {
    if (!isReviewFocusMode || !exam) return;
    document.title = `Kết quả — ${exam.id} | SEHUB`;
    return () => {
      document.title = "SEHUB";
    };
  }, [isReviewFocusMode, exam]);

  if (page !== "review" && page !== "practice") {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (!examReady) {
    return (
      <div
        className={isReviewFocusMode ? styles.loadingShellFocus : styles.loadingShell}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className={styles.loading}>
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.loadingText}>Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (isPracticeExam && !question) {
    return (
      <Navigate
        to={getExamDetailPath(exam.courseCode, exam.id, scope, "practice")}
        replace
      />
    );
  }

  if (historyAttemptId && !isPracticeExam && remoteSessionState === "loading") {
    return (
      <div
        className={isReviewFocusMode ? styles.loadingShellFocus : styles.loadingShell}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className={styles.loading}>
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.loadingText}>Đang tải kết quả từ lịch sử...</p>
        </div>
      </div>
    );
  }

  if (historyAttemptId && !isPracticeExam && remoteSessionState === "error") {
    return (
      <div className={styles.loadingShell}>
        <div className={styles.loading}>
          <p className={styles.loadingText}>Không tải được kết quả bài làm này.</p>
          <Button to={getMyLearningPath("exams")} look="outline" size="sm">
            Quay lại lịch sử học tập
          </Button>
        </div>
      </div>
    );
  }

  if (!session?.submitted || !session.result) {
    const fallbackPath = isPracticeExam
      ? getPracticeDoPath(exam.courseCode, exam.id, questionNumber, scope)
      : getExamFocusDoPath(exam.courseCode, exam.id);
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={!isPracticeExam ? { scope } : undefined}
      />
    );
  }

  const { result, startedAt, submittedAt, submission } = session;
  const detailPath = getExamDetailPath(
    exam.courseCode,
    exam.id,
    scope,
    isPracticeExam ? "practice" : "review",
  );
  const doPath = isPracticeExam
    ? getPracticeDoPath(exam.courseCode, exam.id, questionNumber, scope)
    : getExamFocusDoPath(exam.courseCode, exam.id);
  const durationMs = submittedAt - startedAt;
  const feedback = getScoreFeedback(result.scorePercent);
  const grade = getScoreGrade(result.scorePercent);
  const scoreOnTen = getScoreOnTen(result.correctCount, result.total);
  const passStatus = getPassStatus(scoreOnTen);
  const peer = getMockPeerComparison(result.scorePercent);

  const correctPercent = Math.round((result.correctCount / result.total) * 100);
  const wrongPercent = Math.round((result.wrongCount / result.total) * 100);
  const emptyPercent = Math.round((result.unansweredCount / result.total) * 100);
  const wrongItems = result.items.filter((item) => item.selectedAnswer && !item.isCorrect);
  const emptyItems = result.items.filter((item) => !item.selectedAnswer);

  function handleRetry() {
    if (isPracticeExam && question) {
      clearPracticeSession(exam.id, question.id);
      createPracticeSession(exam.id, question.id);
    } else {
      clearExamSession(exam.id);
      createExamSession(exam.id);
    }
    navigate(doPath, !isPracticeExam ? { state: { scope } } : undefined);
  }

  function handleExportReport() {
    const lines = [
      `Kết quả kỳ thi — ${exam.id}`,
      getReviewExamTitle(exam),
      `Tổng số câu hỏi: ${result.total}`,
      `Điểm: ${getReviewScoreOnTen(result.correctCount, result.total)} (${grade.label})`,
      `Đúng: ${result.correctCount} · Sai: ${result.total - result.correctCount}`,
      "",
      ...result.items.map((item, index) => {
        const mark = item.isCorrect ? "Đúng" : "Sai";
        return `Câu ${index + 1} [${mark}]: ${item.text}`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exam.id}-ket-qua.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Đã xuất báo cáo kết quả.");
  }

  function handleSelectReviewQuestion(index) {
    setCurrentReviewIndex(index);
  }

  function handlePreviousReviewQuestion() {
    setCurrentReviewIndex((current) => Math.max(0, current - 1));
  }

  function handleNextReviewQuestion() {
    setCurrentReviewIndex((current) => Math.min(result.items.length - 1, current + 1));
  }

  function getQuestionStatus(item) {
    return getQuestionReviewStatus(item);
  }

  const unitSingular = isPracticeExam ? "bài" : "câu";
  const correctLabel = isPracticeExam ? "Hoàn thành" : "Câu đúng";
  const wrongLabel = isPracticeExam ? "Chưa đạt" : "Câu sai";
  const emptyLabel = isPracticeExam ? "Chưa làm" : "Bỏ trống";
  const explorePath = isPracticeExam
    ? `${scope === "home" ? "/home" : "/community"}/pratical-exam`
    : `${scope === "home" ? "/home" : "/community"}/final-exam`;
  const subjectPath = `${config.detailBase}/${exam.courseCode}`;
  const reviewWrongCount = result.wrongCount;
  const reviewUnansweredCount = result.unansweredCount;
  const reviewAccuracy = getReviewAccuracyPercent(result.correctCount, result.total);
  const reviewQuestionEntries = getAllReviewEntries(result.items);

  if (!isPracticeExam) {
    return (
      <div className={`${styles.page} ${styles.pageReview}`}>
        <Link to={detailPath} className={styles.back}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Quay lại
        </Link>

        <header className={styles["review-header"]}>
          <h1 className={styles["review-title"]}>Kết quả kỳ thi</h1>
          <nav className={styles["review-breadcrumbs"]} aria-label="Breadcrumb">
            <Link to={explorePath}>Môn học</Link>
            <span aria-hidden="true">/</span>
            <Link to={subjectPath}>{exam.courseCode}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Kết quả thi cuối kỳ</span>
          </nav>
        </header>

        <section className={styles["review-summary"]} aria-label="Tổng quan kết quả">
          <div className={styles["review-summary-top"]}>
            <div className={styles["review-summary-info"]}>
              <span className={styles["review-exam-code"]}>MÃ ĐỀ THI: {exam.id}</span>
              <h2 className={styles["review-exam-title"]}>{getReviewExamTitle(exam)}</h2>
              <p className={styles["review-exam-meta"]}>Tổng số câu hỏi: {result.total}</p>
            </div>
            <button
              type="button"
              className={styles["review-export-btn"]}
              onClick={handleExportReport}
            >
              <FontAwesomeIcon icon={faDownload} />
              Xuất báo cáo
            </button>
          </div>

          <div className={styles["review-metrics"]}>
            <article className={`${styles["review-metric"]} ${styles["review-metric-score"]}`}>
              <p className={styles["review-metric-label"]}>ĐIỂM SỐ</p>
              <p className={styles["review-metric-value"]}>
                {getReviewScoreOnTen(result.correctCount, result.total)}
              </p>
              <p className={styles["review-metric-sub"]}>Xếp loại: {grade.label}</p>
            </article>
            <article className={`${styles["review-metric"]} ${styles["review-metric-correct"]}`}>
              <p className={styles["review-metric-label"]}>ĐÚNG</p>
              <p className={styles["review-metric-value"]}>{result.correctCount}</p>
              <p className={styles["review-metric-sub"]}>Độ chính xác {reviewAccuracy}%</p>
            </article>
            <article className={`${styles["review-metric"]} ${styles["review-metric-wrong"]}`}>
              <p className={styles["review-metric-label"]}>SAI</p>
              <p className={styles["review-metric-value"]}>{reviewWrongCount}</p>
              <p className={styles["review-metric-sub"]}>
                {reviewUnansweredCount > 0
                  ? `Gồm ${reviewUnansweredCount} câu chưa trả lời`
                  : "Cần ôn tập lại"}
              </p>
            </article>
          </div>
        </section>

        <div className={styles.reviewLayout}>
          <section className={styles["review-questions"]} aria-label="Chi tiết từng câu hỏi">
            <ReviewQuestionCard
              key={result.items[currentReviewIndex].questionId}
              item={result.items[currentReviewIndex]}
              index={currentReviewIndex}
              examId={exam.id}
              courseCode={exam.courseCode}
              total={result.total}
              isFirst={currentReviewIndex === 0}
              isLast={currentReviewIndex === result.items.length - 1}
              onPrevious={handlePreviousReviewQuestion}
              onNext={handleNextReviewQuestion}
            />
          </section>

          <ReviewQuestionsSidebar
            entries={reviewQuestionEntries}
            activeIndex={currentReviewIndex}
            onSelect={handleSelectReviewQuestion}
          />
        </div>

        <section className={styles.actions} aria-label="Hành động">
          <Button onClick={handleRetry}>
            <FontAwesomeIcon icon={faRotateRight} />
            Làm lại
          </Button>
          <Button look="outline" to={detailPath}>
            <FontAwesomeIcon icon={faBookOpen} />
            Xem lại đề thi
          </Button>
          <Button look="soft" to={explorePath}>
            Khám phá đề khác
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${isReviewFocusMode ? styles.pageFocus : ""}`}>
      <Link to={detailPath} className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        {isPracticeExam ? "Quay lại bài thực hành" : "Quay lại đề thi"}
      </Link>

      <section className={styles.summary} aria-label="Kết quả làm bài">
        <header className={styles["summary-head"]}>
          <div className={styles["summary-title-wrap"]}>
            <span className={styles["summary-icon"]} aria-hidden="true">
              <FontAwesomeIcon icon={faChartColumn} />
            </span>
            <div>
              <h1 className={styles.title}>Thống kê kết quả</h1>
              <p className={styles.subtitle}>
                Mã đề {exam.id}
                {isPracticeExam ? ` · Bài thực hành ${questionNumber}` : ""}
              </p>
            </div>
          </div>
          <span
            className={`${styles["pass-badge"]} ${
              passStatus === "pass" ? styles["pass-badge-pass"] : styles["pass-badge-fail"]
            }`}
          >
            <FontAwesomeIcon icon={passStatus === "pass" ? faCircleCheck : faXmark} />
            {passStatus === "pass" ? "Đạt yêu cầu" : "Chưa đạt"}
          </span>
        </header>

        <div className={styles["summary-body"]}>
          <div className={styles["score-panel"]}>
            <ScoreRing percent={result.scorePercent} grade={grade.label} />
            <p className={styles["score-ten"]}>
              <strong>{scoreOnTen}</strong>
              <span>/10 điểm</span>
            </p>
            <p className={styles["score-caption"]}>
              {result.correctCount}/{result.total}{" "}
              {isPracticeExam ? "bài hoàn thành" : "câu đúng"}
            </p>
          </div>

          <div className={styles["info-panel"]}>
            <dl className={styles["info-list"]}>
              <div className={styles["info-row"]}>
                <dt>Mã môn học</dt>
                <dd>{exam.courseCode}</dd>
              </div>
              <div className={styles["info-row"]}>
                <dt>Thời gian làm bài</dt>
                <dd>{formatDuration(durationMs)}</dd>
              </div>
              <div className={styles["info-row"]}>
                <dt>Đánh giá</dt>
                <dd>{feedback.label}</dd>
              </div>
              <div className={styles["info-row"]}>
                <dt>Nhận xét</dt>
                <dd>{feedback.message}</dd>
              </div>
              {isPracticeExam && submission && (
                <div className={styles["info-row"]}>
                  <dt>Hình thức nộp</dt>
                  <dd>
                    {submission.type === "github"
                      ? `GitHub: ${submission.value}`
                      : `File: ${submission.fileName}`}
                  </dd>
                </div>
              )}
            </dl>

            <p className={styles.insight}>
              {isPracticeExam
                ? "Bài nộp của bạn đang chờ hệ thống xử lý. Bạn có thể làm bài thực hành khác trong đề."
                : peer.message}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.stats} aria-label="Thống kê chi tiết">
        <h2 className={styles["section-title"]}>Thống kê chi tiết</h2>

        <div className={styles["stats-grid"]}>
          <article className={`${styles["stat-card"]} ${styles["stat-correct"]}`}>
            <span className={styles["stat-icon"]}>
              <FontAwesomeIcon icon={faCheck} />
            </span>
            <p className={styles["stat-value"]}>{result.correctCount}</p>
            <p className={styles["stat-label"]}>{correctLabel}</p>
          </article>
          <article className={`${styles["stat-card"]} ${styles["stat-wrong"]}`}>
            <span className={styles["stat-icon"]}>
              <FontAwesomeIcon icon={faXmark} />
            </span>
            <p className={styles["stat-value"]}>{result.wrongCount}</p>
            <p className={styles["stat-label"]}>{wrongLabel}</p>
          </article>
          <article className={`${styles["stat-card"]} ${styles["stat-empty"]}`}>
            <span className={styles["stat-icon"]}>—</span>
            <p className={styles["stat-value"]}>{result.unansweredCount}</p>
            <p className={styles["stat-label"]}>{emptyLabel}</p>
          </article>
          <article className={`${styles["stat-card"]} ${styles["stat-time"]}`}>
            <span className={styles["stat-icon"]}>
              <FontAwesomeIcon icon={faClock} />
            </span>
            <p className={styles["stat-value"]}>{formatDuration(durationMs)}</p>
            <p className={styles["stat-label"]}>Thời gian</p>
          </article>
        </div>

        <div className={styles["progress-wrap"]}>
          <div className={styles["progress-bar"]} aria-label="Tỷ lệ đúng, sai, bỏ trống">
            <span className={styles["progress-correct"]} style={{ width: `${correctPercent}%` }} />
            <span className={styles["progress-wrong"]} style={{ width: `${wrongPercent}%` }} />
            <span className={styles["progress-empty"]} style={{ width: `${emptyPercent}%` }} />
          </div>
          <div className={styles.legend}>
            <span>
              <i className={styles["legend-dot-correct"]} /> {correctLabel} {correctPercent}%
            </span>
            <span>
              <i className={styles["legend-dot-wrong"]} /> {wrongLabel} {wrongPercent}%
            </span>
            <span>
              <i className={styles["legend-dot-empty"]} /> {emptyLabel} {emptyPercent}%
            </span>
          </div>
        </div>
      </section>

      <section
        className={styles.map}
        aria-label={isPracticeExam ? "Bảng thống kê bài thực hành" : "Bảng thống kê câu hỏi"}
      >
        <div className={styles["map-head"]}>
          <h2 className={styles["section-title"]}>
            {isPracticeExam ? "Bảng thống kê bài thực hành" : "Bảng thống kê câu hỏi"}
          </h2>
          <p className={styles["map-meta"]}>
            Nhấn vào ô để xem trạng thái từng {unitSingular}
          </p>
        </div>
        <div className={styles["map-grid"]}>
          {result.items.map((item, index) => {
            const status = getQuestionStatus(item);
            const statusLabel =
              status === "correct"
                ? isPracticeExam
                  ? "Hoàn thành"
                  : "Đúng"
                : status === "wrong"
                  ? isPracticeExam
                    ? "Chưa đạt"
                    : "Sai"
                  : isPracticeExam
                    ? "Chưa làm"
                    : "Bỏ trống";
            return (
              <span
                key={item.questionId}
                className={`${styles["map-cell"]} ${styles[`map-cell-${status}`]}`}
                title={`${isPracticeExam ? "Bài" : "Câu"} ${index + 1}: ${statusLabel}`}
              >
                {index + 1}
              </span>
            );
          })}
        </div>
      </section>

      {(wrongItems.length > 0 || emptyItems.length > 0) && (
        <section
          className={styles.review}
          aria-label={isPracticeExam ? "Phân tích bài cần ôn" : "Phân tích câu cần ôn"}
        >
          <h2 className={styles["section-title"]}>
            {isPracticeExam ? "Phân tích bài cần ôn" : "Phân tích câu cần ôn"}
          </h2>

          {wrongItems.length > 0 && (
            <div className={styles["review-group"]}>
              <h3 className={styles["review-subtitle"]}>Câu trả lời sai ({wrongItems.length})</h3>
              <ul className={styles.list}>
                {wrongItems.map((item) => {
                  const index = result.items.findIndex((entry) => entry.questionId === item.questionId);
                  return (
                    <li key={item.questionId} className={styles.item}>
                      <div className={styles["item-head"]}>
                        <span className={styles["item-index"]}>Câu {index + 1}</span>
                        <span className={`${styles.badge} ${styles["badge-wrong"]}`}>Sai</span>
                      </div>
                      <p className={styles["item-text"]}>{item.text}</p>
                      <p className={styles["item-answer"]}>
                        Bạn chọn: <strong>{item.selectedAnswer}</strong> · Đáp án đúng:{" "}
                        <strong>{item.correctAnswer}</strong>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {emptyItems.length > 0 && (
            <div className={styles["review-group"]}>
              <h3 className={styles["review-subtitle"]}>
                {isPracticeExam ? "Bài chưa hoàn thành" : "Câu bỏ trống"} ({emptyItems.length})
              </h3>
              <ul className={styles.list}>
                {emptyItems.map((item) => {
                  const index = result.items.findIndex((entry) => entry.questionId === item.questionId);
                  return (
                    <li key={item.questionId} className={styles.item}>
                      <div className={styles["item-head"]}>
                        <span className={styles["item-index"]}>
                          {isPracticeExam ? "Bài" : "Câu"} {index + 1}
                        </span>
                        <span className={`${styles.badge} ${styles["badge-empty"]}`}>
                          {isPracticeExam ? "Chưa làm" : "Bỏ trống"}
                        </span>
                      </div>
                      <p className={styles["item-text"]}>{item.text}</p>
                      {isPracticeExam ? (
                        <p className={styles["item-answer"]}>
                          Chưa nộp bài cho bài thực hành này.
                        </p>
                      ) : (
                        <p className={styles["item-answer"]}>
                          Đáp án đúng: <strong>{item.correctAnswer}</strong>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className={styles.actions} aria-label="Hành động">
        <Button onClick={handleRetry}>
          <FontAwesomeIcon icon={faRotateRight} />
          Làm lại
        </Button>
        <Button look="outline" to={detailPath}>
          <FontAwesomeIcon icon={faBookOpen} />
          Xem lại đề thi
        </Button>
        <Button look="soft" to={explorePath}>
          {isPracticeExam ? "Khám phá bài thực hành khác" : "Khám phá đề khác"}
        </Button>
      </section>
    </div>
  );
}

export default ExamResultPage;
