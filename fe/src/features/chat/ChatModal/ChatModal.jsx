import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import ConversationChat from "@/features/chat/ConversationChat/ConversationChat";
import {
  loadConversationMessages,
  loadConversations,
  markConversationAsRead,
  sendConversationMessage,
} from "@/features/chat/messagesData";
import { mapMessageItem } from "@/api/messagesMapper";
import { useChatHub } from "@/hooks/useChatHub";
import styles from "./ChatModal.module.css";

function ChatModal({ onClose }) {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const { joinConversation } = useChatHub({
    onReceiveMessage: (messageDto) => {
      if (selectedId !== messageDto.conversationId) return;
      const mapped = mapMessageItem(messageDto);
      setMessages((current) =>
        current.some((item) => item.id === mapped.id) ? current : [...current, mapped],
      );
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchConversations() {
      setLoading(true);
      try {
        const items = await loadConversations();
        if (!cancelled) {
          setConversations(items);
        }
      } catch {
        if (!cancelled) {
          setConversations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchConversations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return undefined;
    }

    let cancelled = false;

    async function fetchMessages() {
      setMessagesLoading(true);
      try {
        const { items } = await loadConversationMessages(selectedId);
        if (!cancelled) {
          setMessages(items);
          await markConversationAsRead(selectedId);
        }
        await joinConversation(selectedId);
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    }

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedId, joinConversation]);

  const activeConversation = conversations.find((item) => item.conversationId === selectedId) ?? null;

  if (activeConversation) {
    return (
      <div className={`${styles.modal} ${styles.chat}`}>
        <ConversationChat
          conversation={activeConversation}
          messages={messages}
          loading={messagesLoading}
          sending={sending}
          compact
          onBack={() => setSelectedId(null)}
          onClose={onClose}
          onSend={async (text) => {
            setSending(true);
            try {
              const mapped = await sendConversationMessage(selectedId, text);
              setMessages((current) => [...current, mapped]);
            } finally {
              setSending(false);
            }
          }}
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

      {loading && <p className={styles.empty}>Đang tải...</p>}

      {!loading && conversations.length === 0 && (
        <p className={styles.empty}>Chưa có hội thoại nào.</p>
      )}

      <ul className={styles.list}>
        {conversations.map((chat) => (
          <li key={chat.conversationId}>
            <button type="button" className={styles.item} onClick={() => setSelectedId(chat.conversationId)}>
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
