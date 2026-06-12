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

export function getDashboardStats() {
  return apiRequest("/api/v1/admin/dashboard");
}

export function listUsers(params = {}) {
  return apiRequest(`/api/v1/admin/users${buildQuery(params)}`);
}

export function getUser(id) {
  return apiRequest(`/api/v1/admin/users/${id}`);
}

export function patchUser(id, body) {
  return apiRequest(`/api/v1/admin/users/${id}`, {
    method: "PATCH",
    body,
  });
}

export function resetUserPassword(id) {
  return apiRequest(`/api/v1/admin/users/${id}/reset-password`, { method: "POST" });
}

export function grantUserTokens(id, body) {
  return apiRequest(`/api/v1/admin/users/${id}/grant-tokens`, {
    method: "POST",
    body,
  });
}

export function listExams(params = {}) {
  return apiRequest(`/api/v1/admin/exams${buildQuery(params)}`);
}

export function getExam(id) {
  return apiRequest(`/api/v1/admin/exams/${id}`);
}

export function createExam(body, confirmDuplicate = false) {
  return apiRequest(`/api/v1/admin/exams${buildQuery({ confirmDuplicate })}`, {
    method: "POST",
    body,
  });
}

export function updateExam(id, body) {
  return apiRequest(`/api/v1/admin/exams/${id}`, {
    method: "PUT",
    body,
  });
}

export function approveExam(id) {
  return apiRequest(`/api/v1/admin/exams/${id}/approve`, { method: "POST" });
}

export function ocrExam(body) {
  return apiRequest("/api/v1/admin/exams/ocr", {
    method: "POST",
    body,
  });
}

export function listDocuments(params = {}) {
  return apiRequest(`/api/v1/admin/documents${buildQuery(params)}`);
}

export function getDocument(id) {
  return apiRequest(`/api/v1/admin/documents/${id}`);
}

export function deleteDocument(id) {
  return apiRequest(`/api/v1/admin/documents/${id}`, { method: "DELETE" });
}

export function listPayments(params = {}) {
  return apiRequest(`/api/v1/admin/payments${buildQuery(params)}`);
}

export function getPayment(id) {
  return apiRequest(`/api/v1/admin/payments/${id}`);
}

export function listPaymentAudit(params = {}) {
  return apiRequest(`/api/v1/admin/payments/audit${buildQuery(params)}`);
}

export function confirmPayment(orderId, body = {}) {
  return apiRequest(`/api/v1/admin/payments/${orderId}/confirm`, {
    method: "POST",
    body,
  });
}

export function listReports(params = {}) {
  return apiRequest(`/api/v1/admin/moderation/reports${buildQuery(params)}`);
}

export function getReport(id) {
  return apiRequest(`/api/v1/admin/moderation/reports/${id}`);
}

export function resolveReport(id, body) {
  return apiRequest(`/api/v1/admin/moderation/reports/${id}`, {
    method: "PATCH",
    body,
  });
}

export function listBannedUsers() {
  return apiRequest("/api/v1/admin/moderation/banned");
}

export function listViolatingUsers(params = {}) {
  return apiRequest(`/api/v1/admin/moderation/violations${buildQuery(params)}`);
}

export function getViolatingUser(id) {
  return apiRequest(`/api/v1/admin/moderation/violations/${id}`);
}

export function warnViolatingUser(id, body = {}) {
  return apiRequest(`/api/v1/admin/moderation/users/${id}/warn`, {
    method: "POST",
    body,
  });
}

export function banViolatingUser(id, body) {
  return apiRequest(`/api/v1/admin/moderation/users/${id}/ban`, {
    method: "POST",
    body,
  });
}

export function unbanViolatingUser(id, body = {}) {
  return apiRequest(`/api/v1/admin/moderation/users/${id}/unban`, {
    method: "POST",
    body,
  });
}

export function getGamificationLevels() {
  return apiRequest("/api/v1/admin/gamification/levels");
}

export function updateGamificationLevels(body) {
  return apiRequest("/api/v1/admin/gamification/levels", {
    method: "PUT",
    body,
  });
}

export function getGamificationBadges() {
  return apiRequest("/api/v1/admin/gamification/badges");
}
