import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import ConversationAvatar from "@/features/chat/ConversationAvatar/ConversationAvatar";
import ConversationChat from "@/features/chat/ConversationChat/ConversationChat";
import ChatEmptyState, { faCommentDots, faInbox } from "@/features/chat/ChatEmptyState/ChatEmptyState";
import ReportConversationModal from "@/features/chat/ReportConversationModal/ReportConversationModal";
import {
  loadConversationMessages,
  loadConversations,
  markConversationAsRead,
  sendConversationMessage,
} from "@/features/chat/messagesData";
import { blockUser, getBlockStatus, unblockUser } from "@/api/blockApi";
import { mapMessageItem } from "@/api/messagesMapper";
import { useToast } from "@/common/Toast/ToastProvider";
import { useChatHub } from "@/hooks/useChatHub";
import styles from "./MessagesPage.module.css";

function MessagesPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(location.state?.conversationId ?? null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    isBlockedByMe: false,
    isBlockedByThem: false,
    isBlockedEitherWay: false,
  });
  const [reportOpen, setReportOpen] = useState(false);

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
        setMessagesLoading(false);
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

  useEffect(() => {
    if (!activeConversation?.otherUserId) {
      setBlockStatus({
        isBlockedByMe: false,
        isBlockedByThem: false,
        isBlockedEitherWay: false,
      });
      return undefined;
    }

    let cancelled = false;

    async function fetchBlockStatus() {
      try {
        const status = await getBlockStatus(activeConversation.otherUserId);
        if (!cancelled) {
          setBlockStatus({
            isBlockedByMe: Boolean(status?.isBlockedByMe),
            isBlockedByThem: Boolean(status?.isBlockedByThem),
            isBlockedEitherWay: Boolean(status?.isBlockedEitherWay),
          });
        }
      } catch {
        if (!cancelled) {
          setBlockStatus({
            isBlockedByMe: false,
            isBlockedByThem: false,
            isBlockedEitherWay: false,
          });
        }
      }
    }

    fetchBlockStatus();

    return () => {
      cancelled = true;
    };
  }, [activeConversation?.otherUserId]);

  async function handleBlockUser() {
    if (!activeConversation?.otherUserId) return;

    try {
      await blockUser(activeConversation.otherUserId);
      setBlockStatus({
        isBlockedByMe: true,
        isBlockedByThem: false,
        isBlockedEitherWay: true,
      });
      setConversations((current) =>
        current.filter((item) => item.conversationId !== activeConversation.conversationId),
      );
      setSelectedId(null);
      setMessages([]);
      showToast("Đã chặn người dùng này.");
    } catch (err) {
      showToast(err.message ?? "Không chặn được người dùng.");
    }
  }

  async function handleUnblockUser() {
    if (!activeConversation?.otherUserId) return;

    try {
      await unblockUser(activeConversation.otherUserId);
      setBlockStatus({
        isBlockedByMe: false,
        isBlockedByThem: false,
        isBlockedEitherWay: false,
      });
      showToast("Đã bỏ chặn người dùng.");
    } catch (err) {
      showToast(err.message ?? "Không bỏ chặn được người dùng.");
    }
  }

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
    } catch (err) {
      showToast(err.message ?? "Không gửi được tin nhắn.");
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

        {loading && (
          <ChatEmptyState compact title="Đang tải hội thoại..." />
        )}
        {error && !loading && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {!loading && !error && filteredConversations.length === 0 && (
          <ChatEmptyState
            compact
            icon={faInbox}
            title="Chưa có hội thoại nào"
            description="Tìm bạn bè và bấm Nhắn tin trên profile để bắt đầu trò chuyện."
          />
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
            isBlockedByMe={blockStatus.isBlockedByMe}
            isBlockedEitherWay={blockStatus.isBlockedEitherWay}
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
            onReport={() => setReportOpen(true)}
          />
        ) : (
          <ChatEmptyState
            icon={faCommentDots}
            title="Chọn một hội thoại"
            description="Chọn cuộc trò chuyện bên trái hoặc nhắn tin từ profile người dùng."
          />
        )}
      </section>

      <ReportConversationModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        conversationId={activeConversation?.conversationId}
        conversationName={activeConversation?.name}
      />
    </div>
  );
}

export default MessagesPage;
