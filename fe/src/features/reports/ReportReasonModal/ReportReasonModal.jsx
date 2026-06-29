import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import {
  MIN_REPORT_DETAIL_LENGTH,
  REPORT_REASONS,
} from "@/features/feed/ReportPostModal/reportData";
import styles from "@/features/feed/ReportPostModal/ReportPostModal.module.css";

function ReportReasonModal({
  open,
  onClose,
  title,
  subtitle,
  detailPlaceholder,
  successMessage,
  icon = faFlag,
  iconClassName,
  onSubmit,
}) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setDetail("");
    setError("");
  }, [open, title]);

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
      await onSubmit({ reasonId: reason, reasonLabel, detail: trimmedDetail });
      onClose({ successMessage });
    } catch (err) {
      setError(err.message ?? "Không gửi được báo cáo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={styles.overlay}
      panelClassName={styles.dialog}
      closeOnOverlay
    >
      <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <header className={styles.header}>
        <span className={[styles.icon, iconClassName].filter(Boolean).join(" ")} aria-hidden="true">
          <FontAwesomeIcon icon={icon} />
        </span>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
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
            placeholder={detailPlaceholder}
            value={detail}
            onChange={(event) => {
              setDetail(event.target.value);
              setError("");
            }}
          />
        </label>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button look="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" look="solid" disabled={submitting}>
            Gửi báo cáo
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ReportReasonModal;
