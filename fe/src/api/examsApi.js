import { apiRequest } from "./httpClient";

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listExams(params = {}) {
  return apiRequest(`/api/v1/exams${buildQuery(params)}`, { auth: false });
}

export function getExam(id) {
  return apiRequest(`/api/v1/exams/${id}`, { auth: false });
}

export function getQuestions(examId) {
  return apiRequest(`/api/v1/exams/${examId}/questions`);
}

export function getQuestionWithAnswer(examId, questionId) {
  return apiRequest(`/api/v1/exams/${examId}/questions/${questionId}`);
}

export function aiExplain(questionId, body) {
  return apiRequest(`/api/v1/exams/questions/${questionId}/ai-explain`, {
    method: "POST",
    body,
  });
}

export function startAttempt(examId) {
  return apiRequest(`/api/v1/exams/${examId}/attempts`, { method: "POST" });
}

export function getCurrentAttempt(examId) {
  return apiRequest(`/api/v1/exams/${examId}/attempts/current`);
}

export function getAttempt(examId, attemptId) {
  return apiRequest(`/api/v1/exams/${examId}/attempts/${attemptId}`);
}

export function saveAnswers(examId, attemptId, body) {
  return apiRequest(`/api/v1/exams/${examId}/attempts/${attemptId}/answers`, {
    method: "PUT",
    body,
  });
}

export function submitAttempt(examId, attemptId) {
  return apiRequest(`/api/v1/exams/${examId}/attempts/${attemptId}/submit`, {
    method: "POST",
  });
}

export function getAttemptResult(examId, attemptId) {
  return apiRequest(`/api/v1/exams/${examId}/attempts/${attemptId}/result`);
}
