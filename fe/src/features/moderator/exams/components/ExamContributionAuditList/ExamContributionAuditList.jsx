import { Link } from "react-router-dom";
import styles from "./ExamContributionAuditList.module.css";

/**
 * @param {{
 *   items: Array<object>;
 *   title?: string;
 *   description?: string;
 *   emptyMessage?: string;
 *   showHistoryLink?: boolean;
 *   compact?: boolean;
 * }} props
 */
function ExamContributionAuditList({
  items,
  title = "Nhật ký đóng góp đề",
  description = "Mod lưu nháp hoặc gửi Admin duyệt trước khi public (§2.4).",
  emptyMessage = "Chưa có bản ghi. Lưu nháp hoặc gửi đề mới — mọi thao tác sẽ được ghi tại đây.",
  showHistoryLink = false,
  compact = false,
}) {
  return (
    <div className={styles.panel}>
      {!compact ? (
        <header className={styles.head}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.desc}>{description}</p>
          </div>
          {showHistoryLink ? (
            <Link to="/moderator/exams/history" className={styles.historyLink}>
              Xem toàn bộ lịch sử →
            </Link>
          ) : null}
        </header>
      ) : null}

      {items.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.main}>
                <div className={styles.badges}>
                  <span
                    className={`${styles.typeBadge} ${
                      item.examType === "final" ? styles.typeBadgeFinal : ""
                    }`}
                  >
                    {item.typeLabel}
                  </span>
                </div>
                <p className={styles.action}>
                  {item.action === "draft_saved" ? "Lưu nháp" : "Gửi Admin duyệt"}
                  {item.wizardStep ? ` · ${item.wizardStep}` : ""}
                </p>
                <p className={styles.detail}>
                  <strong>{item.subjectCode}</strong> · {item.title}
                </p>
                <p className={styles.meta}>
                  {item.semester}
                  {item.examCode ? ` · ${item.examCode}` : ""}
                  {item.questionCount != null ? ` · ${item.questionCount} câu` : ""}
                  {" · "}@{item.moderator} · {new Date(item.at).toLocaleString("vi-VN")}
                </p>
                {item.adminNote ? (
                  <p className={styles.note}>
                    Lý do từ chối: {item.adminNote}
                    {item.adminDetail ? ` — ${item.adminDetail}` : ""}
                  </p>
                ) : null}
              </div>
              <span className={`${styles.status} ${styles[`status-${item.status}`]}`}>
                {item.statusLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExamContributionAuditList;
