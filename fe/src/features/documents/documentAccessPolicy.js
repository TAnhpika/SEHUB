/** Nghiệp vụ phân quyền tài liệu — Basic (Free) vs Premium (§3.5, P0) */

export const FREE_PAGE_LIMIT = 3;

export function isPremiumOnlyDocument(doc) {
  return doc?.access?.includes("Premium") && !doc.access.includes("Free");
}

/** Nhãn quyền hiển thị cho sinh viên (không lộ cấu hình Admin) */
export function getDocumentAccessTierLabel(doc) {
  if (isPremiumOnlyDocument(doc)) return "Chỉ Premium";
  if (doc?.access?.includes("Free")) return "Miễn phí (3 trang)";
  return doc?.access ?? "—";
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
      tierLabel: getDocumentAccessTierLabel(doc),
      label: "Cần đăng nhập để xem tài liệu",
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
      tierLabel: getDocumentAccessTierLabel(doc),
      label: "Premium — xem & tải file đầy đủ",
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
      tierLabel: getDocumentAccessTierLabel(doc),
      label: "Tài liệu Premium — nâng cấp để xem & tải",
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
    tierLabel: getDocumentAccessTierLabel(doc),
    label: limited
      ? "Basic — xem trước · không tải file"
      : "Basic — xem online · không tải file",
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
