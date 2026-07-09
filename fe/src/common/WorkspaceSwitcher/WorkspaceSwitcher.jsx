/**
 * @fileoverview Bộ chuyển workspace giữa Admin, Moderator và Student trong SEHUB.
 *
 * Component này hiển thị danh sách các workspace mà người dùng hiện tại được phép truy
 * cập, giúp staff chuyển nhanh giữa khu vực quản trị, kiểm duyệt và giao diện sinh viên.
 *
 * @module common/WorkspaceSwitcher/WorkspaceSwitcher
 * @see {@link module:common/WorkspaceSwitcher/workspaceConfig} - Cấu hình workspace và quyền truy cập.
 */

import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/context";
import {
  getAccessibleWorkspaces,
  getCurrentWorkspaceId,
} from "@/common/WorkspaceSwitcher/workspaceConfig";
import styles from "@/common/WorkspaceSwitcher/WorkspaceSwitcher.module.css";

/**
 * @typedef {Object} WorkspaceSwitcherProps
 * @property {() => void} [onNavigate] - Callback chạy sau khi người dùng chọn workspace (ví dụ: đóng menu cha).
 * @property {boolean} [showHeading=true] - Hiển thị hay ẩn tiêu đề khu vực switcher.
 * @property {string} [heading='Chuyển khu vực'] - Tiêu đề hiển thị phía trên danh sách workspace.
 * @property {boolean} [showCurrent=true] - Có hiển thị workspace hiện tại trong danh sách hay không.
 * @property {'panel' | 'sidebar-dark' | 'sidebar-mod' | 'menu-compact'} [variant='panel'] - Biến thể giao diện để tái sử dụng trong panel, sidebar và menu compact.
 */

/**
 * Hiển thị danh sách workspace người dùng có thể truy cập.
 *
 * Hành vi chính:
 * - tự xác định workspace hiện tại từ `pathname`,
 * - lọc danh sách theo role đăng nhập,
 * - ẩn toàn bộ component nếu chỉ còn 1 workspace khả dụng,
 * - tùy chọn ẩn workspace hiện tại để menu gọn hơn.
 *
 * @param {WorkspaceSwitcherProps} props - Props điều khiển cách hiển thị danh sách workspace.
 * @returns {import('react').ReactElement | null} Danh sách chuyển workspace hoặc `null` nếu không cần hiển thị.
 *
 * @example
 * <WorkspaceSwitcher
 *   variant="menu-compact"
 *   showHeading={false}
 *   onNavigate={() => setMenuOpen(false)}
 * />
 */
function WorkspaceSwitcher({
  onNavigate,
  showHeading = true,
  heading = "Chuyển khu vực",
  showCurrent = true,
  variant = "panel",
}) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const currentId = getCurrentWorkspaceId(pathname);
  const workspaces = getAccessibleWorkspaces(user);

  if (workspaces.length <= 1) {
    return null;
  }

  const variantClass =
    variant === "sidebar-dark"
      ? styles.sidebarDark
      : variant === "sidebar-mod"
        ? styles.sidebarMod
        : variant === "menu-compact"
          ? styles.menuCompact
          : "";

  const visibleWorkspaces = showCurrent
    ? workspaces
    : workspaces.filter((workspace) => workspace.id !== currentId);

  if (visibleWorkspaces.length === 0) {
    return null;
  }

  return (
    <div className={variantClass}>
      {showHeading ? <p className={styles.heading}>{heading}</p> : null}
      <ul className={styles.list}>
        {visibleWorkspaces.map((workspace) => {
          const isCurrent = workspace.id === currentId;
          const content = (
            <>
              <span className={styles.icon} aria-hidden>
                <FontAwesomeIcon icon={workspace.icon} />
              </span>
              <span className={styles.copy}>
                <span className={styles.label}>{workspace.label}</span>
                {variant !== "menu-compact" ? (
                  <span className={styles.desc}>{workspace.desc}</span>
                ) : null}
              </span>
            </>
          );

          return (
            <li key={workspace.id}>
              <Link
                to={workspace.to}
                className={`${styles.item}${isCurrent ? ` ${styles.itemActive}` : ""}`}
                onClick={onNavigate}
                aria-current={isCurrent ? "page" : undefined}
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default WorkspaceSwitcher;
