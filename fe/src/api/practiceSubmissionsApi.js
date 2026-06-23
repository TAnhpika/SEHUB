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

export function submitPractice(examId, body) {
  return apiRequest(`/api/v1/exams/${examId}/practice-submissions`, {
    method: "POST",
    body,
  });
}

export function getMyPracticeSubmission(examId) {
  return apiRequest(`/api/v1/exams/${examId}/practice-submissions/me`);
}

export function listPracticeSubmissions(examId, params = {}) {
  return apiRequest(`/api/v1/exams/${examId}/practice-submissions${buildQuery(params)}`);
}

export function reviewPracticeSubmission(examId, submissionId, body) {
  return apiRequest(`/api/v1/exams/${examId}/practice-submissions/${submissionId}`, {
    method: "PATCH",
    body,
  });
}
