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

function formatTime(date) {
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function ConversationChat({ conversation, compact = false, onBack, onClose }) {
  const [draft, setDraft] = useState("");
  const [extraMessages, setExtraMessages] = useState([]);

  const messages = useMemo(
    () => [...conversation.messages, ...extraMessages],
    [conversation.messages, extraMessages],
  );

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    setExtraMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        type: "sent",
        text,
        time: formatTime(new Date()),
      },
    ]);
    setDraft("");
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
              <p className={styles.status}>
                {conversation.typing
                  ? "Đang nhập..."
                  : conversation.online
                    ? "Đang hoạt động"
                    : "Ngoại tuyến"}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {!compact && (
            <>
              <button type="button" className={styles["action-btn"]} aria-label="Gọi thoại">
                <FontAwesomeIcon icon={faPhone} />
              </button>
              <button type="button" className={styles["action-btn"]} aria-label="Gọi video">
                <FontAwesomeIcon icon={faVideo} />
              </button>
            </>
          )}
          <button type="button" className={styles["action-btn"]} aria-label="Thông tin hội thoại">
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
        {messages.map((message) => {
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

        {conversation.typing && (
          <div className={`${styles["message-row"]} ${styles.received}`}>
            <div className={`${styles.bubble} ${styles.typing}`} aria-label="Đang nhập">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        {!compact && (
          <>
            <button type="button" className={styles["footer-btn"]} aria-label="Thêm">
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button type="button" className={styles["footer-btn"]} aria-label="Gửi ảnh">
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
          />
          <button type="button" className={styles.emoji} aria-label="Chọn emoji">
            <FontAwesomeIcon icon={faFaceSmile} />
          </button>
        </label>

        <button
          type="button"
          className={styles.send}
          aria-label="Gửi tin nhắn"
          onClick={handleSend}
          disabled={!draft.trim()}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </footer>
    </div>
  );
}

export default ConversationChat;
