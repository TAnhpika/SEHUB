import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag } from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./PostReportButton.module.css";

function PostReportButton({ className, postId }) {
  const { requireAuth } = useRequireAuth();
  const { showToast } = useToast();

  function handleClick(event) {
    event.stopPropagation();
    if (!requireAuth("Vui lòng đăng nhập để báo cáo bài viết.")) return;

    showToast(
      postId
        ? "Đã gửi báo cáo bài viết. SEHub sẽ xem xét trong thời gian sớm nhất."
        : "Đã gửi báo cáo. SEHub sẽ xem xét trong thời gian sớm nhất.",
    );
  }

  return (
    <button
      type="button"
      className={className ?? styles.button}
      aria-label="Báo cáo bài viết"
      title="Báo cáo bài viết"
      onClick={handleClick}
    >
      <FontAwesomeIcon icon={faFlag} />
    </button>
  );
}

export default PostReportButton;
