import styles from "./ModeratorBadge.module.css";

/**
 * @param {{ label: string, tone?: string, size?: 'sm' | 'md', dot?: boolean }} props
 */
function ModeratorBadge({ label, tone = "muted", size = "sm", dot = false }) {
  return (
    <span
      className={`${styles.badge} ${styles[`tone-${tone}`]} ${styles[`size-${size}`]}`}
    >
      {dot ? <span className={styles.dot} aria-hidden /> : null}
      {label}
    </span>
  );
}

export default ModeratorBadge;
