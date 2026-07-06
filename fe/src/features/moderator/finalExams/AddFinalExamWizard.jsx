import { useEffect } from "react";
import { Outlet, Route, Routes, useParams } from "react-router-dom";
import { useExamFormFlow } from "@/features/exams/examFormFlow";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import { FinalExamWizardProvider, useFinalExamWizard } from "@/features/moderator/finalExams/FinalExamWizardContext";
import ExamWizardStepper from "@/features/moderator/finalExams/components/ExamWizardStepper";
import FinalExamInfoStep from "@/features/moderator/finalExams/steps/FinalExamInfoStep";
import FinalExamQuestionsStep from "@/features/moderator/finalExams/steps/FinalExamQuestionsStep";
import FinalExamReviewStep from "@/features/moderator/finalExams/steps/FinalExamReviewStep";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import { ModeratorFormSkeleton } from "@/features/moderator/components/ModeratorSkeleton/ModeratorSkeleton";
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

function WizardStepRoutes() {
  const flow = useExamFormFlow();

  if (flow.useInternalRoutes) {
    return (
      <Routes>
        <Route index element={<FinalExamInfoStep />} />
        <Route path="questions" element={<FinalExamQuestionsStep />} />
        <Route path="review" element={<FinalExamReviewStep />} />
      </Routes>
    );
  }

  return <Outlet />;
}

function WizardShell({ children }) {
  const flow = useExamFormFlow();

  if (flow.scope === "admin") {
    return (
      <AdminPageLayout
        title="Thêm đề cuối kỳ"
        subtitle="Nhập thông tin, câu hỏi và xuất bản trực tiếp."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Quản lý đề thi", to: "/admin/exams" },
          { label: "Thêm mới", to: flow.examsNewPath },
          { label: "Đề cuối kỳ" },
        ]}
        hidePageHeader={false}
      >
        <div className={styles.layout}>
          <ExamWizardStepper />
          <div className={styles.main}>{children}</div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <ModeratorPageShell variant="wizard">
      <div className={styles.layout}>
        <ExamWizardStepper />
        <div className={styles.main}>{children}</div>
      </div>
    </ModeratorPageShell>
  );
}

function WizardContent() {
  const flow = useExamFormFlow();
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
    return <ModeratorFormSkeleton aria-label="Đang tải đề để chỉnh sửa" />;
  }

  if (examId && loadExamError) {
    return <p className={styles.error}>{loadExamError}</p>;
  }

  return (
    <>
      {flow.scope === "moderator" ? (
        <WizardMetaSync isEditMode={isEditMode} isRevisionEdit={isRevisionEdit} />
      ) : null}
      <WizardShell>
        <WizardStepRoutes />
      </WizardShell>
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
