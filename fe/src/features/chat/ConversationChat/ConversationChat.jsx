import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCircleInfo,
  faFaceSmile,
  faImage,
  faPaperPlane,
  faPhone,
  faPlus,
  faVideo,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import ConversationAvatar from "@/features/chat/ConversationAvatar/ConversationAvatar";
import styles from "./ConversationChat.module.css";

function ConversationChat({
  conversation,
  messages = [],
  onSend,
  sending = false,
  loading = false,
  compact = false,
  onBack,
  onClose,
}) {
  const [draft, setDraft] = useState("");

  const renderedMessages = useMemo(() => messages, [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;

    setDraft("");
    await onSend?.(text);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={`${styles.root} ${compact ? styles.compact : ""}`}>
      <header className={styles.header}>
        <div className={styles["header-left"]}>
          {compact && onBack && (
            <button type="button" className={styles.back} aria-label="Quay lại danh sách" onClick={onBack}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          )}

          <div className={styles.user}>
            <ConversationAvatar conversation={conversation} size={compact ? "sm" : "md"} />
            <div className={styles.meta}>
              <p className={styles.name}>{conversation.name}</p>
              <p className={styles.status}>Ngoại tuyến</p>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {!compact && (
            <>
              <button type="button" className={styles["action-btn"]} aria-label="Gọi thoại" disabled>
                <FontAwesomeIcon icon={faPhone} />
              </button>
              <button type="button" className={styles["action-btn"]} aria-label="Gọi video" disabled>
                <FontAwesomeIcon icon={faVideo} />
              </button>
            </>
          )}
          <button type="button" className={styles["action-btn"]} aria-label="Thông tin hội thoại" disabled>
            <FontAwesomeIcon icon={faCircleInfo} />
          </button>
          {compact && onClose && (
            <button type="button" className={styles["action-btn"]} aria-label="Đóng" onClick={onClose}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      </header>

      <div className={styles.body}>
        {loading && <p className={styles.loading}>Đang tải tin nhắn...</p>}

        {!loading && renderedMessages.length === 0 && (
          <p className={styles.loading}>Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>
        )}

        {renderedMessages.map((message) => {
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
      </div>

      <footer className={styles.footer}>
        {!compact && (
          <>
            <button type="button" className={styles["footer-btn"]} aria-label="Thêm" disabled>
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button type="button" className={styles["footer-btn"]} aria-label="Gửi ảnh" disabled>
              <FontAwesomeIcon icon={faImage} />
            </button>
          </>
        )}

        <label className={styles["input-wrap"]}>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            aria-label="Nhập tin nhắn"
            disabled={sending}
          />
          <button type="button" className={styles.emoji} aria-label="Chọn emoji" disabled>
            <FontAwesomeIcon icon={faFaceSmile} />
          </button>
        </label>

        <button
          type="button"
          className={styles.send}
          aria-label="Gửi tin nhắn"
          onClick={handleSend}
          disabled={!draft.trim() || sending}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </footer>
    </div>
  );
}

export default ConversationChat;
