import { useEffect, useState } from "react";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import backdropStyles from "@/common/styles/modalBackdrop.module.css";
import { EXAM_REJECT_REASONS } from "@/features/admin/exams/adminExamData";
import styles from "./AdminExam.module.css";

const OTHER_REASON_ID = "other";

/**
 * @param {{
 *   open: boolean;
 *   examTitle: string;
 *   onClose: () => void;
 *   onConfirm: (payload: {
 *     reasonId: string;
 *     reasonLabel: string;
 *     reasonDetail: string;
 *     reasonFull: string;
 *   }) => void;
 * }} props
 */
function AdminExamRejectModal({ open, examTitle, onClose, onConfirm }) {
  const [reasonId, setReasonId] = useState("");
  const [otherDetail, setOtherDetail] = useState("");

  useEffect(() => {
    if (!open) return;
    setReasonId("");
    setOtherDetail("");
  }, [open]);

  if (!open) return null;

  const selected = EXAM_REJECT_REASONS.find((r) => r.id === reasonId);
  const isOther = reasonId === OTHER_REASON_ID;
  const canSubmit =
    Boolean(selected) && (!isOther || otherDetail.trim().length > 0);

  function handleSubmit(event) {
    event.preventDefault();
    if (!selected) return;
    const detail = isOther ? otherDetail.trim() : "";
    const reasonFull = isOther ? detail : selected.label;
    onConfirm({
      reasonId: selected.id,
      reasonLabel: selected.label,
      reasonDetail: detail,
      reasonFull,
    });
    setReasonId("");
    setOtherDetail("");
  }

  function handleClose() {
    setReasonId("");
    setOtherDetail("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className={backdropStyles.overlay}
      panelClassName={styles.modal}
      closeOnOverlay
    >
        <h2 id="reject-exam-title" className={styles.modalTitle}>
          Từ chối đề thi
        </h2>
        <p className={styles.modalDesc}>
          Mod sẽ nhận thông báo và có thể chỉnh sửa gửi lại: <strong>{examTitle}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <label className={styles.modalField}>
            <span className={styles.modalLabel}>Lý do từ chối *</span>
            <select
              className={styles.modalSelect}
              value={reasonId}
              onChange={(e) => setReasonId(e.target.value)}
              required
            >
              <option value="" disabled>
                Chọn lý do...
              </option>
              {EXAM_REJECT_REASONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {isOther ? (
            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Mô tả lý do khác *</span>
              <textarea
                className={styles.modalTextarea}
                value={otherDetail}
                onChange={(e) => setOtherDetail(e.target.value)}
                placeholder="Nhập chi tiết để Mod biết cần sửa gì..."
                rows={3}
                required
              />
            </label>
          ) : null}

          <div className={styles.modalActions}>
            <Button type="button" look="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Xác nhận từ chối
            </Button>
          </div>
        </form>
    </Modal>
  );
}

export default AdminExamRejectModal;
