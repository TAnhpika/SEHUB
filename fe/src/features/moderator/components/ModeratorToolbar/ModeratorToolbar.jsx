import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import styles from "./ModeratorToolbar.module.css";

/**
 * @param {{
 *   searchValue?: string,
 *   onSearchChange?: (value: string) => void,
 *   searchPlaceholder?: string,
 *   children?: import('react').ReactNode,
 *   end?: import('react').ReactNode,
 * }} props
 */
function ModeratorToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  children,
  end,
}) {
  return (
    <div className={styles.toolbar}>
      {onSearchChange ? (
        <label className={styles.search}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      ) : null}
      {children ? <div className={styles.filters}>{children}</div> : null}
      {end ? <div className={styles.end}>{end}</div> : null}
    </div>
  );
}

export default ModeratorToolbar;
