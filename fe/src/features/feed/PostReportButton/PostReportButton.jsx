import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag } from "@fortawesome/free-solid-svg-icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import ReportPostModal from "@/features/feed/ReportPostModal/ReportPostModal";
import styles from "./PostReportButton.module.css";

function PostReportButton({ className, postId, postTitle }) {
  const { requireAuth } = useRequireAuth();
  const [open, setOpen] = useState(false);

  function handleClick(event) {
    event.stopPropagation();
    if (!requireAuth("Vui lòng đăng nhập để báo cáo bài viết.")) return;
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={className ?? styles.button}
        aria-label="Báo cáo bài viết"
        title="Báo cáo bài viết"
        onClick={handleClick}
      >
        <FontAwesomeIcon icon={faFlag} />
      </button>

      <ReportPostModal
        open={open}
        onClose={handleClose}
        postId={postId}
        postTitle={postTitle}
      />
    </>
  );
}

export default PostReportButton;
