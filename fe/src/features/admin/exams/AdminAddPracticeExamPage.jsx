import { ExamFormFlowProvider, ADMIN_EXAM_FLOW } from "@/features/exams/examFormFlow";
import AddPracticeExamPage from "@/features/moderator/practiceExams/AddPracticeExamPage/AddPracticeExamPage";

function AdminAddPracticeExamPage() {
  return (
    <ExamFormFlowProvider value={ADMIN_EXAM_FLOW}>
      <AddPracticeExamPage />
    </ExamFormFlowProvider>
  );
}

export default AdminAddPracticeExamPage;
