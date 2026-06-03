import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import styles from "./ConversationAvatar.module.css";

function ConversationAvatar({ conversation, size = "md" }) {
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
      {conversation.online != null && (
        <span
          className={`${styles.status} ${conversation.online ? styles.online : styles.offline}`}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

export default ConversationAvatar;
