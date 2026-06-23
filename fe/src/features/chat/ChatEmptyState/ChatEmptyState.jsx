import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots, faInbox } from "@fortawesome/free-solid-svg-icons";
import styles from "./ChatEmptyState.module.css";

function ChatEmptyState({
  icon = faInbox,
  title,
  description,
  compact = false,
}) {
  return (
    <div className={`${styles.root} ${compact ? styles.compact : ""}`}>
      <span className={styles.iconWrap} aria-hidden="true">
        <FontAwesomeIcon icon={icon} className={styles.icon} />
      </span>
      {title ? <p className={styles.title}>{title}</p> : null}
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  );
}

export { faCommentDots, faInbox };
export default ChatEmptyState;
