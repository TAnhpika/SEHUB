import { useEffect } from "react";
import { Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import * as adminApi from "@/api/adminApi";
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
import { createExamRevisionViaApi } from "@/features/moderator/exams/moderatorExamService";
import styles from "./AddFinalExamWizard.module.css";

/**
 * @fileoverview Wizard tạo / sửa đề cuối kỳ cho Moderator và Admin trong SEHUB.
 *
 * Module này cung cấp luồng 3 bước:
 * - Bước 1: Nhập metadata đề (môn, học kỳ, mã đề, thời gian, số câu).
 * - Bước 2: Soạn hoặc import câu hỏi trắc nghiệm.
 * - Bước 3: Xem lại và gửi duyệt (Moderator) hoặc xuất bản trực tiếp (Admin).
 *
 * Hỗ trợ chế độ chỉnh sửa đề đã gửi, chỉnh sửa bản revision của đề đã public,
 * và đồng bộ breadcrumb/tiêu đề trang qua `ModeratorPageContext`.
 *
 * @module features/moderator/finalExams/AddFinalExamWizard
 * @see {@link module:features/moderator/finalExams/FinalExamWizardContext} — state wizard dùng chung
 */

/**
 * Breadcrumb khi Moderator tạo đề cuối kỳ mới.
 *
 * @constant {ReadonlyArray<{ label: string, to?: string }>}
 * @readonly
 */
const ADD_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Đóng góp" },
  { label: "Thêm đề cuối kỳ" },
];

/**
 * Breadcrumb khi Moderator sửa đề cuối kỳ đã gửi hoặc bản cập nhật.
 *
 * @constant {ReadonlyArray<{ label: string, to?: string }>}
 * @readonly
 */
const EDIT_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Đóng góp" },
  { label: "Lịch sử đóng góp đề", to: "/moderator/exams/history?type=final" },
  { label: "Sửa đề cuối kỳ" },
];

/**
 * @typedef {Object} WizardMetaSyncProps
 * @property {boolean} isEditMode - `true` khi đang chỉnh sửa đề đã tồn tại.
 * @property {boolean} isRevisionEdit - `true` khi chỉnh sửa bản nháp cập nhật của đề đã public.
 */

/**
 * Đồng bộ tiêu đề, mô tả và breadcrumb lên `ModeratorPageShell` theo chế độ wizard.
 *
 * Component render `null` — chỉ chạy side-effect qua `useModeratorPage().setPageMeta`.
 *
 * @param {WizardMetaSyncProps} props - Props của component.
 * @returns {null}
 */
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

/**
 * Render route nội bộ 3 bước wizard hoặc `Outlet` khi dùng route cha bên ngoài.
 *
 * Khi `useExamFormFlow().useInternalRoutes` bật, mount trực tiếp các step component;
 * ngược lại delegate cho React Router `Outlet`.
 *
 * @returns {import('react').ReactElement} Route nội bộ hoặc outlet.
 */
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

/**
 * @typedef {Object} WizardShellProps
 * @property {import('react').ReactNode} children - Nội dung step hiện tại.
 */

/**
 * Bọc layout wizard (stepper + main) theo scope Admin hoặc Moderator.
 *
 * Admin dùng `AdminPageLayout`; Moderator dùng `ModeratorPageShell` variant wizard.
 *
 * @param {WizardShellProps} props - Props của component.
 * @returns {import('react').ReactElement} Layout shell kèm stepper.
 */
function WizardShell({ children }) {
  const flow = useExamFormFlow();
  const { isEditMode, isRevisionEdit } = useFinalExamWizard();

  if (flow.scope === "admin") {
    const title = isEditMode
      ? isRevisionEdit
        ? "Cập nhật đề đã xuất bản"
        : "Sửa đề cuối kỳ"
      : "Thêm đề cuối kỳ";
    const subtitle = isEditMode
      ? isRevisionEdit
        ? "Chỉnh sửa bản revision và xuất bản thay thế đề đang public."
        : "Chỉnh sửa thông tin và câu hỏi, sau đó xuất bản."
      : "Nhập thông tin, câu hỏi và xuất bản trực tiếp.";

    const breadcrumbs = isEditMode
      ? [
          { label: "Dashboard", to: "/admin" },
          { label: "Quản lý đề thi", to: "/admin/exams" },
          { label: "Sửa đề cuối kỳ" },
        ]
      : [
          { label: "Dashboard", to: "/admin" },
          { label: "Quản lý đề thi", to: "/admin/exams" },
          { label: "Thêm mới", to: flow.examsNewPath },
          { label: "Đề cuối kỳ" },
        ];

    return (
      <AdminPageLayout
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
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

/**
 * Nội dung chính wizard: tải đề khi edit, hiển thị skeleton/lỗi, mount shell và routes.
 *
 * Tự động gọi `loadExamForEdit` khi URL có `examId`, hoặc `resetWizard` khi tạo mới.
 *
 * @returns {import('react').ReactElement} Skeleton, thông báo lỗi, hoặc wizard đầy đủ.
 */
function WizardContent() {
  const flow = useExamFormFlow();
  const navigate = useNavigate();
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
      return undefined;
    }

    let cancelled = false;

    async function initEdit() {
      if (flow.scope === "admin") {
        const dto = await adminApi.getExam(examId);
        if (cancelled) return;

        const isPublished = String(dto.status ?? "").toLowerCase() === "published";
        const isRevision = Boolean(dto.revisionOfExamId);
        if (isPublished && !isRevision) {
          const revision = await createExamRevisionViaApi(examId);
          if (cancelled) return;
          const revisionId = revision.id ?? revision.Id;
          navigate(`${flow.finalExamEditPathPrefix}/${revisionId}`, { replace: true });
          return;
        }
      }

      await loadExamForEdit(examId);
    }

    initEdit().catch(() => {
      /* error surfaced via loadExamError */
    });

    return () => {
      cancelled = true;
    };
  }, [examId, flow.finalExamEditPathPrefix, flow.scope, loadExamForEdit, navigate, resetWizard]);

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

/**
 * Entry point wizard thêm / sửa đề cuối kỳ.
 *
 * Bọc toàn bộ cây component trong `FinalExamWizardProvider` để chia sẻ state wizard.
 *
 * @returns {import('react').ReactElement} Wizard đề cuối kỳ.
 *
 * @example
 * // Route Moderator:
 * // /moderator/final-exams/add
 * // /moderator/final-exams/edit/:examId
 */
function AddFinalExamWizard() {
  return (
    <FinalExamWizardProvider>
      <WizardContent />
    </FinalExamWizardProvider>
  );
}

export default AddFinalExamWizard;
