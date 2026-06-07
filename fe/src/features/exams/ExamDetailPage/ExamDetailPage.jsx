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
  faEyeSlash,
  faLock,
  faPlay,
  faShuffle,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useRequirePremium } from "@/hooks/useRequirePremium";
import ExamAiExplanation from "@/features/exams/ExamAiExplanation/ExamAiExplanation";
import ExamCommentsPanel from "@/features/exams/ExamCommentsPanel/ExamCommentsPanel";
import { getExamSession } from "@/features/exams/examSession";
import { getPracticeSession } from "@/features/exams/practiceSession";
import {
  buildExamQuestions,
  EXAM_PREVIEW_LABELS,
  EXAM_TYPE_LABELS,
} from "@/features/exams/examDetailData";
import StudentDocumentViewer from "@/features/documents/StudentDocumentViewer/StudentDocumentViewer";
import PracticeExamSubmitPanel from "@/features/exams/PracticeExamSubmitPanel/PracticeExamSubmitPanel";
import {
  getExamById,
  getSubjectDetailConfig,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import styles from "./ExamDetailPage.module.css";

function ExamDetailPage({ page }) {
  const { courseCode, examId } = useParams();
  const navigate = useNavigate();
  const { isPremium, isAuthenticated } = useAuth();
  const { requirePremium } = useRequirePremium();
  const { pathname } = useLocation();
  const scope = pathname.startsWith("/home/") ? "home" : "community";
  const config = getSubjectDetailConfig(page, scope);
  const decodedExamId = decodeURIComponent(examId ?? "");

  const exam = useMemo(
    () => getExamById(courseCode, decodedExamId, page, scope),
    [courseCode, decodedExamId, page, scope],
  );

  const questions = useMemo(
    () => (exam ? buildExamQuestions(exam.questionCount, page) : []),
    [exam, page],
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [decodedExamId]);

  if (!exam) {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isReviewExam = page === "review";
  const isPracticeExam = page === "practice";
  const isDocumentPage = page === "documents" && exam.document;
  const canUsePremiumFeatures = (isReviewExam || isPracticeExam) && isPremium;
  const typeLabel = EXAM_TYPE_LABELS[page] ?? exam.type;
  const previewLabel = EXAM_PREVIEW_LABELS[page] ?? "Mục";
  const listPath = `${config.detailBase}/${exam.courseCode}`;
  const doPath = `${config.detailBase}/${exam.courseCode}/${encodeURIComponent(exam.id)}/do`;
  const resultPath = `${config.detailBase}/${exam.courseCode}/${encodeURIComponent(exam.id)}/result`;
  const practiceDoPath = `${doPath}/${currentIndex + 1}`;
  const practiceResultPath = `${resultPath}/${currentIndex + 1}`;
  const submittedSession = getExamSession(exam.id);
  const practiceSession = isPracticeExam
    ? getPracticeSession(exam.id, currentQuestion.id)
    : null;
  const hasSubmittedResult = isPracticeExam
    ? Boolean(practiceSession?.submitted)
    : Boolean(submittedSession?.submitted);

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
    navigate(isPracticeExam ? practiceDoPath : doPath);
  }

  function handleViewResult() {
    navigate(isPracticeExam ? practiceResultPath : resultPath);
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

      {isDocumentPage ? <StudentDocumentViewer document={exam.document} /> : null}

      {isPracticeExam && scope === "home" ? (
        <PracticeExamSubmitPanel
          courseCode={exam.courseCode}
          examId={exam.id}
          examTitle={exam.id}
        />
      ) : null}

      {isDocumentPage ? null : (
      <section className={styles["exam-panel"]} aria-label="Xem trước đề thi">
        <header className={styles["panel-header"]}>
          <div className={styles["panel-heading"]}>
            <h2 className={styles["exam-code"]}>{exam.id}</h2>
            {isReviewExam && <p className={styles.subtitle}>Luyện tập câu hỏi lẻ</p>}
            {isPracticeExam && (
              <p className={styles.subtitle}>Mỗi bài 30 phút · Nộp file hoặc GitHub</p>
            )}
          </div>
          <div className={styles["panel-actions"]}>
            {hasSubmittedResult && canUsePremiumFeatures && (
              <button type="button" className={styles["result-btn"]} onClick={handleViewResult}>
                Xem kết quả
              </button>
            )}
            {isReviewExam || isPracticeExam ? (
              <button
                type="button"
                className={`${styles["start-btn"]} ${canUsePremiumFeatures && !hasSubmittedResult ? styles["start-btn-active"] : ""}`}
                onClick={handleStartExam}
                disabled={isPracticeExam && hasSubmittedResult}
              >
                <FontAwesomeIcon icon={canUsePremiumFeatures ? faPlay : faLock} />
                {hasSubmittedResult && isPracticeExam
                  ? "Đã nộp bài này"
                  : canUsePremiumFeatures
                    ? "Bắt đầu làm bài"
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
            <article
              className={`${styles["question-card"]} ${
                !canUsePremiumFeatures && isReviewExam ? styles["question-card-locked"] : ""
              }`}
            >
              {!isReviewExam && (
                <p className={styles["preview-label"]}>
                  {previewLabel} {currentIndex + 1}
                </p>
              )}
              <h3 className={styles["question-text"]}>{currentQuestion.text}</h3>

              {isReviewExam && currentQuestion.options && (
                <ul className={styles.options}>
                  {currentQuestion.options.map((option) => {
                    const isCorrect =
                      canUsePremiumFeatures && option.key === currentQuestion.correctAnswer;

                    return (
                      <li key={option.key}>
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

              {!canUsePremiumFeatures && isReviewExam && (
                <div className={styles["premium-overlay"]}>
                  <p>Nâng cấp Premium để xem đáp án, AI giải thích và làm bài trực tuyến.</p>
                  <Link to="/home/premium" className={styles["premium-cta"]}>
                    Xem gói Premium
                  </Link>
                </div>
              )}

              <footer className={styles["question-toolbar"]}>
                <div
                  className={`${styles["toolbar-left"]} ${
                    !canUsePremiumFeatures ? styles["toolbar-muted"] : ""
                  }`}
                >
                  <button type="button" className={styles["tool-btn"]} disabled aria-label="Xáo câu hỏi">
                    <FontAwesomeIcon icon={faShuffle} />
                  </button>
                  <button type="button" className={styles["tool-btn"]} disabled aria-label="Bình luận câu hỏi">
                    <FontAwesomeIcon icon={faComment} />
                  </button>
                  <button type="button" className={styles["tool-btn"]} disabled aria-label="Ẩn câu hỏi">
                    <FontAwesomeIcon icon={faEyeSlash} />
                  </button>
                </div>

                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles["page-btn"]}
                    onClick={goToPreviousQuestion}
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
                    onClick={goToNextQuestion}
                    disabled={isLastQuestion}
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

            {isReviewExam && (
              <ExamAiExplanation question={currentQuestion} locked={!canUsePremiumFeatures} />
            )}
          </div>

          {isReviewExam && (
            <ExamCommentsPanel locked={!isAuthenticated || !isPremium} />
          )}
        </div>
      </section>
      )}

      {!isDocumentPage ? (
      <section className={styles.related} aria-label="Related Exams">
        <h2 className={styles["related-title"]}>Related Exams</h2>
        <p className={styles["related-empty"]}>Không có đề thi liên quan</p>
      </section>
      ) : null}
    </div>
  );
}

export default ExamDetailPage;
