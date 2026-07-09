/**
 * @fileoverview Modal hiển thị chi tiết báo cáo đã escalate sang luồng xử lý vi phạm.
 *
 * Mở qua deep-link query string trên `ViolatingAccountsPage` (`reason`, `code`, `reporter`).
 *
 * @module features/moderator/violations/components/EscalatedReportDetailModal
 */

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "@/common/Modal/Modal";
import styles from "./EscalatedReportDetailModal.module.css";

/**
 * @typedef {Object} EscalatedReportDetailModalProps
 * @property {boolean} open - Điều khiển hiển thị modal.
 * @property {() => void} onClose - Đóng modal.
 * @property {string} [reportCode] - Mã báo cáo (không có `#`).
 * @property {string} [username] - Username tài khoản bị báo cáo (có thể kèm `@`).
 * @property {string} [reporterUsername] - Username người báo cáo.
 * @property {string} [detail] - Nội dung chi tiết báo cáo.
 * @property {() => void} onViewAccount - Mở panel chi tiết tài khoản vi phạm.
 */

/**
 * Modal tóm tắt báo cáo đã chuyển sang xử lý vi phạm — ngữ cảnh khi Moderator deep-link từ Reports.
 *
 * Hiển thị metadata (tài khoản bị báo cáo, người báo cáo) và blockquote nội dung.
 * Footer có nút đóng và "Xem chi tiết tài khoản".
 *
 * @param {EscalatedReportDetailModalProps} props - Props của component.
 * @returns {import('react').ReactElement} Modal chi tiết báo cáo escalate.
 *
 * @example
 * <EscalatedReportDetailModal
 *   open={showEscalatedModal}
 *   reportCode="RP-4921"
 *   username="@spammer"
 *   detail="Spam link lừa đảo"
 *   onClose={() => setShowEscalatedModal(false)}
 *   onViewAccount={() => openDetailPanel()}
 * />
 */
function EscalatedReportDetailModal({
  open,
  onClose,
  reportCode,
  username,
  reporterUsername,
  detail,
  onViewAccount,
}) {
  const displayUser = username?.replace(/^@/, "") ?? "";
  const displayReporter = reporterUsername?.replace(/^@/, "") ?? "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chi tiết báo cáo"
      titleId="escalated-report-modal-title"
      className={styles.overlay}
      panelClassName={styles.dialog}
      closeOnOverlay
    >
      <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <FontAwesomeIcon icon={faFlag} />
        </span>
        <div>
          <h2 id="escalated-report-modal-title" className={styles.title}>
            Chi tiết báo cáo
            {reportCode ? <span className={styles.code}>#{reportCode}</span> : null}
          </h2>
          <p className={styles.subtitle}>
            Báo cáo đã chuyển sang xử lý tài khoản vi phạm — xem nội dung và thao tác bên dưới.
          </p>
        </div>
      </header>

      <div className={styles.body}>
        <dl className={styles.meta}>
          <div className={styles.metaItem}>
            <dt>
              <FontAwesomeIcon icon={faUser} className={styles.metaIcon} />
              Tài khoản bị báo cáo
            </dt>
            <dd>@{displayUser || "unknown"}</dd>
          </div>
          {displayReporter ? (
            <div className={styles.metaItem}>
              <dt>Người báo cáo</dt>
              <dd>@{displayReporter}</dd>
            </div>
          ) : null}
        </dl>

        {detail ? (
          <section className={styles.detailSection} aria-labelledby="escalated-report-detail-heading">
            <h3 id="escalated-report-detail-heading" className={styles.detailLabel}>
              Nội dung báo cáo
            </h3>
            <blockquote className={styles.detailQuote}>&ldquo;{detail}&rdquo;</blockquote>
          </section>
        ) : (
          <p className={styles.emptyDetail}>Không có mô tả chi tiết kèm theo báo cáo này.</p>
        )}
      </div>

      <footer className={styles.footer}>
        <button type="button" className={styles.btnOutline} onClick={onClose}>
          Đóng
        </button>
        <button type="button" className={styles.btnPrimary} onClick={onViewAccount}>
          Xem chi tiết tài khoản
        </button>
      </footer>
    </Modal>
  );
}

export default EscalatedReportDetailModal;
