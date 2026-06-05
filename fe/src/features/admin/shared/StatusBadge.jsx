import styles from "./adminPage.module.css";

const STATUS_CLASS = {
  active: styles.badgeSuccess,
  published: styles.badgeSuccess,
  success: styles.badgeSuccess,
  passed: styles.badgeSuccess,
  resolved: styles.badgeMuted,
  pending: styles.badgeWarning,
  draft: styles.badgeMuted,
  banned: styles.badgeDanger,
  temporary: styles.badgeWarning,
  refunded: styles.badgeRefunded,
};

function StatusBadge({ status, label }) {
  const className = STATUS_CLASS[status] ?? styles.badgeMuted;
  return <span className={className}>{label ?? status}</span>;
}

export default StatusBadge;
