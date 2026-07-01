import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faChartColumn,
  faCheck,
  faCircleCheck,
  faClock,
  faDownload,
  faRotateRight,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
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

function ReviewQuestionCard({ item, index, onOpenExplanation }) {
  const isCorrect = item.isCorrect;
  const hasAnswer = Boolean(item.selectedAnswer || item.selectedAnswers?.length);
  const status = !hasAnswer ? "empty" : isCorrect ? "correct" : "wrong";

  return (
    <details
      className={`${styles["review-question"]} ${styles[`review-question-${status}`]}`}
    >
      <summary className={styles["review-question-summary"]}>
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
      </summary>

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

        <button
          type="button"
          className={styles["review-explain-link"]}
          onClick={() => onOpenExplanation(index)}
        >
          <FontAwesomeIcon icon={faWandMagicSparkles} />
          Xem giải thích chi tiết
        </button>
      </div>
    </details>
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
  const { showToast } = useToast();
  const [showDetail, setShowDetail] = useState(false);
  const isReviewFocusMode = page === "review" && isExamFocusPath(pathname);
  const scope = resolveExamScope(pathname, locationState);
  const config = getSubjectDetailConfig(page, scope);
  const isPracticeExam = page === "practice";
  const decodedExamId = decodeURIComponent(examId ?? "");
  const questionNumber = Math.max(1, Number(questionIndex) || 1);

  const [exam, setExam] = useState(null);
  const [examReady, setExamReady] = useState(false);

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
    return getExamSession(exam.id);
  }, [exam, isPracticeExam, question]);

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

  function handleOpenExplanation(questionIndex) {
    navigate(detailPath, { state: { questionIndex } });
  }

  function getQuestionStatus(item) {
    if (!item.selectedAnswer) return "empty";
    return item.isCorrect ? "correct" : "wrong";
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

  if (!isPracticeExam) {
    return (
      <div className={`${styles.page} ${styles.pageReview}`}>
        <Link to={detailPath} className={styles["review-back"]}>
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

        <section className={styles["review-questions"]} aria-label="Chi tiết từng câu hỏi">
          {result.items.map((item, index) => (
            <ReviewQuestionCard
              key={item.questionId}
              item={item}
              index={index}
              onOpenExplanation={handleOpenExplanation}
            />
          ))}
        </section>

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
