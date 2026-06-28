import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import backdropStyles from "@/common/styles/modalBackdrop.module.css";
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
  return (
    <Modal
      open={open}
      onClose={onClose}
      className={backdropStyles.overlay}
      panelClassName={gStyles.modal}
      closeOnOverlay
    >
        <header className={gStyles.modalHead}>
          <div>
            <h2 id="gam-delete-title" className={gStyles.modalTitle}>
              {title}
            </h2>
            <p className={gStyles.modalSubtitle}>
              Xóa <strong>{targetLabel}</strong>? Hành động không hoàn tác.
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
    </Modal>
  );
}

export default GamificationDeleteModal;
