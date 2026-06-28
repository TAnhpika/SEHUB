import { apiRequest, buildQuery, getAccessToken } from "./httpClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";

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

export function isAuthenticatedDocumentContentUrl(url) {
  return typeof url === "string" && url.includes("/api/v1/documents/") && url.includes("/content");
}

export async function fetchDocumentContentBlobUrl(id, page = null) {
  const token = getAccessToken();
  const query = page != null ? buildQuery({ page }) : "";
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/content${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Không tải được nội dung tài liệu.");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function downloadDocumentContent(id, fileName) {
  const blobUrl = await fetchDocumentContentBlobUrl(id);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName ?? "document.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
