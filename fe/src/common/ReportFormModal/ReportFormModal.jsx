import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import styles from "@/features/feed/ReportPostModal/ReportPostModal.module.css";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   title: string;
 *   subtitle?: import('react').ReactNode;
 *   reasons: Array<{ id: string; label: string }>;
 *   minDetailLength: number;
 *   detailPlaceholder?: string;
 *   footerNote?: import('react').ReactNode;
 *   submitting?: boolean;
 *   onSubmit: (payload: { reasonId: string; reasonLabel: string; detail: string }) => void | Promise<void>;
 * }} props
 */
function ReportFormModal({
  open,
  onClose,
  title,
  subtitle,
  reasons,
  minDetailLength,
  detailPlaceholder = "Mô tả cụ thể vấn đề…",
  footerNote = null,
  submitting = false,
  onSubmit,
}) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
    setDetail("");
    setError("");
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!reason) {
      setError("Vui lòng chọn lý do báo cáo.");
      return;
    }

    const trimmedDetail = detail.trim();
    if (trimmedDetail.length < minDetailLength) {
      setError(`Vui lòng mô tả chi tiết ít nhất ${minDetailLength} ký tự.`);
      return;
    }

    const reasonLabel = reasons.find((item) => item.id === reason)?.label ?? reason;

    try {
      await onSubmit({ reasonId: reason, reasonLabel, detail: trimmedDetail });
    } catch (err) {
      setError(err?.message ?? "Không gửi được báo cáo.");
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
        <span className={styles.icon} aria-hidden="true">
          <FontAwesomeIcon icon={faFlag} />
        </span>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Lý do báo cáo</legend>
          <ul className={styles.reasons}>
            {reasons.map((item) => (
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

        {footerNote}

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

export default ReportFormModal;
