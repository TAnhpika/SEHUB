import Pagination from "@/common/Pagination/Pagination";
import styles from "@/features/admin/shared/adminPage.module.css";

/**
 * @param {{
 *   rangeStart: number;
 *   rangeEnd: number;
 *   total: number;
 *   unit: string;
 *   currentPage: number;
 *   totalPages: number;
 *   onPageChange: (page: number) => void;
 *   ariaLabel?: string;
 *   compact?: boolean;
 *   alwaysShow?: boolean;
 * }} props
 */
function AdminTableFooter({
  rangeStart,
  rangeEnd,
  total,
  unit,
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel = "Phân trang",
  compact = false,
  alwaysShow = true,
}) {
  if (total === 0) return null;

  return (
    <footer
      className={compact ? styles.tableFooterCompact : styles.tableFooter}
      aria-label={ariaLabel}
    >
      <p className={styles.tableFooterMeta}>
        Hiển thị {rangeStart}–{rangeEnd} / {total} {unit}
      </p>
      <div className={styles.tableFooterPagination}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          ariaLabel={ariaLabel}
          alwaysShow={alwaysShow}
          flush
        />
      </div>
    </footer>
  );
}

export default AdminTableFooter;
