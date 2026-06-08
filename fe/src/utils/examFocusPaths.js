const FOCUS_FINAL_BASE = "/exam/focus/final-exam";
const FOCUS_PRACTICE_BASE = "/exam/focus/pratical-exam";

/** Màn làm bài tập trung — không MainLayout (sidebar, header, chat) */
export function isExamFocusPath(pathname = "") {
  return pathname.startsWith("/exam/focus/");
}

export function isPracticeFocusPath(pathname = "") {
  return pathname.startsWith(`${FOCUS_PRACTICE_BASE}/`);
}

export function getExamFocusDoPath(courseCode, examId) {
  return `${FOCUS_FINAL_BASE}/${courseCode}/${encodeURIComponent(examId)}/do`;
}

export function getExamFocusResultPath(courseCode, examId) {
  return `${FOCUS_FINAL_BASE}/${courseCode}/${encodeURIComponent(examId)}/result`;
}

export function getPracticeFocusDoPath(courseCode, examId, questionIndex) {
  return `${FOCUS_PRACTICE_BASE}/${courseCode}/${encodeURIComponent(examId)}/do/${questionIndex}`;
}

export function getPracticeFocusResultPath(courseCode, examId, questionIndex) {
  return `${FOCUS_PRACTICE_BASE}/${courseCode}/${encodeURIComponent(examId)}/result/${questionIndex}`;
}

export function getExamDetailPath(courseCode, examId, scope = "home", examPage = "review") {
  const base = scope === "home" ? "/home" : "/community";
  const segment = examPage === "practice" ? "pratical-exam" : "final-exam";
  return `${base}/${segment}/${courseCode}/${encodeURIComponent(examId)}`;
}

export function resolveExamScope(pathname, locationState) {
  if (locationState?.scope === "community" || locationState?.scope === "home") {
    return locationState.scope;
  }
  if (pathname.startsWith("/home/")) return "home";
  if (pathname.startsWith("/community/")) return "community";
  return "home";
}
