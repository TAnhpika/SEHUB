import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import ConversationAvatar from "@/features/chat/ConversationAvatar/ConversationAvatar";
import ConversationChat from "@/features/chat/ConversationChat/ConversationChat";
import { CONVERSATIONS } from "@/features/chat/messagesData";
import styles from "./MessagesPage.module.css";

function MessagesPage() {
  const [selectedId, setSelectedId] = useState(CONVERSATIONS[0].id);
  const [query, setQuery] = useState("");

  const filteredConversations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return CONVERSATIONS;

    return CONVERSATIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.preview.toLowerCase().includes(keyword),
    );
  }, [query]);

  const activeConversation =
    CONVERSATIONS.find((item) => item.id === selectedId) ?? CONVERSATIONS[0];

  return (
    <div className={styles.page}>
      <aside className={styles.inbox} aria-label="Danh sách hội thoại">
        <div className={styles["inbox-header"]}>
          <h1 className={styles["inbox-title"]}>Tin nhắn</h1>
          <button type="button" className={styles.compose} aria-label="Soạn tin nhắn mới">
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
        </div>

        <label className={styles.search}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={styles["search-icon"]} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm hội thoại..."
            aria-label="Tìm kiếm hội thoại"
          />
        </label>

        <ul className={styles.conversations}>
          {filteredConversations.map((conversation) => {
            const isActive = conversation.id === selectedId;

            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  className={`${styles["conversation-item"]} ${isActive ? styles.active : ""}`}
                  onClick={() => setSelectedId(conversation.id)}
                >
                  <ConversationAvatar conversation={conversation} />

                  <span className={styles["conversation-body"]}>
                    <span className={styles["conversation-top"]}>
                      <span className={styles["conversation-name"]}>{conversation.name}</span>
                      <span className={styles["conversation-time"]}>{conversation.time}</span>
                    </span>
                    <span className={styles["conversation-preview-row"]}>
                      <span className={styles["conversation-preview"]}>{conversation.preview}</span>
                      {conversation.unread > 0 && (
                        <span className={styles.badge} aria-label={`${conversation.unread} tin chưa đọc`}>
                          {conversation.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className={styles.chat} aria-label="Khung chat">
        <ConversationChat conversation={activeConversation} />
      </section>
    </div>
  );
}

export default MessagesPage;
