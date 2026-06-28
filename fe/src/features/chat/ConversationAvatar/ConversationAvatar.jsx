import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import styles from "./ConversationAvatar.module.css";

function ConversationAvatar({ conversation, size = "md" }) {
  const showStatus = conversation?.online != null || conversation?.presenceTier != null;
  const isOnline = conversation?.online === true;

  return (
    <span className={`${styles.wrap} ${styles[size]}`}>
      <span
        className={styles.avatar}
        style={{ background: conversation.avatarBg, color: conversation.avatarColor }}
        aria-hidden="true"
      >
        {conversation.initials ? (
          conversation.initials
        ) : (
          <FontAwesomeIcon icon={faUser} className={styles.icon} />
        )}
      </span>
      {showStatus ? (
        <span
          className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}

export default ConversationAvatar;
