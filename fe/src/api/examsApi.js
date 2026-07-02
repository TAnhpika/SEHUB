import { apiRequest, buildQuery, getAccessToken } from "./httpClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";

export function listExams(params = {}) {
  return apiRequest(`/api/v1/exams${buildQuery(params)}`, { auth: false });
}

export function getExam(id) {
  return apiRequest(`/api/v1/exams/${id}`, { auth: true });
}

export async function fetchExamAttachmentBlobUrl(examId, attachmentId, options = {}) {
  const token = getAccessToken();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/exams/${examId}/attachments/${attachmentId}/view`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!response.ok) {
    throw new Error("Không tải được file đề từ hệ thống.");
  }

  const headerType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const buffer = await response.arrayBuffer();
  let blobType = headerType || options.contentType || "application/octet-stream";

  const fileName = options.fileName ?? "";
  if (/\.pdf$/i.test(fileName) && !blobType.toLowerCase().includes("pdf")) {
    blobType = "application/pdf";
  }

  const blob = new Blob([buffer], { type: blobType });
  return URL.createObjectURL(blob);
}

export async function downloadExamAttachment(examId, attachmentId, fileName, options = {}) {
  const blobUrl = await fetchExamAttachmentBlobUrl(examId, attachmentId, {
    ...options,
    fileName,
  });
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName ?? "exam-attachment";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
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

export function getExamAiChat(examId, questionId) {
  return apiRequest(`/api/v1/exams/${examId}/questions/${questionId}/ai-chat`);
}

export function sendExamAiChat(examId, questionId, body) {
  return apiRequest(`/api/v1/exams/${examId}/questions/${questionId}/ai-chat`, {
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

export function listAttemptHistory(params = {}) {
  return apiRequest(`/api/v1/exams/attempts/history${buildQuery(params)}`);
}

export function reportExamQuestion(examId, questionId, body) {
  return apiRequest(`/api/v1/exams/${examId}/questions/${questionId}/report`, {
    method: "POST",
    body,
  });
}

export function getQuestionComments(examId, questionId) {
  return apiRequest(`/api/v1/exams/${examId}/questions/${questionId}/comments`);
}

export function createQuestionComment(examId, questionId, body) {
  return apiRequest(`/api/v1/exams/${examId}/questions/${questionId}/comments`, {
    method: "POST",
    body,
  });
}

export function deleteQuestionComment(examId, questionId, commentId) {
  return apiRequest(`/api/v1/exams/${examId}/questions/${questionId}/comments/${commentId}`, {
    method: "DELETE",
  });
}
