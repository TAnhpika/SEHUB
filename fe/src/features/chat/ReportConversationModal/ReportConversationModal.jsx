import { useState } from "react";
import ReportFormModal from "@/common/ReportFormModal/ReportFormModal";
import { useToast } from "@/common/Toast/ToastProvider";
import { reportConversation } from "@/api/messagesApi";
import { MIN_REPORT_DETAIL_LENGTH, REPORT_REASONS } from "@/features/feed/ReportPostModal/reportData";

function ReportConversationModal({ open, onClose, conversationId, conversationName }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit({ reasonLabel, detail }) {
    setSubmitting(true);
    try {
      await reportConversation(conversationId, {
        reason: reasonLabel,
        detail,
      });
      showToast("Đã gửi báo cáo hội thoại. SEHub sẽ xem xét trong thời gian sớm nhất.");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ReportFormModal
      open={open}
      onClose={onClose}
      title="Báo cáo hội thoại"
      subtitle={
        conversationName ? (
          <p>
            Bạn đang báo cáo cuộc trò chuyện với <strong>{conversationName}</strong>
          </p>
        ) : (
          <p>Vui lòng cho chúng tôi biết lý do bạn muốn báo cáo hội thoại này.</p>
        )
      }
      reasons={REPORT_REASONS}
      minDetailLength={MIN_REPORT_DETAIL_LENGTH}
      detailPlaceholder="Mô tả cụ thể vấn đề bạn gặp phải trong hội thoại này..."
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  );
}

export default ReportConversationModal;
