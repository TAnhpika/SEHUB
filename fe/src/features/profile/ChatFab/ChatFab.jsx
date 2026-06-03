import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import styles from "./ChatFab.module.css";

function ChatFab() {
  return (
    <button type="button" className={styles.fab} aria-label="Mở chat">
      <FontAwesomeIcon icon={faCommentDots} />
    </button>
  );
}

export default ChatFab;
