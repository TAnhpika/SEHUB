import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faFaceSmile,
  faImage,
  faMagnifyingGlass,
  faPaperPlane,
  faPenToSquare,
  faPhone,
  faPlus,
  faUser,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { CONVERSATIONS } from "@/features/chat/messagesData";
import styles from "./MessagesPage.module.css";

function ConversationAvatar({ conversation }) {
  return (
    <span className={styles["avatar-wrap"]}>
      <span
        className={styles.avatar}
        style={{ background: conversation.avatarBg, color: conversation.avatarColor }}
        aria-hidden="true"
      >
        {conversation.initials ? (
          conversation.initials
        ) : (
          <FontAwesomeIcon icon={faUser} className={styles["avatar-icon"]} />
        )}
      </span>
      {conversation.online != null && (
        <span
          className={`${styles["status-dot"]} ${conversation.online ? styles.online : styles.offline}`}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

function MessagesPage() {
  const [selectedId, setSelectedId] = useState(CONVERSATIONS[0].id);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

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
        <header className={styles["chat-header"]}>
          <div className={styles["chat-user"]}>
            <ConversationAvatar conversation={activeConversation} />
            <div>
              <p className={styles["chat-name"]}>{activeConversation.name}</p>
              <p className={styles["chat-status"]}>
                {activeConversation.typing
                  ? "Đang nhập..."
                  : activeConversation.online
                    ? "Đang hoạt động"
                    : "Ngoại tuyến"}
              </p>
            </div>
          </div>

          <div className={styles["chat-actions"]}>
            <button type="button" className={styles["action-btn"]} aria-label="Gọi thoại">
              <FontAwesomeIcon icon={faPhone} />
            </button>
            <button type="button" className={styles["action-btn"]} aria-label="Gọi video">
              <FontAwesomeIcon icon={faVideo} />
            </button>
            <button type="button" className={styles["action-btn"]} aria-label="Thông tin hội thoại">
              <FontAwesomeIcon icon={faCircleInfo} />
            </button>
          </div>
        </header>

        <div className={styles["chat-body"]}>
          {activeConversation.messages.map((message) => {
            if (message.type === "date") {
              return (
                <div key={message.id} className={styles["date-divider"]}>
                  <span>{message.label}</span>
                </div>
              );
            }

            const isSent = message.type === "sent";

            return (
              <div
                key={message.id}
                className={`${styles["message-row"]} ${isSent ? styles.sent : styles.received}`}
              >
                <div className={styles.bubble}>{message.text}</div>
                <span className={styles["message-time"]}>{message.time}</span>
              </div>
            );
          })}

          {activeConversation.typing && (
            <div className={`${styles["message-row"]} ${styles.received}`}>
              <div className={`${styles.bubble} ${styles.typing}`} aria-label="Đang nhập">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        <footer className={styles["chat-footer"]}>
          <button type="button" className={styles["footer-btn"]} aria-label="Thêm">
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button type="button" className={styles["footer-btn"]} aria-label="Gửi ảnh">
            <FontAwesomeIcon icon={faImage} />
          </button>

          <label className={styles["input-wrap"]}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Nhập tin nhắn..."
              aria-label="Nhập tin nhắn"
            />
            <button type="button" className={styles.emoji} aria-label="Chọn emoji">
              <FontAwesomeIcon icon={faFaceSmile} />
            </button>
          </label>

          <button type="button" className={styles.send} aria-label="Gửi tin nhắn">
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </footer>
      </section>
    </div>
  );
}

export default MessagesPage;
