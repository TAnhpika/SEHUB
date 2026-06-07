import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  EXAM_QUESTION_REPORT_REASONS,
  EXAM_REPORT_ROUTING,
  MIN_EXAM_REPORT_DETAIL_LENGTH,
} from "@/features/exams/examQuestionReportData";
import { submitExamQuestionReport } from "@/features/exams/examQuestionReportStore";
import styles from "@/features/feed/ReportPostModal/ReportPostModal.module.css";

function ExamQuestionReportModal({
  open,
  onClose,
  examId,
  courseCode,
  questionIndex,
  question,
}) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousScrollbarGutter = document.documentElement.style.scrollbarGutter;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.scrollbarGutter = "auto";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.scrollbarGutter = previousScrollbarGutter;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setDetail("");
    setError("");
  }, [open, examId, questionIndex]);

  if (!open || !question) return null;

  function handleSubmit(event) {
    event.preventDefault();

    if (!reason) {
      setError("Vui lòng chọn lý do báo cáo.");
      return;
    }

    const trimmedDetail = detail.trim();
    if (trimmedDetail.length < MIN_EXAM_REPORT_DETAIL_LENGTH) {
      setError(`Vui lòng mô tả chi tiết ít nhất ${MIN_EXAM_REPORT_DETAIL_LENGTH} ký tự.`);
      return;
    }

    const report = submitExamQuestionReport({
      examId,
      courseCode,
      questionId: question.id,
      questionIndex,
      question,
      reason,
      detail: trimmedDetail,
      reporter: user,
    });

    showToast(
      `Đã gửi báo cáo ${report.code} tới ${EXAM_REPORT_ROUTING.assigneeLabel}. Cảm ơn bạn đã góp ý!`,
    );
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-exam-question-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <header className={styles.header}>
          <span className={styles.icon} aria-hidden="true">
            <FontAwesomeIcon icon={faFlag} />
          </span>
          <div>
            <h2 id="report-exam-question-title" className={styles.title}>
              Báo cáo câu hỏi ôn tập
            </h2>
            <p className={styles.subtitle}>
              {examId} · Câu {questionIndex}
            </p>
            <p className={styles.subtitle}>{EXAM_REPORT_ROUTING.description}</p>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Lý do báo cáo</legend>
            <ul className={styles.reasons}>
              {EXAM_QUESTION_REPORT_REASONS.map((item) => (
                <li key={item.id}>
                  <label className={styles.reason}>
                    <input
                      type="radio"
                      name="exam-report-reason"
                      value={item.id}
                      checked={reason === item.id}
                      onChange={() => {
                        setReason(item.id);
                        setError("");
                      }}
                    />
                    <span>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <label className={styles.field} htmlFor="exam-report-detail">
            <span className={styles.label}>
              Mô tả chi tiết
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            </span>
            <textarea
              id="exam-report-detail"
              className={styles.textarea}
              rows={4}
              placeholder="Ví dụ: đáp án hệ thống ghi B nhưng the giải thích AI và tài liệu chương 3 cho thấy đáp án đúng là C…"
              value={detail}
              onChange={(event) => {
                setDetail(event.target.value);
                setError("");
              }}
            />
          </label>

          <p className={styles.subtitle}>
            Người xử lý: <strong>{EXAM_REPORT_ROUTING.assigneeLabel}</strong> · Escalate:{" "}
            <strong>{EXAM_REPORT_ROUTING.escalationLabel}</strong>
          </p>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button look="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" look="solid">
              Gửi báo cáo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExamQuestionReportModal;
