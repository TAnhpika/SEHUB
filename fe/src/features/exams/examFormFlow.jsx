import { createContext, useContext, useMemo } from "react";

export const MODERATOR_EXAM_FLOW = {
  scope: "moderator",
  publishesDirectly: false,
  basePath: "/moderator",
  finalExamPath: "/moderator/final-exams/add",
  finalExamEditPathPrefix: "/moderator/final-exams/edit",
  practiceExamPath: "/moderator/practice-exams/add",
  examsListPath: "/moderator/exams/history",
  examsNewPath: null,
  breadcrumbRoot: "Moderator",
  // Keep steps inside the wizard tree (eager imports) so Suspense on App.jsx
  // lazy routes cannot remount FinalExamWizardProvider and wipe in-progress state.
  useInternalRoutes: true,
};

export const ADMIN_EXAM_FLOW = {
  scope: "admin",
  publishesDirectly: true,
  basePath: "/admin",
  finalExamPath: "/admin/exams/new/final",
  finalExamEditPathPrefix: "/admin/exams/final/edit",
  practiceExamPath: "/admin/exams/new/practice",
  examsListPath: "/admin/exams",
  examsNewPath: "/admin/exams/new",
  breadcrumbRoot: "Admin",
  useInternalRoutes: true,
};

const ExamFormFlowContext = createContext(null);

export function ExamFormFlowProvider({ value, children }) {
  const memoized = useMemo(() => value, [value]);
  return (
    <ExamFormFlowContext.Provider value={memoized}>{children}</ExamFormFlowContext.Provider>
  );
}

export function useExamFormFlow() {
  const context = useContext(ExamFormFlowContext);
  return context ?? MODERATOR_EXAM_FLOW;
}
