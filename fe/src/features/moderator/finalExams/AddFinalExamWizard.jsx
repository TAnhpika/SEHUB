import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import { FinalExamWizardProvider } from "@/features/moderator/finalExams/FinalExamWizardContext";
import ExamWizardStepper from "@/features/moderator/finalExams/components/ExamWizardStepper";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import styles from "./AddFinalExamWizard.module.css";

const WIZARD_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Đóng góp" },
  { label: "Thêm đề cuối kỳ" },
];

function WizardMetaSync() {
  const { setPageMeta } = useModeratorPage();

  useEffect(() => {
    setPageMeta({
      title: "Thêm đề cuối kỳ",
      description: "",
      crumbs: WIZARD_CRUMBS,
      actions: null,
    });
    return () => setPageMeta({ title: "", description: "", crumbs: [], actions: null });
  }, [setPageMeta]);

  return null;
}

function AddFinalExamWizard() {
  return (
    <FinalExamWizardProvider>
      <WizardMetaSync />
      <ModeratorPageShell variant="wizard">
        <div className={styles.layout}>
          <ExamWizardStepper />
          <div className={styles.main}>
            <Outlet />
          </div>
        </div>
      </ModeratorPageShell>
    </FinalExamWizardProvider>
  );
}

export default AddFinalExamWizard;
