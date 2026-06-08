import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag } from "@fortawesome/free-solid-svg-icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import ExamQuestionReportModal from "@/features/exams/ExamQuestionReportModal/ExamQuestionReportModal";

function ExamQuestionReportButton({
  className,
  examId,
  courseCode,
  questionIndex,
  question,
}) {
  const { requireAuth } = useRequireAuth();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (!requireAuth("Vui lòng đăng nhập để báo cáo câu hỏi.")) return;
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label="Báo cáo câu hỏi"
        title="Báo cáo lỗi câu hỏi / đáp án cho Moderator"
        onClick={handleClick}
      >
        <FontAwesomeIcon icon={faFlag} />
      </button>

      <ExamQuestionReportModal
        open={open}
        onClose={() => setOpen(false)}
        examId={examId}
        courseCode={courseCode}
        questionIndex={questionIndex}
        question={question}
      />
    </>
  );
}

export default ExamQuestionReportButton;
