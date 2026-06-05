import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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

function ScoreRing({ percent, grade }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={styles["score-ring"]} aria-hidden="true">
      <svg viewBox="0 0 140 140" className={styles["score-ring-svg"]}>
        <circle cx="70" cy="70" r={radius} className={styles["score-ring-track"]} />
        <circle
          cx="70"
          cy="70"
          r={radius}
          className={styles["score-ring-progress"]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles["score-ring-inner"]}>
        <span className={styles["score-ring-value"]}>{percent}%</span>
        <span className={styles["score-ring-grade"]}>Hạng {grade}</span>
      </div>
    </div>
  );
}

function ExamResultPage({ page = "review" }) {
  const { courseCode, examId } = useParams();
  const navigate = useNavigate();
  const config = SUBJECT_DETAIL_CONFIG[page];
  const decodedExamId = decodeURIComponent(examId ?? "");

  const exam = useMemo(
    () => getExamById(courseCode, decodedExamId, page),
    [courseCode, decodedExamId, page],
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

      <section className={styles.summary} aria-label="Kết quả làm bài">
        <header className={styles["summary-head"]}>
          <div className={styles["summary-title-wrap"]}>
            <span className={styles["summary-icon"]} aria-hidden="true">
              <FontAwesomeIcon icon={faChartColumn} />
            </span>
            <div>
              <h1 className={styles.title}>Thống kê kết quả</h1>
              <p className={styles.subtitle}>Mã đề {exam.id}</p>
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
              {result.correctCount}/{result.total} câu đúng
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
            </dl>

            <p className={styles.insight}>{peer.message}</p>
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

        <div className={styles["progress-wrap"]}>
          <div className={styles["progress-bar"]} aria-label="Tỷ lệ đúng, sai, bỏ trống">
            <span className={styles["progress-correct"]} style={{ width: `${correctPercent}%` }} />
            <span className={styles["progress-wrong"]} style={{ width: `${wrongPercent}%` }} />
            <span className={styles["progress-empty"]} style={{ width: `${emptyPercent}%` }} />
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
        </div>
      </section>

      <section className={styles.map} aria-label="Bảng thống kê câu hỏi">
        <div className={styles["map-head"]}>
          <h2 className={styles["section-title"]}>Bảng thống kê câu hỏi</h2>
          <p className={styles["map-meta"]}>
            Nhấn vào ô để xem trạng thái từng câu
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

      {(wrongItems.length > 0 || emptyItems.length > 0) && (
        <section className={styles.review} aria-label="Phân tích câu cần ôn">
          <h2 className={styles["section-title"]}>Phân tích câu cần ôn</h2>

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
              <h3 className={styles["review-subtitle"]}>Câu bỏ trống ({emptyItems.length})</h3>
              <ul className={styles.list}>
                {emptyItems.map((item) => {
                  const index = result.items.findIndex((entry) => entry.questionId === item.questionId);
                  return (
                    <li key={item.questionId} className={styles.item}>
                      <div className={styles["item-head"]}>
                        <span className={styles["item-index"]}>Câu {index + 1}</span>
                        <span className={`${styles.badge} ${styles["badge-empty"]}`}>Bỏ trống</span>
                      </div>
                      <p className={styles["item-text"]}>{item.text}</p>
                      <p className={styles["item-answer"]}>
                        Đáp án đúng: <strong>{item.correctAnswer}</strong>
                      </p>
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
        <Button look="soft" to="/community/final-exam">
          Khám phá đề khác
        </Button>
      </section>
    </div>
  );
}

export default ExamResultPage;
