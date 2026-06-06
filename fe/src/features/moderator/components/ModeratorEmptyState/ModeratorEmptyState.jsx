import styles from "./ModeratorEmptyState.module.css";

function ModeratorEmptyState({ message, children }) {
  return (
    <div className={styles.empty}>
      <p className={styles.message}>{message}</p>
      {children}
    </div>
  );
}

export default ModeratorEmptyState;
