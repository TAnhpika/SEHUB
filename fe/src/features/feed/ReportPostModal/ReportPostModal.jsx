import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { MIN_REPORT_DETAIL_LENGTH, REPORT_REASONS } from "./reportData";
import styles from "./ReportPostModal.module.css";

function ReportPostModal({ open, onClose, postId, postTitle }) {
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setDetail("");
    setError("");
  }, [open, postId]);

  if (!open) return null;

  function handleSubmit(event) {
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

    showToast("Đã gửi báo cáo bài viết. SEHub sẽ xem xét trong thời gian sớm nhất.");
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-post-title"
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
            <h2 id="report-post-title" className={styles.title}>
              Báo cáo bài viết
            </h2>
            {postTitle ? (
              <p className={styles.subtitle}>
                Bạn đang báo cáo: <strong>{postTitle}</strong>
              </p>
            ) : (
              <p className={styles.subtitle}>
                Vui lòng cho chúng tôi biết lý do bạn muốn báo cáo bài viết này.
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
                      name="report-reason"
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

          <label className={styles.field} htmlFor="report-detail">
            <span className={styles.label}>
              Mô tả chi tiết
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            </span>
            <textarea
              id="report-detail"
              className={styles.textarea}
              rows={4}
              placeholder="Mô tả cụ thể vấn đề bạn gặp phải với bài viết này..."
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
            <Button type="submit" look="solid">
              Gửi báo cáo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportPostModal;
