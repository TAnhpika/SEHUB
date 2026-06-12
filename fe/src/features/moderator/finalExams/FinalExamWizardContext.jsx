import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ANSWER_KEYS,
  clampQuestionTotal,
  createEmptyFinalExamInfo,
  createEmptyQuestion,
} from "@/features/moderator/finalExams/finalExamData";

const FinalExamWizardContext = createContext(null);

function buildQuestionSlots(total, existing = []) {
  const max = clampQuestionTotal(total);
  if (existing.length === max) return existing;
  if (existing.length > max) return existing.slice(0, max);
  return existing.concat(
    Array.from({ length: max - existing.length }, (_, index) =>
      createEmptyQuestion(`q-${existing.length + index + 1}`),
    ),
  );
}

export function FinalExamWizardProvider({ children }) {
  const [examInfo, setExamInfoState] = useState(createEmptyFinalExamInfo);
  const [questions, setQuestions] = useState(() => [createEmptyQuestion("q-1")]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  useEffect(() => {
    setQuestions((prev) => buildQuestionSlots(examInfo.totalQuestions, prev));
    setActiveQuestionIndex((prev) => Math.min(prev, Math.max(0, examInfo.totalQuestions - 1)));
  }, [examInfo.totalQuestions]);

  const completeCount = useMemo(
    () =>
      questions.filter(
        (question) =>
          question.content.trim() &&
          ANSWER_KEYS.every((key) => question.answers[key]?.trim()),
      ).length,
    [questions],
  );

  const enteredCount = questions.length;

  function setExamInfo(updater) {
    setExamInfoState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return {
        ...next,
        totalQuestions: clampQuestionTotal(next.totalQuestions, prev.totalQuestions),
      };
    });
  }

  const value = useMemo(
    () => ({
      examInfo,
      setExamInfo,
      questions,
      setQuestions,
      activeQuestionIndex,
      setActiveQuestionIndex,
      enteredCount,
      completeCount,
      totalQuestions: examInfo.totalQuestions,
      progressPercent: Math.round(
        (completeCount / Math.max(1, examInfo.totalQuestions)) * 100,
      ),
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
      addQuestion() {
        if (questions.length >= examInfo.totalQuestions) return false;
        const next = createEmptyQuestion(`q-${questions.length + 1}`);
        setQuestions((prev) => [...prev, next]);
        setActiveQuestionIndex(questions.length);
        return true;
      },
      removeActiveQuestion() {
        if (questions.length <= 1) return;
        setQuestions((prev) => prev.filter((_, index) => index !== activeQuestionIndex));
        setActiveQuestionIndex((prev) => Math.max(0, prev - 1));
      },
    }),
    [examInfo, questions, activeQuestionIndex, enteredCount, completeCount],
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
