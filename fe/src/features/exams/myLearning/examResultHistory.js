import * as examsApi from "@/api/examsApi";
import { mapQuestionPublicDto } from "@/api/examMapper";
import { loadAttemptResult } from "@/features/exams/examApiSession";
import { getExamResultPath } from "@/utils/examFocusPaths";

/**
 * @param {string} courseCode
 * @param {string} examCode
 * @param {string} attemptId
 * @param {"home" | "community"} [scope]
 */
export function buildExamResultHistoryPath(courseCode, examCode, attemptId, scope = "home") {
  const base = getExamResultPath(courseCode, examCode, scope);
  const params = new URLSearchParams({ attemptId });
  return `${base}?${params.toString()}`;
}

/**
 * @param {string} apiExamId
 * @param {string} attemptId
 */
export async function loadHistoryExamSession(apiExamId, attemptId) {
  const [questionDtos, attempt] = await Promise.all([
    examsApi.getQuestions(apiExamId),
    examsApi.getAttempt(apiExamId, attemptId),
  ]);

  const questions = (questionDtos ?? []).map(mapQuestionPublicDto);
  const result = await loadAttemptResult(apiExamId, attemptId, questions);
  const startedAt = attempt?.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();

  return {
    result,
    startedAt,
    submittedAt: Date.now(),
    submission: null,
    submitted: true,
  };
}
