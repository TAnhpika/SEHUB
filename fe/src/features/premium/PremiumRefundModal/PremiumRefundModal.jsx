import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import styles from "./PremiumRefundModal.module.css";

/**
 * @param {{
 *   open: boolean;
 *   orderCode: string | null;
 *   lastPaidAt?: string | null;
 *   onClose: () => void;
 *   onSubmit: (payload: { reason: string }) => void | Promise<void>;
 *   error?: string;
 *   submitting?: boolean;
 * }} props
 */
function PremiumRefundModal({
  open,
  orderCode,
  lastPaidAt = null,
  onClose,
  onSubmit,
  error = "",
  submitting = false,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
  }, [open]);

  if (!open || !orderCode) return null;

  const canSubmit = reason.trim().length >= 10 && !submitting;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ reason: reason.trim() });
  }

  const paidLabel = lastPaidAt
    ? new Date(lastPaidAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={styles.backdrop}
      panelClassName={styles.modal}
      closeOnOverlay
    >
        <header className={styles.head}>
          <div className={styles.headMain}>
            <span className={styles.icon} aria-hidden="true">
              <FontAwesomeIcon icon={faRotateLeft} />
            </span>
            <div>
              <h2 id="premium-refund-title" className={styles.title}>
                Yêu cầu hoàn tiền
              </h2>
              <p className={styles.subtitle}>
                Chỉ áp dụng trong 24 giờ kể từ khi thanh toán thành công. Yêu cầu sẽ được admin
                duyệt — gói Premium vẫn hoạt động cho đến khi được chấp thuận.
              </p>
            </div>
          </div>
          <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.summary}>
            <p>
              Mã đơn: <strong>{orderCode}</strong>
            </p>
            {paidLabel ? (
              <p>
                Thanh toán lúc: <strong>{paidLabel}</strong>
              </p>
            ) : null}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Lý do hoàn tiền (bắt buộc)</span>
            <textarea
              className={styles.textarea}
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="VD: Mua nhầm gói, muốn hủy trong thời hạn 24 giờ"
              required
              disabled={submitting}
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <footer className={styles.footer}>
            <Button type="button" look="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "Đang gửi..." : "Gửi yêu cầu hoàn tiền"}
            </Button>
          </footer>
        </form>
    </Modal>
  );
}

export default PremiumRefundModal;
