import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import ConversationChat from "@/features/chat/ConversationChat/ConversationChat";
import ChatEmptyState, { faInbox } from "@/features/chat/ChatEmptyState/ChatEmptyState";
import {
  loadConversationMessages,
  loadConversations,
  markConversationAsRead,
  sendConversationAttachment,
  sendConversationMessage,
} from "@/features/chat/messagesData";
import { mapMessageItem, appendMessageIfNew } from "@/api/messagesMapper";
import { useAuth } from "@/context";
import { useChatHub } from "@/hooks/useChatHub";
import styles from "./ChatModal.module.css";

function ChatModal({ onClose }) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const { joinConversation } = useChatHub({
    onReceiveMessage: (messageDto) => {
      if (selectedId !== messageDto.conversationId) return;
      const mapped = mapMessageItem(messageDto, { currentUserId });
      setMessages((current) => appendMessageIfNew(current, mapped));
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
        const { items } = await loadConversationMessages(selectedId, { currentUserId });
        if (!cancelled) {
          setMessages(items);
          await markConversationAsRead(selectedId);
        }
        await joinConversation(selectedId);
      } finally {
        setMessagesLoading(false);
      }
    }

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedId, joinConversation, currentUserId]);

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
          onSend={async ({ text = "", file = null } = {}) => {
            const trimmed = text.trim();
            if (!file && !trimmed) return;

            setSending(true);
            try {
              const mapped = file
                ? await sendConversationAttachment(selectedId, file, trimmed, { currentUserId })
                : await sendConversationMessage(selectedId, trimmed, { currentUserId });
              setMessages((current) => appendMessageIfNew(current, mapped));
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

      {loading && (
        <ChatEmptyState compact title="Đang tải..." />
      )}

      {!loading && conversations.length === 0 && (
        <ChatEmptyState
          compact
          icon={faInbox}
          title="Chưa có hội thoại nào"
          description="Mở profile bạn bè và bấm Nhắn tin để bắt đầu."
        />
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
