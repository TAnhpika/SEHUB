import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
  faComment,
  faComments,
  faExpand,
  faEyeSlash,
  faShuffle,
} from "@fortawesome/free-solid-svg-icons";
import {
  buildExamQuestions,
  EXAM_PREVIEW_LABELS,
  EXAM_TYPE_LABELS,
} from "@/features/exams/examDetailData";
import {
  getExamById,
  SUBJECT_DETAIL_CONFIG,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import styles from "./ExamDetailPage.module.css";

function ExamDetailPage({ page }) {
  const { courseCode, examId } = useParams();
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

  useEffect(() => {
    setCurrentIndex(0);
  }, [decodedExamId]);

  if (!exam) {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  function goToPreviousQuestion() {
    if (isFirstQuestion) return;
    setCurrentIndex((index) => index - 1);
  }

  function goToNextQuestion() {
    if (isLastQuestion) return;
    setCurrentIndex((index) => index + 1);
  }

  const typeLabel = EXAM_TYPE_LABELS[page] ?? exam.type;
  const previewLabel = EXAM_PREVIEW_LABELS[page] ?? "Mục";
  const isReviewExam = page === "review";
  const listPath = `${config.detailBase}/${exam.courseCode}`;

  return (
    <div className={styles.page}>
      <Link to={listPath} className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại
      </Link>

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

      <section className={styles["exam-panel"]} aria-label="Xem trước đề thi">
        <header className={styles["panel-header"]}>
          <h2 className={styles["exam-code"]}>{exam.id}</h2>
          <button type="button" className={styles["start-btn"]} disabled>
            Bắt đầu làm bài
          </button>
        </header>

        <div className={styles.workspace}>
          <div className={styles["question-area"]}>
            <div className={styles["question-preview"]}>
              {!isReviewExam && (
                <p className={styles["preview-label"]}>
                  {previewLabel} {currentIndex + 1}
                </p>
              )}
              <p className={styles["question-text"]}>{currentQuestion.text}</p>
              {isReviewExam && currentQuestion.options && (
                <ul className={styles.options}>
                  {currentQuestion.options.map((option) => (
                    <li key={option.key}>
                      <button type="button" className={styles.option} disabled>
                        <span className={styles["option-key"]}>{option.key}</span>
                        <span>{option.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className={styles["question-toolbar"]}>
              <div className={`${styles["toolbar-left"]} ${styles["toolbar-muted"]}`}>
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
          </div>

          <aside className={styles.comments} aria-label="Bình luận">
            <h3 className={styles["comments-title"]}>Bình luận</h3>

            <div className={styles["comments-empty"]}>
              <span className={styles["comments-icon"]} aria-hidden="true">
                <FontAwesomeIcon icon={faComments} />
              </span>
              <p>Chưa có bình luận nào.</p>
              <p>Hãy là người đầu tiên bình luận!</p>
            </div>

            <textarea
              className={styles["comment-input"]}
              placeholder="Viết bình luận của bạn..."
              disabled
              rows={3}
            />
          </aside>
        </div>
      </section>

      <section className={styles.related} aria-label="Related Exams">
        <h2 className={styles["related-title"]}>Related Exams</h2>
        <p className={styles["related-empty"]}>Không có đề thi liên quan</p>
      </section>
    </div>
  );
}

export default ExamDetailPage;
