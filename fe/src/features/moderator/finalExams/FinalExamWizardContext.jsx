import { createContext, useContext, useMemo, useState } from "react";
import {
  FINAL_EXAM_INFO_MOCK,
  buildFinalExamQuestionsMock,
} from "@/features/moderator/moderatorMockData";
import {
  ANSWER_KEYS,
  createEmptyQuestion,
} from "@/features/moderator/finalExams/finalExamData";

const FinalExamWizardContext = createContext(null);

export function FinalExamWizardProvider({ children }) {
  const [examInfo, setExamInfo] = useState(FINAL_EXAM_INFO_MOCK);
  const [questions, setQuestions] = useState(() => buildFinalExamQuestionsMock());
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(() =>
    buildFinalExamQuestionsMock().length - 1,
  );

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
      progressPercent: Math.round((enteredCount / examInfo.totalQuestions) * 100),
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
        const nextIndex = questions.length + 1;
        if (nextIndex > examInfo.totalQuestions) return false;
        const next = createEmptyQuestion(`q-${nextIndex}`);
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
