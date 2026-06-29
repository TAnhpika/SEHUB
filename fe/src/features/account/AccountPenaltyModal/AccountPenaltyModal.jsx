import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import styles from "./AccountPenaltyModal.module.css";

function AccountPenaltyModal({ open, penalty, onClose, variant = "info", loading = false }) {
  const isBan = variant === "ban" || penalty?.penaltyType === "Temp" || penalty?.penaltyType === "Permanent";
  const title = isBan ? "Tài khoản bị khóa" : "Thông báo vi phạm";

  return (
    <Modal open={open} onClose={onClose} title={title} panelClassName={styles.panel}>
      <div className={styles.content}>
        <div className={`${styles.iconWrap} ${isBan ? styles.iconBan : styles.iconWarn}`} aria-hidden>
          <FontAwesomeIcon icon={faTriangleExclamation} />
        </div>

        <p className={styles.lead}>
          {isBan
            ? "Tài khoản của bạn đang bị hạn chế truy cập SEHub."
            : "Kiểm duyệt viên đã ghi nhận vi phạm trên tài khoản của bạn."}
        </p>

        {loading ? (
          <p className={styles.fallback}>Đang tải chi tiết xử phạt...</p>
        ) : penalty ? (
          <dl className={styles.details}>
            <div className={styles.row}>
              <dt>Thời điểm bị phạt</dt>
              <dd>{penalty.issuedAtLabel}</dd>
            </div>
            <div className={styles.row}>
              <dt>Hình thức phạt</dt>
              <dd>{penalty.penaltyTypeLabel}</dd>
            </div>
            <div className={styles.row}>
              <dt>Lý do</dt>
              <dd>{penalty.reason}</dd>
            </div>
            <div className={styles.row}>
              <dt>Bị phạt đến khi nào?</dt>
              <dd>{penalty.untilLabel}</dd>
            </div>
          </dl>
        ) : (
          <p className={styles.fallback}>Không tải được chi tiết xử phạt. Vui lòng liên hệ hỗ trợ.</p>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="primary" onClick={onClose}>
            Đã hiểu
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AccountPenaltyModal;
