import ReportFormModal from "@/common/ReportFormModal/ReportFormModal";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import {
  EXAM_QUESTION_REPORT_REASONS,
  EXAM_REPORT_ROUTING,
  MIN_EXAM_REPORT_DETAIL_LENGTH,
} from "@/features/exams/examQuestionReportData";
import { submitExamQuestionReport } from "@/features/exams/examQuestionReportStore";

function ExamQuestionReportModal({
  open,
  onClose,
  examId,
  courseCode,
  questionIndex,
  question,
}) {
  const { showToast } = useToast();
  const { user } = useAuth();

  if (!open || !question) return null;

<<<<<<< HEAD
  async function handleSubmit({ reason, detail }) {
=======
  async function handleSubmit({ reason, reasonLabel, detail }) {
>>>>>>> 15fa31b4c9634aaa4f27b4b0408b3c74d0f67faf
    const report = await submitExamQuestionReport({
      examId,
      courseCode,
      questionId: question.id,
      questionIndex,
      question,
      reason,
      detail,
      reporter: user,
    });
    showToast(
      `Đã gửi báo cáo ${report.code} tới ${EXAM_REPORT_ROUTING.assigneeLabel}. Cảm ơn bạn đã góp ý!`,
    );
    onClose();
  }

  return (
    <ReportFormModal
      open={open}
      onClose={onClose}
      title="Báo cáo câu hỏi ôn tập"
      subtitle={
        <>
          <p>
            {courseCode ?? examId} · Câu {questionIndex}
          </p>
          <p>{EXAM_REPORT_ROUTING.description}</p>
        </>
      }
      reasons={EXAM_QUESTION_REPORT_REASONS}
      minDetailLength={MIN_EXAM_REPORT_DETAIL_LENGTH}
      detailPlaceholder="Ví dụ: đáp án hệ thống ghi B nhưng theo giải thích AI và tài liệu chương 3 cho thấy đáp án đúng là C…"
      footerNote={
        <p>
          Người xử lý: <strong>{EXAM_REPORT_ROUTING.assigneeLabel}</strong> · Escalate:{" "}
          <strong>{EXAM_REPORT_ROUTING.escalationLabel}</strong>
        </p>
      }
<<<<<<< HEAD
      onSubmit={({ reasonId, detail }) => handleSubmit({ reason: reasonId, detail })}
=======
      onSubmit={({ reasonId, reasonLabel, detail }) =>
        handleSubmit({ reason: reasonId, reasonLabel, detail })
      }
>>>>>>> 15fa31b4c9634aaa4f27b4b0408b3c74d0f67faf
    />
  );
}

export default ExamQuestionReportModal;
