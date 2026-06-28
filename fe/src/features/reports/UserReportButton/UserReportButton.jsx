import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag } from "@fortawesome/free-solid-svg-icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useToast } from "@/common/Toast/ToastProvider";
import * as usersApi from "@/api/usersApi";
import ReportReasonModal from "@/features/reports/ReportReasonModal/ReportReasonModal";
import styles from "@/features/feed/PostReportButton/PostReportButton.module.css";

function UserReportButton({
  className,
  userId,
  username,
  source,
  postId,
  examId,
  questionId,
  questionCommentId,
  label = "Báo cáo người dùng",
  variant = "icon",
}) {
  const { requireAuth } = useRequireAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);

  function handleClick(event) {
    event?.stopPropagation?.();
    if (!requireAuth("Vui lòng đăng nhập để báo cáo người dùng.")) return;
    setOpen(true);
  }

  async function handleSubmit({ reasonLabel, detail }) {
    await usersApi.reportUser(userId, {
      source,
      reason: reasonLabel,
      detail,
      postId: postId ?? undefined,
      examId: examId ?? undefined,
      questionId: questionId ?? undefined,
      questionCommentId: questionCommentId ?? undefined,
    });
    window.dispatchEvent(new CustomEvent("sehubs-user-reports-changed"));
    showToast("Đã gửi báo cáo người dùng. SEHub sẽ xem xét trong thời gian sớm nhất.");
  }

  const displayName = username?.startsWith("@") ? username : `@${username ?? "user"}`;

  return (
    <>
      {variant === "button" ? (
        <button type="button" className={className} onClick={handleClick}>
          <FontAwesomeIcon icon={faFlag} />
          {label}
        </button>
      ) : (
        <button
          type="button"
          className={className ?? styles.button}
          aria-label={label}
          title={label}
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={faFlag} />
        </button>
      )}

      <ReportReasonModal
        open={open}
        onClose={() => setOpen(false)}
        title="Báo cáo người dùng"
        subtitle={
          <>
            Bạn đang báo cáo tài khoản <strong>{displayName}</strong>
          </>
        }
        detailPlaceholder="Mô tả cụ thể hành vi vi phạm của người dùng này..."
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default UserReportButton;
