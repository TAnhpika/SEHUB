import { ExamFormFlowProvider, ADMIN_EXAM_FLOW } from "@/features/exams/examFormFlow";
import AddFinalExamWizard from "@/features/moderator/finalExams/AddFinalExamWizard";

function AdminAddFinalExamWizard() {
  return (
    <ExamFormFlowProvider value={ADMIN_EXAM_FLOW}>
      <AddFinalExamWizard />
    </ExamFormFlowProvider>
  );
}

export default AdminAddFinalExamWizard;
