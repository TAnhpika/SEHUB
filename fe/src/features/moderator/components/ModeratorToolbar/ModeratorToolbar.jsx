/**
 * @fileoverview Thanh công cụ tìm kiếm và bộ lọc dùng chung trong khu vực Moderator SEHUB.
 *
 * Cung cấp ô tìm kiếm (tùy chọn), vùng filter trung tâm và slot hành động cuối thanh
 * cho các trang danh sách kiểm duyệt.
 *
 * @module features/moderator/components/ModeratorToolbar
 */

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import styles from "./ModeratorToolbar.module.css";

/**
 * @typedef {Object} ModeratorToolbarProps
 * @property {string} [searchValue] - Giá trị hiện tại của ô tìm kiếm (controlled).
 * @property {(value: string) => void} [onSearchChange] - Callback khi người dùng gõ; nếu không truyền thì ẩn ô tìm kiếm.
 * @property {string} [searchPlaceholder='Tìm kiếm...'] - Placeholder cho input search.
 * @property {import('react').ReactNode} [children] - Các bộ lọc (dropdown, select) render ở vùng giữa thanh.
 * @property {import('react').ReactNode} [end] - Nội dung cuối thanh (nút xuất, sắp xếp, v.v.).
 */

/**
 * Thanh toolbar với tìm kiếm, filter và slot cuối.
 *
 * Ô tìm kiếm chỉ render khi có `onSearchChange`. Filter và `end` là tùy chọn.
 *
 * @param {ModeratorToolbarProps} props - Props của component.
 * @returns {import('react').ReactElement} Container toolbar ngang.
 *
 * @example
 * <ModeratorToolbar
 *   searchValue={query}
 *   onSearchChange={setQuery}
 *   searchPlaceholder="Tìm theo tên..."
 *   end={<button type="button">Xuất CSV</button>}
 * >
 *   <FilterDropdown label="Trạng thái" ... />
 * </ModeratorToolbar>
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
