import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { createExamRevisionViaApi } from "@/features/moderator/exams/moderatorExamService";
import styles from "./ExamContributionAuditList.module.css";

/**
 * @fileoverview Danh sách nhật ký đóng góp đề của Moderator.
 *
 * Hiển thị từng entry (lưu nháp / gửi duyệt) kèm badge trạng thái,
 * hành động sửa & gửi lại, tiếp tục revision, hoặc tạo bản cập nhật đề đã duyệt.
 *
 * @module features/moderator/exams/components/ExamContributionAuditList
 */

/**
 * @param {string} examId - ID đề trên API.
 * @returns {string} Route chỉnh sửa đề thực hành.
 */
function practiceEditPath(examId) {
  return `/moderator/practice-exams/edit/${examId}`;
}

/**
 * @param {string} examId - ID đề trên API.
 * @returns {string} Route chỉnh sửa đề cuối kỳ wizard.
 */
function finalEditPath(examId) {
  return `/moderator/final-exams/edit/${examId}`;
}

/**
 * @typedef {Object} ExamContributionAuditListProps
 * @property {Array<object>} items - Danh sách entry nhật ký đóng góp.
 * @property {string} [title="Nhật ký đóng góp đề"] - Tiêu đề panel.
 * @property {string} [description] - Mô tả ngắn dưới tiêu đề.
 * @property {string} [emptyMessage] - Thông báo khi danh sách rỗng.
 * @property {boolean} [showHistoryLink=false] - Hiện link tới trang lịch sử đầy đủ.
 * @property {boolean} [compact=false] - Ẩn header khi nhúng compact.
 */

/**
 * Panel danh sách nhật ký đóng góp đề với hành động theo trạng thái.
 *
 * @param {ExamContributionAuditListProps} props - Props của component.
 * @returns {import('react').ReactElement} Danh sách entry audit hoặc empty state.
 *
 * @example
 * <ExamContributionAuditList items={auditLog} showHistoryLink />
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

    const existingRevision = items.find(
      (entry) =>
        entry.revisionOfExamId === examId
        && (entry.status === "revision_draft" || entry.status === "pending_admin"),
    );
    if (existingRevision) {
      const editPath =
        item.examType === "practice"
          ? practiceEditPath(existingRevision.examApiId ?? existingRevision.id)
          : finalEditPath(existingRevision.examApiId ?? existingRevision.id);
      navigate(editPath);
      return;
    }

    setRevisionLoadingId(examId);
    try {
      const revision = await createExamRevisionViaApi(examId);
      const revisionId = revision?.id;
      if (!revisionId) {
        showToast("Không tạo được bản cập nhật.");
        return;
      }

      const editPath =
        item.examType === "practice"
          ? practiceEditPath(revisionId)
          : finalEditPath(revisionId);
      navigate(editPath);
      showToast("Mở bản cập nhật để chỉnh sửa. Đề public chưa thay đổi cho đến khi bạn gửi Admin duyệt.");
    } catch (error) {
      showToast(error?.message ?? "Không tạo được bản cập nhật.");
    } finally {
      setRevisionLoadingId(null);
    }
  }

  function renderActions(item) {
    const examId = item.examApiId ?? item.pendingId ?? item.id;
    const editPath =
      item.examType === "practice" ? practiceEditPath(examId) : finalEditPath(examId);

    if (item.status === "rejected" && item.canResubmit) {
      return (
        <Link to={editPath} className={styles.actionBtn}>
          Sửa & gửi lại
        </Link>
      );
    }

    if (
      (item.status === "revision_draft"
        || (item.status === "pending_admin" && item.revisionOfExamId))
      && item.canResubmit
    ) {
      return (
        <Link to={editPath} className={styles.actionBtn}>
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
