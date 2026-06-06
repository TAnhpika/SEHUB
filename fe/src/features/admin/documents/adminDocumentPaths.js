/** Đường dẫn quản lý tài liệu Admin — theo kì / môn */

export function getAdminDocumentsCatalogUrl({ semester } = {}) {
  if (semester && semester !== "all") {
    return `/admin/documents?semester=${encodeURIComponent(semester)}`;
  }
  return "/admin/documents";
}

export function getAdminDocumentsSubjectUrl({ code, semester } = {}) {
  const normalized = (code ?? "").trim().toUpperCase();
  if (!normalized) return getAdminDocumentsCatalogUrl({ semester });
  const path = `/admin/documents/${encodeURIComponent(normalized)}`;
  if (semester && semester !== "all") {
    return `${path}?semester=${encodeURIComponent(semester)}`;
  }
  return path;
}
