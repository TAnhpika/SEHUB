import { apiRequest, buildQuery } from "./httpClient";

export function getMyExamAttempts({ page = 1, pageSize = 10 } = {}) {
  return apiRequest(
    `/api/v1/profiles/me/exam-attempts${buildQuery({ page, pageSize })}`,
  );
}

export function getMyPracticeSubmissions({ page = 1, pageSize = 10, status } = {}) {
  return apiRequest(
    `/api/v1/profiles/me/practice-submissions${buildQuery({ page, pageSize, status })}`,
  );
}
