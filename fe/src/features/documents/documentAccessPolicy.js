/** Nghiệp vụ phân quyền tài liệu — Basic (Free) vs Premium */

export const FREE_PAGE_LIMIT = 3;

export function isPremiumOnlyDocument(doc) {
  return doc?.access?.includes("Premium") ?? false;
}

/**
 * @param {{ access?: string, pages?: number }} doc
 * @param {{ isPremium?: boolean, isAuthenticated?: boolean }} viewer
 */
export function getDocumentAccessState(doc, viewer = {}) {
  const { isPremium = false, isAuthenticated = true } = viewer;
  const totalPages = Math.max(doc?.pages ?? 0, 0);

  if (!isAuthenticated) {
    return {
      canView: false,
      reason: "login",
      visiblePages: 0,
      totalPages,
      canDownload: false,
      label: "Cần đăng nhập",
    };
  }

  if (isPremium) {
    return {
      canView: true,
      reason: null,
      visiblePages: totalPages,
      totalPages,
      canDownload: true,
      limited: false,
      label: "Premium — xem & tải full",
    };
  }

  if (isPremiumOnlyDocument(doc)) {
    return {
      canView: false,
      reason: "premium_required",
      visiblePages: 0,
      totalPages,
      canDownload: false,
      limited: false,
      label: "Chỉ Premium — SV Basic không xem được",
    };
  }

  const visiblePages = Math.min(FREE_PAGE_LIMIT, totalPages);
  const limited = totalPages > FREE_PAGE_LIMIT;

  return {
    canView: true,
    reason: limited ? "page_limit" : null,
    visiblePages,
    totalPages,
    canDownload: false,
    limited,
    label: limited
      ? `Basic — xem trước ${visiblePages}/${totalPages} trang`
      : `Basic — xem full (${totalPages} trang ≤ ${FREE_PAGE_LIMIT})`,
  };
}

export function buildMockPageLabels(totalPages, visiblePages) {
  const count = Math.max(totalPages, visiblePages, 1);
  return Array.from({ length: count }, (_, index) => {
    const pageNum = index + 1;
    const visible = pageNum <= visiblePages;
    return { pageNum, visible };
  });
}
