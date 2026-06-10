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

export function listDocuments(params = {}) {
  return apiRequest(`/api/v1/documents${buildQuery(params)}`);
}

export function getDocument(id) {
  return apiRequest(`/api/v1/documents/${id}`);
}

export function getDocumentPreview(id, page = 1) {
  return apiRequest(`/api/v1/documents/${id}/preview${buildQuery({ page })}`);
}

export function getDocumentDownloadUrl(id) {
  return apiRequest(`/api/v1/documents/${id}/download`);
}
