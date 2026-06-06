import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import gStyles from "@/features/admin/gamification/Gamification.module.css";

/**
 * @param {{
 *   open: boolean;
 *   title: string;
 *   targetLabel: string;
 *   onClose: () => void;
 *   onConfirm: () => void;
 * }} props
 */
function GamificationDeleteModal({ open, title, targetLabel, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className={gStyles.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={gStyles.modal}
        role="alertdialog"
        aria-labelledby="gam-delete-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={gStyles.modalHead}>
          <div>
            <h2 id="gam-delete-title" className={gStyles.modalTitle}>
              {title}
            </h2>
            <p className={gStyles.modalSubtitle}>
              Xóa <strong>{targetLabel}</strong>? Hành động không hoàn tác (mock store).
            </p>
          </div>
          <button type="button" className={gStyles.modalClose} aria-label="Đóng" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <footer className={`${gStyles.modalBody} ${gStyles.modalFooter}`}>
          <Button type="button" look="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" onClick={onConfirm}>
            <FontAwesomeIcon icon={faTrash} /> Xóa
          </Button>
        </footer>
      </div>
    </div>
  );
}

export default GamificationDeleteModal;
