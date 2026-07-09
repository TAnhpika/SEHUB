import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useExamFormFlow } from "@/features/exams/examFormFlow";
import {
  ANSWER_KEYS,
  EMPTY_FINAL_EXAM_INFO,
  buildEmptyQuestions,
  createEmptyQuestion,
  getWizardSteps,
  isQuestionComplete,
  parseTotalQuestions,
} from "@/features/moderator/finalExams/finalExamData";
import { loadExamForWizardEdit } from "@/features/moderator/exams/moderatorExamService";

/**
 * @fileoverview React Context quản lý state wizard tạo / sửa đề cuối kỳ.
 *
 * Cung cấp:
 * - Metadata đề (`examInfo`), danh sách câu hỏi, chỉ số câu đang soạn.
 * - Tiến độ hoàn thiện, đồng bộ số slot câu hỏi theo `totalQuestions`.
 * - Chế độ edit / revision edit và tải đề từ API.
 * - Helper cập nhật câu hỏi / đáp án đang active.
 *
 * @module features/moderator/finalExams/FinalExamWizardContext
 * @see {@link module:features/moderator/finalExams/finalExamData} — hằng số và helper câu hỏi
 */

/** @type {import('react').Context<import('./FinalExamWizardContext').FinalExamWizardContextValue | null>} */
const FinalExamWizardContext = createContext(null);

/**
 * @typedef {Object} FinalExamWizardContextValue
 * @property {import('@/features/moderator/finalExams/finalExamData').EMPTY_FINAL_EXAM_INFO} examInfo - Metadata đề hiện tại.
 * @property {import('react').Dispatch<import('react').SetStateAction<object>>} setExamInfo - Cập nhật metadata đề.
 * @property {Array<object>} questions - Danh sách câu hỏi wizard.
 * @property {import('react').Dispatch<import('react').SetStateAction<Array<object>>>} setQuestions - Cập nhật toàn bộ câu hỏi.
 * @property {number} activeQuestionIndex - Chỉ số câu hỏi đang soạn (0-based).
 * @property {import('react').Dispatch<import('react').SetStateAction<number>>} setActiveQuestionIndex - Chuyển câu đang soạn.
 * @property {number} completeCount - Số câu đã hoàn thiện theo `isQuestionComplete`.
 * @property {number} totalQuestions - Tổng số câu theo metadata.
 * @property {number} progressPercent - Phần trăm hoàn thiện (0–100).
 * @property {(count?: number) => void} ensureQuestionSlots - Đồng bộ độ dài mảng `questions` với số câu mục tiêu.
 * @property {string | null} editingExamId - ID đề đang chỉnh sửa (null khi tạo mới).
 * @property {string | null} revisionOfExamId - ID đề gốc khi đang sửa bản revision.
 * @property {boolean} isEditMode - `true` khi `editingExamId` có giá trị.
 * @property {boolean} isRevisionEdit - `true` khi chỉnh sửa bản cập nhật đề đã public.
 * @property {string} basePath - Đường dẫn gốc wizard (add hoặc edit).
 * @property {Array<{ id: number, path: string, title: string, hint: string }>} wizardSteps - Cấu hình 3 bước wizard.
 * @property {boolean} loadingExam - Đang tải đề để chỉnh sửa.
 * @property {string | null} loadExamError - Thông báo lỗi khi tải đề thất bại.
 * @property {(examId: string) => Promise<object>} loadExamForEdit - Tải đề từ API và hydrate state.
 * @property {() => void} resetWizard - Đặt lại toàn bộ state về mặc định tạo mới.
 * @property {boolean} publishesDirectly - Admin xuất bản trực tiếp, không qua duyệt.
 * @property {string} flowScope - `'admin'` hoặc `'moderator'`.
 * @property {(patch: object) => void} updateActiveQuestion - Gộp patch vào câu hỏi đang active.
 * @property {(key: string, text: string) => void} updateActiveAnswer - Cập nhật nội dung một phương án đáp án.
 */

/**
 * @typedef {Object} FinalExamWizardProviderProps
 * @property {import('react').ReactNode} children - Cây component con dùng `useFinalExamWizard`.
 */

/**
 * Provider chia sẻ state wizard đề cuối kỳ cho toàn bộ cây component con.
 *
 * @param {FinalExamWizardProviderProps} props - Props của provider.
 * @returns {import('react').ReactElement} Context provider.
 */
export function FinalExamWizardProvider({ children }) {
  const flow = useExamFormFlow();
  const [examInfo, setExamInfo] = useState(EMPTY_FINAL_EXAM_INFO);
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [editingExamId, setEditingExamId] = useState(null);
  const [revisionOfExamId, setRevisionOfExamId] = useState(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [loadExamError, setLoadExamError] = useState(null);

  const basePath = editingExamId
    ? `${flow.finalExamEditPathPrefix}/${editingExamId}`
    : flow.finalExamPath;
  const wizardSteps = useMemo(() => getWizardSteps(basePath), [basePath]);
  const isEditMode = Boolean(editingExamId);
  const isRevisionEdit = Boolean(revisionOfExamId);

  const totalQuestions = examInfo.totalQuestions;

  const completeCount = useMemo(
    () => questions.filter(isQuestionComplete).length,
    [questions],
  );

  const ensureQuestionSlots = useCallback((count = totalQuestions) => {
    const target = parseTotalQuestions(count) ?? 1;

    setQuestions((prev) => {
      if (prev.length === target) {
        return prev;
      }

      if (prev.length === 0) {
        return buildEmptyQuestions(target);
      }

      if (prev.length < target) {
        const extra = Array.from({ length: target - prev.length }, (_, index) =>
          createEmptyQuestion(`q-${prev.length + index + 1}`),
        );
        return [...prev, ...extra];
      }

      return prev.slice(0, target).map((question, index) => ({
        ...question,
        id: `q-${index + 1}`,
      }));
    });

    setActiveQuestionIndex((prev) => Math.min(prev, target - 1));
  }, [totalQuestions]);

  const resetWizard = useCallback(() => {
    setExamInfo(EMPTY_FINAL_EXAM_INFO);
    setQuestions([]);
    setActiveQuestionIndex(0);
    setEditingExamId(null);
    setRevisionOfExamId(null);
    setLoadExamError(null);
  }, []);

  const loadExamForEdit = useCallback(async (examId) => {
    setLoadingExam(true);
    setLoadExamError(null);
    try {
      const loaded = await loadExamForWizardEdit(examId);
      setEditingExamId(loaded.examId);
      setRevisionOfExamId(loaded.revisionOfExamId ?? null);
      setExamInfo(loaded.examInfo);
      setQuestions(loaded.questions ?? buildEmptyQuestions(loaded.examInfo.totalQuestions));
      setActiveQuestionIndex(0);
      return loaded;
    } catch (error) {
      setLoadExamError(error?.message ?? "Không tải được đề để chỉnh sửa.");
      throw error;
    } finally {
      setLoadingExam(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      examInfo,
      setExamInfo,
      questions,
      setQuestions,
      activeQuestionIndex,
      setActiveQuestionIndex,
      completeCount,
      totalQuestions,
      progressPercent:
        totalQuestions > 0 ? Math.round((completeCount / totalQuestions) * 100) : 0,
      ensureQuestionSlots,
      editingExamId,
      revisionOfExamId,
      isEditMode,
      isRevisionEdit,
      basePath,
      wizardSteps,
      loadingExam,
      loadExamError,
      loadExamForEdit,
      resetWizard,
      publishesDirectly: flow.publishesDirectly,
      flowScope: flow.scope,
      updateActiveQuestion(patch) {
        setQuestions((prev) =>
          prev.map((item, index) =>
            index === activeQuestionIndex ? { ...item, ...patch } : item,
          ),
        );
      },
      updateActiveAnswer(key, text) {
        setQuestions((prev) =>
          prev.map((item, index) =>
            index === activeQuestionIndex
              ? { ...item, answers: { ...item.answers, [key]: text } }
              : item,
          ),
        );
      },
    }),
    [
      examInfo,
      questions,
      activeQuestionIndex,
      completeCount,
      totalQuestions,
      ensureQuestionSlots,
      editingExamId,
      revisionOfExamId,
      isEditMode,
      isRevisionEdit,
      basePath,
      wizardSteps,
      loadingExam,
      loadExamError,
      loadExamForEdit,
      resetWizard,
      flow.publishesDirectly,
      flow.scope,
    ],
  );

  return (
    <FinalExamWizardContext.Provider value={value}>
      {children}
    </FinalExamWizardContext.Provider>
  );
}

/**
 * Hook truy cập context wizard đề cuối kỳ.
 *
 * @returns {FinalExamWizardContextValue} Giá trị context wizard.
 * @throws {Error} Khi gọi ngoài `FinalExamWizardProvider`.
 *
 * @example
 * const { examInfo, questions, ensureQuestionSlots } = useFinalExamWizard();
 */
export function useFinalExamWizard() {
  const context = useContext(FinalExamWizardContext);
  if (!context) {
    throw new Error("useFinalExamWizard must be used within FinalExamWizardProvider");
  }
  return context;
}
