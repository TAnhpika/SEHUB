import { useLocation } from "react-router-dom";
import { resolveAdminScreenMeta } from "@/features/admin/adminPageMeta";
import AdminBackLink from "./AdminBackLink";
import AdminBreadcrumb from "./AdminBreadcrumb";
import { resolveAdminBackLink } from "./adminBackLinkUtils";
import styles from "./adminPage.module.css";

/**
 * @param {{
 *   title: string;
 *   subtitle?: string;
 *   breadcrumbs?: { label: string; to?: string }[];
 *   backTo?: string;
 *   backLabel?: string;
 *   hideBack?: boolean;
 *   actions?: import('react').ReactNode;
 *   hidePageHeader?: boolean;
 *   children: import('react').ReactNode;
 * }} props
 */
function AdminPageLayout({
  title,
  subtitle,
  breadcrumbs,
  backTo,
  backLabel,
  hideBack = false,
  actions,
  hidePageHeader = false,
  children,
}) {
  const { pathname } = useLocation();
  const screenMeta = resolveAdminScreenMeta(pathname);
  const resolvedTitle = title ?? screenMeta?.title ?? "Admin";
  const resolvedSubtitle = subtitle ?? screenMeta?.subtitle;

  const back =
    !hideBack && !hidePageHeader
      ? resolveAdminBackLink(breadcrumbs, { backTo, backLabel })
      : null;

  return (
    <div className={styles.page}>
      {!hidePageHeader && back ? <AdminBackLink to={back.to} label={back.label} /> : null}

      {!hidePageHeader && breadcrumbs?.length ? (
        <AdminBreadcrumb items={breadcrumbs} />
      ) : null}

      {!hidePageHeader ? (
        <header className={styles.pageHeader}>
          <div className={styles.headerCopy}>
            <h1 className={styles.pageTitle}>{resolvedTitle}</h1>
            {resolvedSubtitle ? (
              <p className={styles.pageSubtitle}>{resolvedSubtitle}</p>
            ) : null}
          </div>
          {actions ? <div className={styles.headerActions}>{actions}</div> : null}
        </header>
      ) : null}

      <div className={styles.pageBody}>{children}</div>
    </div>
  );
}

export default AdminPageLayout;
