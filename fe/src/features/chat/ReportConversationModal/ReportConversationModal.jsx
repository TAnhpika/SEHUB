import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { reportConversation } from "@/api/messagesApi";
import { MIN_REPORT_DETAIL_LENGTH, REPORT_REASONS } from "@/features/feed/ReportPostModal/reportData";
import styles from "@/features/feed/ReportPostModal/ReportPostModal.module.css";

function ReportConversationModal({ open, onClose, conversationId, conversationName }) {
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
  }, [open, conversationId]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!reason) {
      setError("Vui lòng chọn lý do báo cáo.");
      return;
    }

    const trimmedDetail = detail.trim();
    if (trimmedDetail.length < MIN_REPORT_DETAIL_LENGTH) {
      setError(`Vui lòng mô tả chi tiết ít nhất ${MIN_REPORT_DETAIL_LENGTH} ký tự.`);
      return;
    }

    const reasonLabel = REPORT_REASONS.find((item) => item.id === reason)?.label ?? reason;

    setSubmitting(true);
    try {
      await reportConversation(conversationId, {
        reason: reasonLabel,
        detail: trimmedDetail,
      });
      window.dispatchEvent(new CustomEvent("sehubs-conversation-reports-changed"));
      window.dispatchEvent(new CustomEvent("sehub-moderator-stats-updated"));
      showToast("Đã gửi báo cáo hội thoại. SEHub sẽ xem xét trong thời gian sớm nhất.");
      onClose();
    } catch (err) {
      setError(err.message ?? "Không gửi được báo cáo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-conversation-title"
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
            <h2 id="report-conversation-title" className={styles.title}>
              Báo cáo hội thoại
            </h2>
            {conversationName ? (
              <p className={styles.subtitle}>
                Bạn đang báo cáo cuộc trò chuyện với <strong>{conversationName}</strong>
              </p>
            ) : (
              <p className={styles.subtitle}>
                Vui lòng cho chúng tôi biết lý do bạn muốn báo cáo hội thoại này.
              </p>
            )}
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Lý do báo cáo</legend>
            <ul className={styles.reasons}>
              {REPORT_REASONS.map((item) => (
                <li key={item.id}>
                  <label className={styles.reason}>
                    <input
                      type="radio"
                      name="report-conversation-reason"
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

          <label className={styles.field} htmlFor="report-conversation-detail">
            <span className={styles.label}>
              Mô tả chi tiết
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            </span>
            <textarea
              id="report-conversation-detail"
              className={styles.textarea}
              rows={4}
              placeholder="Mô tả cụ thể vấn đề bạn gặp phải trong hội thoại này..."
              value={detail}
              onChange={(event) => {
                setDetail(event.target.value);
                setError("");
              }}
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <Button look="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" look="solid" disabled={submitting}>
              Gửi báo cáo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportConversationModal;
