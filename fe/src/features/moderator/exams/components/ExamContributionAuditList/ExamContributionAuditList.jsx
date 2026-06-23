import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { createExamRevisionViaApi } from "@/features/moderator/exams/moderatorExamService";
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
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [revisionLoadingId, setRevisionLoadingId] = useState(null);

  async function handleCreateRevision(item) {
    const examId = item.examApiId ?? item.pendingId ?? item.id;
    if (!examId) return;

    setRevisionLoadingId(examId);
    try {
      const revision = await createExamRevisionViaApi(examId);
      showToast("Đã tạo bản cập nhật. Chỉnh sửa và gửi Admin duyệt — đề public giữ nguyên.");
      navigate(`/moderator/final-exams/edit/${revision.id}`);
    } catch (error) {
      showToast(error?.message ?? "Không tạo được bản cập nhật.");
    } finally {
      setRevisionLoadingId(null);
    }
  }

  function renderActions(item) {
    if (item.examType !== "final") {
      return null;
    }

    const examId = item.examApiId ?? item.pendingId ?? item.id;

    if (item.status === "rejected" && item.canResubmit) {
      return (
        <Link to={`/moderator/final-exams/edit/${examId}`} className={styles.actionBtn}>
          Sửa & gửi lại
        </Link>
      );
    }

    if (
      item.status === "pending_admin" &&
      item.canResubmit &&
      item.revisionOfExamId
    ) {
      return (
        <Link to={`/moderator/final-exams/edit/${examId}`} className={styles.actionBtn}>
          Tiếp tục sửa bản cập nhật
        </Link>
      );
    }

    if (item.status === "approved" && item.isContentLocked) {
      return (
        <button
          type="button"
          className={styles.actionBtn}
          disabled={revisionLoadingId === examId}
          onClick={() => handleCreateRevision(item)}
        >
          {revisionLoadingId === examId ? "Đang tạo..." : "Cập nhật đề"}
        </button>
      );
    }

    return null;
  }

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
          {items.map((item) => {
            const action = renderActions(item);

            return (
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
                    {item.revisionOfExamId ? (
                      <span className={styles.revisionBadge}>Bản cập nhật</span>
                    ) : null}
                  </div>
                  <p className={styles.action}>
                    {item.action === "draft_saved"
                      ? "Lưu nháp"
                      : item.revisionOfExamId
                        ? "Gửi bản cập nhật"
                        : "Gửi Admin duyệt"}
                    {item.wizardStep ? ` · ${item.wizardStep}` : ""}
                  </p>
                  <p className={styles.detail}>
                    <strong>{item.subjectCode}</strong> · {item.displayTitle ?? item.title}
                  </p>
                  <p className={styles.meta}>
                    {item.semester}
                    {item.displayExamCode ?? item.examCode ? ` · ${item.displayExamCode ?? item.examCode}` : ""}
                    {item.questionCount != null ? ` · ${item.questionCount} câu` : ""}
                    {" · "}@{item.moderator} · {new Date(item.at).toLocaleString("vi-VN")}
                  </p>
                  {item.adminNote ? (
                    <p className={styles.note}>
                      Lý do từ chối: {item.adminNote}
                      {item.adminDetail ? ` (${item.adminDetail})` : ""}
                    </p>
                  ) : null}
                  {action ? <div className={styles.actions}>{action}</div> : null}
                </div>
                <span className={`${styles.status} ${styles[`status-${item.status}`]}`}>
                  {item.statusLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ExamContributionAuditList;
