import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLockOpen, faXmark } from "@fortawesome/free-solid-svg-icons";
import ModeratorBadge from "@/features/moderator/components/ModeratorBadge/ModeratorBadge";
import { STATUS_META } from "@/features/moderator/violations/violationsData";
import styles from "./ViolatingAccountDetailPanel.module.css";

function ViolatingAccountDetailPanel({ detail, loading, onClose, onUnban, unbanLoading }) {
  if (!detail && !loading) {
    return null;
  }

  const statusMeta = STATUS_META[detail?.status] ?? STATUS_META.normal;
  const canUnban = detail?.status === "locked";

  return (
    <aside className={styles.panel} aria-label="Chi tiết tài khoản vi phạm">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Chi tiết vi phạm</h2>
          {detail ? (
            <p className={styles.subtitle}>
              {detail.displayName} · @{detail.username}
            </p>
          ) : null}
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      {loading ? (
        <p className={styles.loading}>Đang tải chi tiết...</p>
      ) : detail ? (
        <div className={styles.body}>
          <dl className={styles.summary}>
            <div>
              <dt>Email</dt>
              <dd>{detail.email || "—"}</dd>
            </div>
            <div>
              <dt>Chuyên ngành / Kỳ</dt>
              <dd>{detail.studentId}</dd>
            </div>
            <div>
              <dt>Điểm gamification</dt>
              <dd>{detail.points ?? 0}</dd>
            </div>
            <div>
              <dt>Tổng vi phạm</dt>
              <dd>{detail.violations}</dd>
            </div>
            <div>
              <dt>Cảnh báo</dt>
              <dd>{detail.warningCount ?? 0}</dd>
            </div>
            <div>
              <dt>Khóa tạm (lần)</dt>
              <dd>{detail.tempBanCount ?? 0}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>
                <ModeratorBadge label={statusMeta.label} tone={statusMeta.tone} dot />
              </dd>
            </div>
          </dl>

          {detail.banReason ? (
            <p className={styles.reason}>
              <strong>Lý do gần nhất:</strong> {detail.banReason}
            </p>
          ) : null}

          <section className={styles.historySection}>
            <h3 className={styles.historyTitle}>Lịch sử xử lý</h3>
            {detail.history?.length ? (
              <ul className={styles.historyList}>
                {detail.history.map((item) => (
                  <li key={item.id} className={styles.historyItem}>
                    <div className={styles.historyHead}>
                      <span className={styles.historyAction}>{item.actionLabel}</span>
                      <time dateTime={item.createdAt}>{item.createdAt}</time>
                    </div>
                    <p className={styles.historyReason}>{item.reason}</p>
                    <p className={styles.historyMeta}>
                      Bởi @{item.actorUsername}
                      {item.until ? ` · Hết hạn ${item.until}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyHistory}>Chưa có lịch sử xử lý.</p>
            )}
          </section>

          {canUnban ? (
            <button
              type="button"
              className={styles.unbanBtn}
              onClick={onUnban}
              disabled={unbanLoading}
            >
              <FontAwesomeIcon icon={faLockOpen} />
              {unbanLoading ? "Đang gỡ khóa..." : "Gỡ khóa tạm"}
            </button>
          ) : null}

          <p className={styles.hint}>
            Moderator chỉ gỡ khóa tạm (1 / 7 / 30 ngày). Khóa vĩnh viễn do Admin xử lý.
          </p>
        </div>
      ) : null}
    </aside>
  );
}

export default ViolatingAccountDetailPanel;
