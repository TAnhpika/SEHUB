import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/context";
import {
  getAccessibleWorkspaces,
  getCurrentWorkspaceId,
} from "@/common/WorkspaceSwitcher/workspaceConfig";
import styles from "@/common/WorkspaceSwitcher/WorkspaceSwitcher.module.css";

/**
 * @param {{
 *   onNavigate?: () => void;
 *   showHeading?: boolean;
 *   heading?: string;
 *   showCurrent?: boolean;
 *   variant?: "panel" | "sidebar-dark" | "sidebar-mod" | "menu-compact";
 * }} props
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

          if (isCurrent) {
            return (
              <li key={workspace.id} className={styles.itemCurrent} aria-current="page">
                <span className={styles.icon} aria-hidden>
                  <FontAwesomeIcon icon={workspace.icon} />
                </span>
                <span className={styles.copy}>
                  <span className={styles.label}>{workspace.label}</span>
                  {variant !== "menu-compact" ? (
                    <span className={styles.desc}>{workspace.desc}</span>
                  ) : null}
                </span>
                <span className={styles.badge}>Đang dùng</span>
              </li>
            );
          }

          return (
            <li key={workspace.id}>
              <Link
                to={workspace.to}
                className={styles.item}
                onClick={onNavigate}
              >
                <span className={styles.icon} aria-hidden>
                  <FontAwesomeIcon icon={workspace.icon} />
                </span>
                <span className={styles.copy}>
                  <span className={styles.label}>{workspace.label}</span>
                  {variant !== "menu-compact" ? (
                    <span className={styles.desc}>{workspace.desc}</span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default WorkspaceSwitcher;
