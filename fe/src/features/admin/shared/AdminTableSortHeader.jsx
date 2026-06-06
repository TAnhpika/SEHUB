import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faSort,
} from "@fortawesome/free-solid-svg-icons";
import styles from "@/features/admin/shared/adminPage.module.css";

/**
 * @param {{
 *   label: string;
 *   column: string;
 *   sortBy: string;
 *   sortDir: "asc" | "desc";
 *   onSort: (column: string) => void;
 *   align?: "left" | "right" | "center";
 * }} props
 */
function AdminTableSortHeader({ label, column, sortBy, sortDir, onSort, align = "left" }) {
  const active = sortBy === column;
  const icon = !active ? faSort : sortDir === "asc" ? faArrowUp : faArrowDown;

  return (
    <th className={styles.thSortable} style={{ textAlign: align }}>
      <button
        type="button"
        className={`${styles.sortBtn} ${active ? styles.sortBtnActive : ""}`}
        onClick={() => onSort(column)}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        <FontAwesomeIcon icon={icon} className={styles.sortIcon} aria-hidden />
      </button>
    </th>
  );
}

export default AdminTableSortHeader;
