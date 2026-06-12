import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import ConversationAvatar from "@/features/chat/ConversationAvatar/ConversationAvatar";
import ConversationChat from "@/features/chat/ConversationChat/ConversationChat";
import {
  loadConversationMessages,
  loadConversations,
  markConversationAsRead,
  sendConversationMessage,
} from "@/features/chat/messagesData";
import { mapMessageItem } from "@/api/messagesMapper";
import { useChatHub } from "@/hooks/useChatHub";
import styles from "./MessagesPage.module.css";

function MessagesPage() {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(location.state?.conversationId ?? null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const handleReceiveMessage = useCallback((messageDto) => {
    const mapped = mapMessageItem(messageDto);

    setConversations((current) =>
      current.map((item) =>
        item.conversationId === messageDto.conversationId
          ? {
              ...item,
              preview: messageDto.content,
              time: "Vừa xong",
              unread:
                selectedId === item.conversationId && messageDto.isMine
                  ? item.unread
                  : messageDto.isMine
                    ? item.unread
                    : item.unread + 1,
            }
          : item,
      ),
    );

    if (selectedId === messageDto.conversationId) {
      setMessages((current) => {
        if (current.some((item) => item.id === mapped.id)) {
          return current;
        }
        return [...current, mapped];
      });
    }
  }, [selectedId]);

  const { joinConversation } = useChatHub({
    onReceiveMessage: handleReceiveMessage,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchConversations() {
      setLoading(true);
      setError(null);

      try {
        const items = await loadConversations();
        if (!cancelled) {
          setConversations(items);
          if (items.length > 0) {
            setSelectedId((current) => current ?? items[0].conversationId);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? "Không tải được hội thoại.");
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
          setConversations((current) =>
            current.map((item) =>
              item.conversationId === selectedId ? { ...item, unread: 0 } : item,
            ),
          );
        }
        await joinConversation(selectedId);
      } catch {
        if (!cancelled) {
          setMessages([]);
        }
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

  const filteredConversations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return conversations;

    return conversations.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.preview.toLowerCase().includes(keyword),
    );
  }, [conversations, query]);

  const activeConversation =
    conversations.find((item) => item.conversationId === selectedId) ?? null;

  async function handleSend(text) {
    if (!selectedId || !text.trim()) return;

    setSending(true);
    try {
      const mapped = await sendConversationMessage(selectedId, text);
      setMessages((current) => [...current, mapped]);
      setConversations((current) =>
        current.map((item) =>
          item.conversationId === selectedId
            ? { ...item, preview: mapped.text, time: "Vừa xong" }
            : item,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.inbox} aria-label="Danh sách hội thoại">
        <div className={styles["inbox-header"]}>
          <h1 className={styles["inbox-title"]}>Tin nhắn</h1>
          <button type="button" className={styles.compose} aria-label="Soạn tin nhắn mới" disabled>
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

        {loading && <p className={styles.empty}>Đang tải hội thoại...</p>}
        {error && !loading && <p className={styles.empty} role="alert">{error}</p>}

        {!loading && !error && filteredConversations.length === 0 && (
          <p className={styles.empty}>Chưa có hội thoại nào.</p>
        )}

        <ul className={styles.conversations}>
          {filteredConversations.map((conversation) => {
            const isActive = conversation.conversationId === selectedId;

            return (
              <li key={conversation.conversationId}>
                <button
                  type="button"
                  className={`${styles["conversation-item"]} ${isActive ? styles.active : ""}`}
                  onClick={() => setSelectedId(conversation.conversationId)}
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
        {activeConversation ? (
          <ConversationChat
            conversation={activeConversation}
            messages={messages}
            loading={messagesLoading}
            sending={sending}
            onSend={handleSend}
          />
        ) : (
          <p className={styles.empty}>Chọn một hội thoại để bắt đầu nhắn tin.</p>
        )}
      </section>
    </div>
  );
}

export default MessagesPage;
