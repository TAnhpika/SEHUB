import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faRobot, faUser } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import { generateAiChatReply } from "@/features/exams/examAiChatData";
import { appendAiChatMessages, getAiChatMessages } from "@/features/exams/examAiChatStore";
import { canUseExamAiChat } from "@/utils/examAccess";
import styles from "./ExamAiChat.module.css";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ExamAiChat({ examId, question }) {
  const { user, aiTokens, spendAiExplainTokens } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);

  const questionId = question?.id;

  useEffect(() => {
    if (!examId || questionId == null) return;
    setMessages(getAiChatMessages(examId, questionId));
    setDraft("");
  }, [examId, questionId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  if (!canUseExamAiChat(user)) {
    return null;
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || isSending || questionId == null) return;

    const tokenResult = spendAiExplainTokens();
    if (!tokenResult.ok) {
      showToast("Đã hết token AI hôm nay. Token reset lúc 00:00.");
      return;
    }

    setIsSending(true);
    setDraft("");

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    const aiText = generateAiChatReply(question, text);
    const aiMessage = {
      id: `ai-${Date.now() + 1}`,
      role: "assistant",
      text: aiText,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = appendAiChatMessages(examId, questionId, [userMessage, aiMessage]);
    setMessages(nextMessages);
    setIsSending(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.chat} aria-label="Chat hỏi AI">
      <header className={styles.header}>
        <FontAwesomeIcon icon={faRobot} className={styles["header-icon"]} />
        <div>
          <p className={styles.title}>Hỏi thêm AI</p>
          <p className={styles.meta}>
            Premium · {aiTokens.cost} token/tin · Còn {Number.isFinite(aiTokens.remaining) ? aiTokens.remaining : "∞"}/
            {Number.isFinite(aiTokens.limit) ? aiTokens.limit : "∞"}
          </p>
        </div>
      </header>

      <div className={styles.messages} ref={listRef}>
        {messages.length === 0 && !isSending ? (
          <p className={styles.empty}>
            Hỏi AI về câu hỏi này — ví dụ: &quot;Tại sao đáp án B đúng?&quot; hoặc &quot;Gợi ý cách
            loại trừ đáp án sai&quot;.
          </p>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${
              message.role === "user" ? styles["message-user"] : styles["message-ai"]
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
          <div className={`${styles.message} ${styles["message-ai"]}`}>
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
          rows={2}
          placeholder="Nhập câu hỏi cho AI..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <button
          type="button"
          className={styles.send}
          onClick={handleSend}
          disabled={isSending || !draft.trim()}
          aria-label="Gửi câu hỏi AI"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
}

export default ExamAiChat;
