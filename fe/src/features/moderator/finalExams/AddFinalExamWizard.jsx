import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import { FinalExamWizardProvider, useFinalExamWizard } from "@/features/moderator/finalExams/FinalExamWizardContext";
import ExamWizardStepper from "@/features/moderator/finalExams/components/ExamWizardStepper";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import styles from "./AddFinalExamWizard.module.css";

const ADD_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Đóng góp" },
  { label: "Thêm đề cuối kỳ" },
];

const EDIT_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Đóng góp" },
  { label: "Lịch sử đóng góp đề", to: "/moderator/exams/history?type=final" },
  { label: "Sửa đề cuối kỳ" },
];

function WizardMetaSync({ isEditMode, isRevisionEdit }) {
  const { setPageMeta } = useModeratorPage();

  useEffect(() => {
    const title = isEditMode
      ? isRevisionEdit
        ? "Cập nhật đề đã xuất bản"
        : "Sửa & gửi lại đề"
      : "Thêm đề cuối kỳ";

    setPageMeta({
      title,
      description: isRevisionEdit
        ? "Chỉnh sửa bản nháp cập nhật. Đề đang public giữ nguyên cho đến khi Admin duyệt."
        : "",
      crumbs: isEditMode ? EDIT_CRUMBS : ADD_CRUMBS,
      actions: null,
    });
    return () => setPageMeta({ title: "", description: "", crumbs: [], actions: null });
  }, [setPageMeta, isEditMode, isRevisionEdit]);

  return null;
}

function WizardContent() {
  const { examId } = useParams();
  const {
    loadExamForEdit,
    loadingExam,
    loadExamError,
    isEditMode,
    isRevisionEdit,
    resetWizard,
  } = useFinalExamWizard();

  useEffect(() => {
    if (!examId) {
      resetWizard();
      return;
    }

    loadExamForEdit(examId).catch(() => {
      /* error surfaced via loadExamError */
    });
  }, [examId, loadExamForEdit, resetWizard]);

  if (examId && loadingExam) {
    return <p className={styles.loading}>Đang tải đề để chỉnh sửa...</p>;
  }

  if (examId && loadExamError) {
    return <p className={styles.error}>{loadExamError}</p>;
  }

  return (
    <>
      <WizardMetaSync isEditMode={isEditMode} isRevisionEdit={isRevisionEdit} />
      <ModeratorPageShell variant="wizard">
        <div className={styles.layout}>
          <ExamWizardStepper />
          <div className={styles.main}>
            <Outlet />
          </div>
        </div>
      </ModeratorPageShell>
    </>
  );
}

function AddFinalExamWizard() {
  return (
    <FinalExamWizardProvider>
      <WizardContent />
    </FinalExamWizardProvider>
  );
}

export default AddFinalExamWizard;
