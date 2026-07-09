/**
 * @fileoverview Vỏ layout nội dung trang dành cho Moderator trong SEHUB.
 *
 * Đồng bộ tiêu đề, mô tả, breadcrumb và hành động header lên `ModeratorPageContext`
 * (để `ModeratorHeader` render), đồng thời bọc nội dung trang với variant layout phù hợp.
 *
 * @module features/moderator/components/ModeratorPageShell
 * @see {@link module:features/moderator/context/ModeratorPageContext} — context meta trang
 */

import { useEffect } from "react";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import styles from "./ModeratorPageShell.module.css";

/**
 * Breadcrumb mặc định khi trang không truyền `crumbs` hoặc `title`.
 *
 * @constant {ReadonlyArray<{ label: string, to?: string }>}
 * @readonly
 */
const DEFAULT_CRUMBS = [{ label: "Trang chủ", to: "/home" }];

/**
 * @typedef {Object} ModeratorPageShellCrumb
 * @property {string} label - Nhãn hiển thị trên breadcrumb.
 * @property {string} [to] - Đường dẫn điều hướng; bỏ qua nếu là mục cuối (không click).
 */

/**
 * @typedef {Object} ModeratorPageShellProps
 * @property {string} [title] - Tiêu đề H1 trên shell và meta header layout.
 * @property {string} [description] - Mô tả phụ dưới tiêu đề.
 * @property {ReadonlyArray<ModeratorPageShellCrumb>} [crumbs] - Chuỗi breadcrumb; mặc định `[DEFAULT_CRUMBS, { label: title }]` nếu có `title`.
 * @property {import('react').ReactNode} [actions] - Nút hoặc nhóm hành động góc phải header.
 * @property {'default' | 'full' | 'wide' | 'wizard'} [variant='default'] - Biến thể chiều rộng/layout (`wizard` ẩn header nội bộ).
 * @property {import('react').ReactNode} children - Nội dung chính của trang.
 */

/**
 * Vỏ trang Moderator — đồng bộ meta lên context và render header + body.
 *
 * Khi mount, gọi `setPageMeta` với title, description, crumbs và actions.
 * Khi unmount, reset meta về trạng thái rỗng để tránh rò rỉ sang trang khác.
 *
 * @param {ModeratorPageShellProps} props - Props của component.
 * @returns {import('react').ReactElement} Container shell với header (nếu có) và vùng body.
 *
 * @example
 * <ModeratorPageShell
 *   title="Tài khoản vi phạm"
 *   description="Quản lý tài khoản có lịch sử vi phạm"
 *   crumbs={[
 *     { label: "Trang chủ", to: "/home" },
 *     { label: "Tài khoản vi phạm" },
 *   ]}
 *   actions={<button type="button">Xuất CSV</button>}
 * >
 *   <AccountsTable />
 * </ModeratorPageShell>
 */
function ModeratorPageShell({
  title,
  description,
  crumbs,
  actions,
  variant = "default",
  children,
}) {
  const { setPageMeta } = useModeratorPage();

  useEffect(() => {
    const resolvedCrumbs = crumbs ?? (title ? [...DEFAULT_CRUMBS, { label: title }] : DEFAULT_CRUMBS);
    setPageMeta({ title, description, crumbs: resolvedCrumbs, actions });
    return () => setPageMeta({ title: "", description: "", crumbs: [], actions: null });
  }, [title, description, crumbs, actions, setPageMeta]);

  const shellClass = [
    styles.shell,
    variant === "full" ? styles.full : "",
    variant === "wide" ? styles.wide : "",
    variant === "wizard" ? styles.wizard : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      {(title || description || actions) && variant !== "wizard" ? (
        <header className={styles.header}>
          <div className={styles.headerText}>
            {title ? <h1 className={styles.title}>{title}</h1> : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export default ModeratorPageShell;
