import styles from "./Pagination.module.css";

export function getPageNumbers(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, "ellipsis", total];
  }
  if (current >= total - 2) {
    return [1, "ellipsis", total - 2, total - 1, total];
  }
  return [1, "ellipsis", current, "ellipsis", total];
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel = "Phân trang",
  alwaysShow = false,
  flush = false,
}) {
  if (!alwaysShow && totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      className={`${styles.pagination} ${flush ? styles.flush : ""}`.trim()}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={styles["page-btn"]}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Trước
      </button>

      {pageNumbers.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={`${styles["page-num"]} ${item === currentPage ? styles.active : ""}`}
            aria-current={item === currentPage ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className={styles["page-btn"]}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Tiếp theo
      </button>
    </nav>
  );
}

export default Pagination;
