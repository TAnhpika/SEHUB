import { apiFormRequest, apiRequest, apiUploadRequest, buildQuery, downloadCsv } from "./httpClient";

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

export function updateExam(id, body, confirmDuplicate = false) {
  return apiRequest(`/api/v1/admin/exams/${id}${buildQuery({ confirmDuplicate })}`, {
    method: "PUT",
    body,
  });
}

export function deleteExam(id) {
  return apiRequest(`/api/v1/admin/exams/${id}`, { method: "DELETE" });
}

export function approveExam(id) {
  return apiRequest(`/api/v1/admin/exams/${id}/approve`, { method: "POST" });
}

export function rejectExam(id, body) {
  return apiRequest(`/api/v1/admin/exams/${id}/reject`, {
    method: "POST",
    body,
  });
}

export function resubmitExam(id, body, confirmDuplicate = false) {
  return apiRequest(`/api/v1/admin/exams/${id}/resubmit${buildQuery({ confirmDuplicate })}`, {
    method: "PUT",
    body,
  });
}

export function createExamRevision(id) {
  return apiRequest(`/api/v1/admin/exams/${id}/revision`, { method: "POST" });
}

export function ocrExam(body) {
  return apiRequest("/api/v1/admin/exams/ocr", {
    method: "POST",
    body,
  });
}

export function importExamMarkdown(body) {
  return apiRequest("/api/v1/admin/exams/import-markdown", {
    method: "POST",
    body,
  });
}

export function uploadExamQuestionImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUploadRequest("/api/v1/admin/exams/upload-question-image", formData);
}

export function uploadExamAttachment(examId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUploadRequest(`/api/v1/admin/exams/${examId}/attachments`, formData);
}

export function deleteExamAttachment(examId, attachmentId) {
  return apiRequest(`/api/v1/admin/exams/${examId}/attachments/${attachmentId}`, {
    method: "DELETE",
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

export function updateDocument(id, body) {
  return apiRequest(`/api/v1/admin/documents/${id}`, {
    method: "PUT",
    body,
  });
}

export function uploadDocument({ file, title, subjectCode, semester, categoryId, accessTier, pageCount }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("Title", title);
  if (subjectCode) formData.append("SubjectCode", subjectCode);
  if (semester != null && semester !== "") formData.append("Semester", String(semester));
  if (categoryId) formData.append("CategoryId", categoryId);
  formData.append("AccessTier", accessTier);
  if (pageCount != null && pageCount !== "") formData.append("PageCount", String(pageCount));
  return apiUploadRequest("/api/v1/admin/documents", formData);
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

export function approvePaymentRefund(orderId, body = {}) {
  return apiRequest(`/api/v1/admin/payments/${orderId}/refund/approve`, {
    method: "POST",
    body,
  });
}

export function completePaymentRefund(orderId, body = {}) {
  return apiRequest(`/api/v1/admin/payments/${orderId}/refund/complete`, {
    method: "POST",
    body,
  });
}

export function listQuestionReports(params = {}) {
  return apiRequest(`/api/v1/admin/moderation/question-reports${buildQuery(params)}`);
}

export function getPendingQuestionReportCount() {
  return apiRequest("/api/v1/admin/moderation/question-reports/pending-count");
}

export function resolveQuestionReport(id, body) {
  return apiRequest(`/api/v1/admin/moderation/question-reports/${id}`, {
    method: "PATCH",
    body,
  });
}

export function listConversationReports(params = {}) {
  return apiRequest(`/api/v1/admin/moderation/conversation-reports${buildQuery(params)}`);
}

export function getPendingConversationReportCount() {
  return apiRequest("/api/v1/admin/moderation/conversation-reports/pending-count");
}

export function resolveConversationReport(id, body) {
  return apiRequest(`/api/v1/admin/moderation/conversation-reports/${id}`, {
    method: "PATCH",
    body,
  });
}

export function listUserReports(params = {}) {
  return apiRequest(`/api/v1/admin/moderation/user-reports${buildQuery(params)}`);
}

export function getPendingUserReportCount() {
  return apiRequest("/api/v1/admin/moderation/user-reports/pending-count");
}

export function resolveUserReport(id, body) {
  return apiRequest(`/api/v1/admin/moderation/user-reports/${id}`, {
    method: "PATCH",
    body,
  });
}

export function escalateUserReportToViolations(id, body) {
  return apiRequest(`/api/v1/admin/moderation/reports/${id}/escalate-violations`, {
    method: "POST",
    body,
  });
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

export function getModerationStats() {
  return apiRequest("/api/v1/admin/moderation/stats");
}

export function getFeaturedPosts(params = {}) {
  return apiRequest(`/api/v1/admin/moderation/featured-posts${buildQuery(params)}`);
}

export function getPinnedPosts(params = {}) {
  return apiRequest(`/api/v1/admin/moderation/pinned-posts${buildQuery(params)}`);
}

export function getAdminOverview() {
  return apiRequest("/api/v1/admin/overview");
}

export function downloadAdminExport(kind) {
  return downloadCsv(`/api/v1/admin/export/${kind}.csv`);
}

export function downloadModerationViolationsExport() {
  return downloadCsv("/api/v1/admin/moderation/violations/export.csv");
}

export function listModerationPosts(params = {}) {
  return apiRequest(`/api/v1/admin/moderation/posts${buildQuery(params)}`);
}

export function getModerationPost(id) {
  return apiRequest(`/api/v1/admin/moderation/posts/${id}`);
}

export function moderatePost(id, body) {
  return apiRequest(`/api/v1/admin/moderation/posts/${id}`, {
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

export function createGamificationBadge(body) {
  return apiRequest("/api/v1/admin/gamification/badges", {
    method: "POST",
    body,
  });
}

export function updateGamificationBadge(id, body) {
  return apiRequest(`/api/v1/admin/gamification/badges/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteGamificationBadge(id) {
  return apiRequest(`/api/v1/admin/gamification/badges/${id}`, { method: "DELETE" });
}

export function getGamificationPointRules() {
  return apiRequest("/api/v1/admin/gamification/point-rules");
}

export function createGamificationPointRule(body) {
  return apiRequest("/api/v1/admin/gamification/point-rules", {
    method: "POST",
    body,
  });
}

export function updateGamificationPointRule(id, body) {
  return apiRequest(`/api/v1/admin/gamification/point-rules/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteGamificationPointRule(id) {
  return apiRequest(`/api/v1/admin/gamification/point-rules/${id}`, { method: "DELETE" });
}

export function reconcilePoints({ userId, applyFix = false } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (applyFix) params.set("applyFix", "true");
  const query = params.toString();
  return apiRequest(
    `/api/v1/admin/gamification/points/reconcile${query ? `?${query}` : ""}`,
    { method: "POST" },
  );
}

export function listModerationPracticeSubmissions(params = {}) {
  return apiRequest(`/api/v1/admin/moderation/practice-submissions${buildQuery(params)}`);
}

export function listVouchers(params = {}) {
  return apiRequest(`/api/v1/admin/vouchers${buildQuery(params)}`);
}

export function grantVoucher(body) {
  return apiRequest("/api/v1/admin/vouchers/grant", {
    method: "POST",
    body,
  });
}

export function revokeVoucher(id) {
  return apiRequest(`/api/v1/admin/vouchers/${id}/revoke`, { method: "PATCH" });
}

export function getDashboardCharts(params = {}) {
  return apiRequest(`/api/v1/admin/dashboard/charts${buildQuery(params)}`);
}

export function listAuditLogs(params = {}) {
  return apiRequest(`/api/v1/admin/audit-logs${buildQuery(params)}`);
}

export function getUserActivity(id, params = {}) {
  return apiRequest(`/api/v1/admin/users/${id}/activity${buildQuery(params)}`);
}
