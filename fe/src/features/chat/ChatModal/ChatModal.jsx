import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { CHAT_CONVERSATIONS } from "@/features/chat/chatData";
import styles from "./ChatModal.module.css";

function ChatModal({ onClose }) {
  return (
    <div
      className={styles.modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-modal-title"
    >
      <div className={styles.header}>
        <h2 id="chat-modal-title" className={styles.title}>
          Tin nhắn
        </h2>
        <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <ul className={styles.list}>
        {CHAT_CONVERSATIONS.map((chat) => (
          <li key={chat.id}>
            <button type="button" className={styles.item}>
              <span className={styles.avatarWrap}>
                <span
                  className={styles.avatar}
                  style={{ background: chat.avatarBg, color: chat.avatarColor }}
                  aria-hidden="true"
                >
                  {chat.initials}
                </span>
                <span
                  className={`${styles.status} ${chat.online ? styles.online : styles.offline}`}
                  aria-label={chat.online ? "Đang trực tuyến" : "Ngoại tuyến"}
                />
              </span>

              <span className={styles.content}>
                <span className={styles.name}>{chat.name}</span>
                <span className={styles.preview}>{chat.preview}</span>
              </span>

              <span className={styles.time}>{chat.time}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChatModal;
