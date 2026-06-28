import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import styles from "./PinnedBadge.module.css";

function PinnedBadge({ className = "" }) {
  return (
    <span className={`${styles.badge} ${className}`.trim()}>
      <FontAwesomeIcon icon={faThumbtack} className={styles.icon} aria-hidden="true" />
      Ghim
    </span>
  );
}

export default PinnedBadge;
