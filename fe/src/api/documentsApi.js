import {
  ApiError,
  apiRequest,
  buildQuery,
  getAccessToken,
  getRefreshToken,
  refreshSession,
} from "./httpClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";

export function listDocuments(params = {}) {
  return apiRequest(`/api/v1/documents${buildQuery(params)}`, { auth: false });
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

async function requestDocumentContent(id, page = null) {
  const token = getAccessToken();
  const query = page != null ? buildQuery({ page }) : "";
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/content${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new ApiError("Không tải được nội dung tài liệu.", { status: response.status });
  }

  return response.blob();
}

export async function fetchDocumentContentBlobUrl(id, page = null) {
  try {
    const blob = await requestDocumentContent(id, page);
    return URL.createObjectURL(blob);
  } catch (error) {
    if (
      error instanceof ApiError
      && error.status === 401
      && getRefreshToken()
    ) {
      await refreshSession();
      const blob = await requestDocumentContent(id, page);
      return URL.createObjectURL(blob);
    }

    throw error instanceof Error
      ? error
      : new Error("Không tải được nội dung tài liệu.");
  }
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
