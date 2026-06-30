import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import backdropStyles from "@/common/styles/modalBackdrop.module.css";
import { ACTION_LOADING } from "@/utils/actionLoadingLabels";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";

/**
 * @param {{
 *   open: boolean;
 *   payment: {
 *     payosOrderId: string;
 *     username: string;
 *     planLabel: string;
 *     amountLabel: string;
 *   } | null;
 *   onClose: () => void;
 *   onSubmit: (payload: { reason: string }) => void;
 *   error?: string;
 *   submitting?: boolean;
 * }} props
 */
function AdminRefundModal({ open, payment, onClose, onSubmit, error = "", submitting = false }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
  }, [open]);

  if (!open || !payment) return null;

  const canSubmit = reason.trim().length >= 10;

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    onSubmit({ reason: reason.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className={backdropStyles.overlay}
      panelClassName={payStyles.tokenModal}
      closeOnOverlay={!submitting}
    >
        <header className={payStyles.tokenModalHead}>
          <div className={payStyles.tokenModalHeadMain}>
            <span className={`${payStyles.tokenModalIcon} ${payStyles.refundModalIcon}`} aria-hidden="true">
              <FontAwesomeIcon icon={faRotateLeft} />
            </span>
            <div>
              <h2 id="refund-payment-title" className={payStyles.tokenModalTitle}>
                Hoàn tiền PayOS
              </h2>
              <p className={payStyles.tokenModalSubtitle}>
                Thu hồi Premium đã kích hoạt, ghi audit bất biến và chuyển trạng thái「Đã hoàn tiền」.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={payStyles.modalClose}
            aria-label="Đóng"
            onClick={handleClose}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form className={payStyles.tokenModalBody} onSubmit={handleSubmit}>
          <div className={payStyles.refundSummary}>
            <p>
              <strong>{payment.payosOrderId}</strong> · @{payment.username}
            </p>
            <p>
              {payment.planLabel} · <strong>{payment.amountLabel}</strong>
            </p>
          </div>

          <label className={payStyles.grantField}>
            <span className={payStyles.grantLabel}>
              Lý do hoàn tiền (audit — tối thiểu 10 ký tự)
            </span>
            <textarea
              className={payStyles.grantTextarea}
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: SV yêu cầu hủy gói trong 24h — hoàn qua ngân hàng PayOS"
              required
            />
          </label>

          {error ? <p className={payStyles.hintError}>{error}</p> : null}

          <footer className={payStyles.tokenModalFooter}>
            <Button type="button" look="outline" onClick={handleClose} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting} loading={submitting} loadingLabel={ACTION_LOADING.dismiss}>
              Xác nhận hoàn tiền
            </Button>
          </footer>
        </form>
    </Modal>
  );
}

export default AdminRefundModal;
