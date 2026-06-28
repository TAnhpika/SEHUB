import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag } from "@fortawesome/free-solid-svg-icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useToast } from "@/common/Toast/ToastProvider";
import * as postsApi from "@/api/postsApi";
import ReportReasonModal from "@/features/reports/ReportReasonModal/ReportReasonModal";
import styles from "@/features/feed/PostReportButton/PostReportButton.module.css";

function CommentReportButton({ className, postId, commentId, commentPreview }) {
  const { requireAuth } = useRequireAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);

  function handleClick(event) {
    event.stopPropagation();
    if (!requireAuth("Vui lòng đăng nhập để báo cáo bình luận.")) return;
    setOpen(true);
  }

  async function handleSubmit({ reasonLabel, detail }) {
    await postsApi.reportComment(postId, commentId, {
      reason: reasonLabel,
      detail,
    });
    showToast("Đã gửi báo cáo bình luận. SEHub sẽ xem xét trong thời gian sớm nhất.");
  }

  const preview =
    commentPreview?.length > 80 ? `${commentPreview.slice(0, 80)}…` : commentPreview;

  return (
    <>
      <button
        type="button"
        className={className ?? styles.button}
        aria-label="Báo cáo bình luận"
        title="Báo cáo bình luận"
        onClick={handleClick}
      >
        <FontAwesomeIcon icon={faFlag} />
      </button>

      <ReportReasonModal
        open={open}
        onClose={() => setOpen(false)}
        title="Báo cáo bình luận"
        subtitle={
          preview ? (
            <>
              Bạn đang báo cáo: <strong>{preview}</strong>
            </>
          ) : (
            "Vui lòng cho chúng tôi biết lý do bạn muốn báo cáo bình luận này."
          )
        }
        detailPlaceholder="Mô tả cụ thể vấn đề bạn gặp phải với bình luận này..."
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default CommentReportButton;
