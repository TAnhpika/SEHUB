import { useEffect } from "react";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import styles from "./ModeratorPageShell.module.css";

const DEFAULT_CRUMBS = [{ label: "Trang chủ", to: "/home" }];

/**
 * @param {{
 *   title?: string,
 *   description?: string,
 *   crumbs?: Array<{ label: string, to?: string }>,
 *   actions?: import('react').ReactNode,
 *   variant?: 'default' | 'full' | 'wizard',
 *   children: import('react').ReactNode,
 * }} props
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
