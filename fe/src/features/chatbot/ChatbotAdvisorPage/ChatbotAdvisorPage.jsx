import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faRobot, faUser } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  loadChatbotConversation,
  loadChatbotSettings,
  sendAdvisorMessage,
} from "@/features/chatbot/chatbotApi";
import styles from "./ChatbotAdvisorPage.module.css";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatbotAdvisorPage() {
  const { aiTokens, spendAiExplainTokens, applyAiTokenRemaining } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadChatbotSettings()
      .then((result) => {
        if (!cancelled) {
          setSettings(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          showToast(error?.message ?? "Không tải được cấu hình chatbot.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || isSending || settings?.isEnabled === false) return;

    const tokenResult = spendAiExplainTokens();
    if (!tokenResult.ok) {
      showToast("Đã hết token AI hôm nay. Token reset lúc 00:00.");
      return;
    }

    setIsSending(true);
    setDraft("");

    try {
      const result = await sendAdvisorMessage(text, conversationId);
      if (result?.conversationId) {
        setConversationId(result.conversationId);
      }
      if (result?.messages?.length) {
        setMessages(result.messages);
      }
      if (result?.remainingTokens != null) {
        applyAiTokenRemaining(result.remainingTokens);
      }
    } catch (error) {
      showToast(error?.message ?? "Không gửi được tin nhắn.");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  const welcomeText = settings?.welcomeMessage ?? "Xin chào! Tôi có thể hỗ trợ bạn về học vụ và SEHub.";

  return (
    <div className={styles.page}>
      <p className={styles.intro}>
        Trợ lý AI học vụ — hỏi về thủ tục, Premium, thi cử và cách dùng SEHub. Mỗi tin nhắn tốn{" "}
        {aiTokens.cost} token.
      </p>

      <div className={styles.chat} aria-label="Chatbot tư vấn học vụ">
        <header className={styles.header}>
          <FontAwesomeIcon icon={faRobot} className={styles["header-icon"]} />
          <div>
            <p className={styles.title}>Tư vấn học vụ AI</p>
            <p className={styles.meta}>
              Premium · Còn {Number.isFinite(aiTokens.remaining) ? aiTokens.remaining : "∞"}/
              {Number.isFinite(aiTokens.limit) ? aiTokens.limit : "∞"} token hôm nay
            </p>
          </div>
        </header>

        <div className={styles.messages} ref={listRef}>
          {isLoading ? <p className={styles.empty}>Đang tải...</p> : null}
          {!isLoading && messages.length === 0 && !isSending ? (
            <p className={styles.empty}>{welcomeText}</p>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${
                message.role === "user" ? styles["message-user"] : ""
              }`}
            >
              <span className={styles.avatar} aria-hidden="true">
                <FontAwesomeIcon icon={message.role === "user" ? faUser : faRobot} />
              </span>
              <div className={styles.bubble}>
                <p className={styles.text}>{message.text}</p>
                <time className={styles.time} dateTime={message.createdAt}>
                  {formatTime(message.createdAt)}
                </time>
              </div>
            </div>
          ))}

          {isSending ? (
            <div className={styles.message}>
              <span className={styles.avatar} aria-hidden="true">
                <FontAwesomeIcon icon={faRobot} />
              </span>
              <div className={`${styles.bubble} ${styles.typing}`}>AI đang trả lời...</div>
            </div>
          ) : null}
        </div>

        <div className={styles.composer}>
          <textarea
            className={styles.input}
            rows={3}
            placeholder="Nhập câu hỏi của bạn..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || settings?.isEnabled === false}
          />
          <button
            type="button"
            className={styles.send}
            onClick={handleSend}
            disabled={isSending || !draft.trim() || settings?.isEnabled === false}
            aria-label="Gửi tin nhắn"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatbotAdvisorPage;
