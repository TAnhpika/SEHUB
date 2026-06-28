import { useState } from "react";
import ReportFormModal from "@/common/ReportFormModal/ReportFormModal";
import { useToast } from "@/common/Toast/ToastProvider";
import { submitReport } from "@/features/feed/feedData";
import { MIN_REPORT_DETAIL_LENGTH, REPORT_REASONS } from "./reportData";

function ReportPostModal({ open, onClose, postId, postTitle }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit({ reasonLabel, detail }) {
    setSubmitting(true);
    try {
      await submitReport(postId, `${reasonLabel}: ${detail}`);
      showToast("Đã gửi báo cáo bài viết. SEHub sẽ xem xét trong thời gian sớm nhất.");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ReportFormModal
      open={open}
      onClose={onClose}
      title="Báo cáo bài viết"
      subtitle={
        postTitle ? (
          <p>
            Bạn đang báo cáo: <strong>{postTitle}</strong>
          </p>
        ) : (
          <p>Vui lòng cho chúng tôi biết lý do bạn muốn báo cáo bài viết này.</p>
        )
      }
      reasons={REPORT_REASONS}
      minDetailLength={MIN_REPORT_DETAIL_LENGTH}
      detailPlaceholder="Mô tả cụ thể vấn đề bạn gặp phải với bài viết này..."
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  );
}

export default ReportPostModal;
