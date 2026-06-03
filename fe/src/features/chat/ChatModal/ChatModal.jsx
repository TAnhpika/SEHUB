import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import ConversationChat from "@/features/chat/ConversationChat/ConversationChat";
import { CHAT_CONVERSATIONS, getConversationById } from "@/features/chat/messagesData";
import styles from "./ChatModal.module.css";

function ChatModal({ onClose }) {
  const [selectedId, setSelectedId] = useState(null);

  const activeConversation = selectedId ? getConversationById(selectedId) : null;

  if (activeConversation) {
    return (
      <div className={`${styles.modal} ${styles.chat}`}>
        <ConversationChat
          conversation={activeConversation}
          compact
          onBack={() => setSelectedId(null)}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="chat-modal-title">
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
            <button type="button" className={styles.item} onClick={() => setSelectedId(chat.id)}>
              <span className={styles.avatarWrap}>
                <span
                  className={styles.avatar}
                  style={{ background: chat.avatarBg, color: chat.avatarColor }}
                  aria-hidden="true"
                >
                  {chat.initials ? (
                    chat.initials
                  ) : (
                    <FontAwesomeIcon icon={faUser} className={styles["avatar-icon"]} />
                  )}
                </span>
                {chat.online != null && (
                  <span
                    className={`${styles.status} ${chat.online ? styles.online : styles.offline}`}
                    aria-label={chat.online ? "Đang trực tuyến" : "Ngoại tuyến"}
                  />
                )}
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
