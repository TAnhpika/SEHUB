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
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import {
  getMockPeerComparison,
  getPassStatus,
  getScoreGrade,
  getScoreOnTen,
} from "@/features/exams/examResultInsights";
import { buildExamQuestions } from "@/features/exams/examDetailData";
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
import {
  getExamDetailPath,
  getExamFocusDoPath,
  getPracticeFocusDoPath,
  isExamFocusPath,
  resolveExamScope,
} from "@/utils/examFocusPaths";
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
  const { courseCode, examId, questionIndex } = useParams();
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();
  const [showDetail, setShowDetail] = useState(false);
  const isFocusMode = isExamFocusPath(pathname);
  const scope = isFocusMode
    ? resolveExamScope(pathname, locationState)
    : pathname.startsWith("/home/")
      ? "home"
      : "community";
  const config = getSubjectDetailConfig(page, scope);
  const isPracticeExam = page === "practice";
  const decodedExamId = decodeURIComponent(examId ?? "");
  const questionNumber = Math.max(1, Number(questionIndex) || 1);

  const exam = useMemo(
    () => getExamById(courseCode, decodedExamId, page, scope),
    [courseCode, decodedExamId, page, scope],
  );

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
    if (!isFocusMode || !exam) return;
    document.title = `Kết quả — ${exam.id} | SEHUB`;
    return () => {
      document.title = "SEHUB";
    };
  }, [isFocusMode, exam]);

  if (page !== "review" && page !== "practice") {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
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
    const fallbackPath = isFocusMode
      ? isPracticeExam
        ? getPracticeFocusDoPath(exam.courseCode, exam.id, questionNumber)
        : getExamFocusDoPath(exam.courseCode, exam.id)
      : isPracticeExam
        ? getPracticeFocusDoPath(exam.courseCode, exam.id, questionNumber)
        : getExamDetailPath(exam.courseCode, exam.id, scope);
    return <Navigate to={fallbackPath} replace state={isFocusMode ? { scope } : undefined} />;
  }

  const { result, startedAt, submittedAt, submission } = session;
  const detailPath = getExamDetailPath(
    exam.courseCode,
    exam.id,
    scope,
    isPracticeExam ? "practice" : "review",
  );
  const doPath = isFocusMode
    ? isPracticeExam
      ? getPracticeFocusDoPath(exam.courseCode, exam.id, questionNumber)
      : getExamFocusDoPath(exam.courseCode, exam.id)
    : isPracticeExam
      ? getPracticeFocusDoPath(exam.courseCode, exam.id, questionNumber)
      : `${getExamDetailPath(exam.courseCode, exam.id, scope, "review")}/do`;
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
    navigate(doPath, isFocusMode ? { state: { scope } } : undefined);
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

  return (
    <div className={`${styles.page} ${isFocusMode ? styles.pageFocus : ""}`}>
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
