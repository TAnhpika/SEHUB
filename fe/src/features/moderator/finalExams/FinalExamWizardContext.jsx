import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  ANSWER_KEYS,
  EMPTY_FINAL_EXAM_INFO,
  buildEmptyQuestions,
  createEmptyQuestion,
  parseTotalQuestions,
} from "@/features/moderator/finalExams/finalExamData";

const FinalExamWizardContext = createContext(null);

export function FinalExamWizardProvider({ children }) {
  const [examInfo, setExamInfo] = useState(EMPTY_FINAL_EXAM_INFO);
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const totalQuestions = examInfo.totalQuestions;

  const completeCount = useMemo(
    () =>
      questions.filter(
        (question) =>
          question.content.trim() &&
          ANSWER_KEYS.every((key) => question.answers[key]?.trim()),
      ).length,
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
