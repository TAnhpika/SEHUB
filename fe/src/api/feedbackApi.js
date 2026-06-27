import { apiRequest, apiUploadRequest } from "./httpClient";

export function submitFeedback(body) {
  return apiRequest("/api/v1/feedback", { method: "POST", body });
}

export function uploadFeedbackAttachments(files) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  return apiUploadRequest("/api/v1/feedback/attachments", formData);
}

export function listFeedback(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return apiRequest(`/api/v1/admin/feedback${qs ? `?${qs}` : ""}`);
}

export function updateFeedbackStatus(id, body) {
  return apiRequest(`/api/v1/admin/feedback/${id}`, { method: "PATCH", body });
}
