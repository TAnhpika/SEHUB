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

const FinalExamWizardContext = createContext(null);

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

export function useFinalExamWizard() {
  const context = useContext(FinalExamWizardContext);
  if (!context) {
    throw new Error("useFinalExamWizard must be used within FinalExamWizardProvider");
  }
  return context;
}
