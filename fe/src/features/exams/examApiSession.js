import * as examsApi from "@/api/examsApi";
import {
  buildSaveAnswersPayload,
  mapAttemptAnswersToUi,
  mapExamResultToLocalResult,
} from "@/api/examMapper";
import { applyApiExamResult } from "@/features/exams/examSession";

export async function startOrResumeAttempt(apiExamId) {
  let attempt = await examsApi.getCurrentAttempt(apiExamId);

  if (!attempt) {
    try {
      attempt = await examsApi.startAttempt(apiExamId);
    } catch (error) {
      if (error.status === 409) {
        attempt = await examsApi.getCurrentAttempt(apiExamId);
      }

      if (!attempt) {
        throw error;
      }
    }
  }

  return attempt;
}

export async function persistAttemptAnswers(apiExamId, attemptId, questions, uiAnswers) {
  const body = buildSaveAnswersPayload(questions, uiAnswers);
  return examsApi.saveAnswers(apiExamId, attemptId, body);
}

export async function submitApiAttempt(examId, apiExamId, attemptId, questions, startedAt) {
  const apiResult = await examsApi.submitAttempt(apiExamId, attemptId);
  const result = mapExamResultToLocalResult(apiResult, questions);
  const uiAnswers = {};

  for (const item of result.items) {
    if (item.selectedAnswers?.length) {
      uiAnswers[String(item.questionId)] =
        item.selectedAnswers.length > 1 ? item.selectedAnswers : item.selectedAnswers[0];
    } else if (item.selectedAnswer) {
      uiAnswers[String(item.questionId)] = item.selectedAnswer;
    }
  }

  applyApiExamResult(examId, {
    apiExamId,
    attemptId,
    startedAt,
    submittedAt: Date.now(),
    answers: uiAnswers,
    result,
  });

  return result;
}

export function syncAttemptAnswersToUi(questions, attempt) {
  return mapAttemptAnswersToUi(questions, attempt?.answers ?? {});
}

export async function loadAttemptResult(apiExamId, attemptId, questions) {
  const apiResult = await examsApi.getAttemptResult(apiExamId, attemptId);
  return mapExamResultToLocalResult(apiResult, questions);
}
