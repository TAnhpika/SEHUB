import { Outlet } from "react-router-dom";
import { FinalExamWizardProvider } from "@/features/moderator/finalExams/FinalExamWizardContext";
import ExamWizardStepper from "@/features/moderator/finalExams/components/ExamWizardStepper";
import ModeratorBreadcrumb from "@/features/moderator/finalExams/components/ModeratorBreadcrumb";
import styles from "./AddFinalExamWizard.module.css";

function AddFinalExamWizard() {
  return (
    <FinalExamWizardProvider>
      <div className={styles.page}>
        <ModeratorBreadcrumb current="Thêm đề cuối kỳ" />
        <div className={styles.layout}>
          <ExamWizardStepper />
          <div className={styles.main}>
            <Outlet />
          </div>
        </div>
      </div>
    </FinalExamWizardProvider>
  );
}

export default AddFinalExamWizard;
