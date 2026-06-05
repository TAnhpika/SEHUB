import { useEffect, useMemo, useState } from "react";

/**
 * Phân trang client-side cho bảng / danh sách admin.
 * @param {Array<unknown>} items
 * @param {number} pageSize
 * @param {unknown[]} resetDeps — đổi filter/search → về trang 1
 */
export function useAdminPagination(items, pageSize, resetDeps = []) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, resetDeps);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const rangeStart = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, items.length);

  function handlePageChange(next) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    pageItems,
    safePage,
    totalPages,
    rangeStart,
    rangeEnd,
    total: items.length,
    handlePageChange,
    setPage,
  };
}
