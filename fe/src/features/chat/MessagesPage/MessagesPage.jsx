import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsis,
  faMagnifyingGlass,
  faPenToSquare,
  faTrash,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import ConversationAvatar from "@/features/chat/ConversationAvatar/ConversationAvatar";
import ConversationChat from "@/features/chat/ConversationChat/ConversationChat";
import BlockedUsersList from "@/features/chat/BlockedUsersList/BlockedUsersList";
import ChatEmptyState, { faCommentDots, faInbox } from "@/features/chat/ChatEmptyState/ChatEmptyState";
import ReportConversationModal from "@/features/chat/ReportConversationModal/ReportConversationModal";
import ReportReasonModal from "@/features/reports/ReportReasonModal/ReportReasonModal";
import reportModalStyles from "@/features/feed/ReportPostModal/ReportPostModal.module.css";
import {
  loadConversationMessages,
  loadConversations,
  markConversationAsRead,
  deleteConversationHistory,
  sendConversationAttachment,
  sendConversationMessage,
} from "@/features/chat/messagesData";
import { blockUser, getBlockStatus, listBlockedUsers, unblockUser } from "@/api/blockApi";
import { blockedUserToConversation, mapBlockedUserListItem } from "@/api/blockMapper";
import { mapMessageItem, appendMessageIfNew, getMessagePreview } from "@/api/messagesMapper";
import * as usersApi from "@/api/usersApi";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useChatHub } from "@/hooks/useChatHub";
import { applyPresenceUpdate } from "@/utils/presenceStatus";
import styles from "./MessagesPage.module.css";

function MessagesPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { user } = useAuth();
  const currentUserId = user?.id;
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
  const [userReportOpen, setUserReportOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedListOpen, setBlockedListOpen] = useState(false);
  const [blockedUsersLoading, setBlockedUsersLoading] = useState(false);
  const [inboxMenuOpen, setInboxMenuOpen] = useState(false);
  const inboxMenuRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)").matches : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const fetchBlockedUsers = useCallback(async () => {
    setBlockedUsersLoading(true);
    try {
      const items = await listBlockedUsers();
      const mapped = Array.isArray(items) ? items.map(mapBlockedUserListItem) : [];
      setBlockedUsers(mapped);
      return mapped;
    } catch (err) {
      setBlockedUsers((current) => current);
      if (blockedListOpen) {
        showToast(err.message ?? "Không tải được danh sách bị chặn.");
      }
      return null;
    } finally {
      setBlockedUsersLoading(false);
    }
  }, [blockedListOpen, showToast]);

  function addBlockedUserLocally(conversation) {
    if (!conversation?.otherUserId) return;

    setBlockedUsers((current) => {
      if (current.some((item) => item.userId === conversation.otherUserId)) {
        return current;
      }

      return [
        ...current,
        mapBlockedUserListItem({
          userId: conversation.otherUserId,
          username: conversation.username ?? "",
          fullName: conversation.name ?? "",
          avatarUrl: conversation.avatarUrl ?? null,
          conversationId: conversation.conversationId ?? null,
          blockedAt: new Date().toISOString(),
        }),
      ];
    });
  }

  async function handleOpenBlockedList() {
    setInboxMenuOpen(false);
    setBlockedListOpen(true);
    setIsEditMode(false);
    await fetchBlockedUsers();
  }

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  useEffect(() => {
    if (!inboxMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (inboxMenuRef.current && !inboxMenuRef.current.contains(event.target)) {
        setInboxMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [inboxMenuOpen]);

  const handleReceiveMessage = useCallback((messageDto) => {
    const mapped = mapMessageItem(messageDto, { currentUserId });
    const preview = getMessagePreview(mapped);
    const isMine = mapped.type === "sent";

    setConversations((current) =>
      current.map((item) =>
        item.conversationId === messageDto.conversationId
          ? {
              ...item,
              preview,
              time: "Vừa xong",
              unread:
                selectedId === item.conversationId && isMine
                  ? item.unread
                  : isMine
                    ? item.unread
                    : item.unread + 1,
            }
          : item,
      ),
    );

    if (selectedId === messageDto.conversationId) {
      setMessages((current) => appendMessageIfNew(current, mapped));
    }
  }, [currentUserId, selectedId]);

  const handlePresenceUpdated = useCallback((presenceDto) => {
    setConversations((current) =>
      current.map((item) => applyPresenceUpdate(item, presenceDto)),
    );
  }, []);

  const { joinConversation } = useChatHub({
    onReceiveMessage: handleReceiveMessage,
    onPresenceUpdated: handlePresenceUpdated,
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
        const { items } = await loadConversationMessages(selectedId, { currentUserId });
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
  }, [selectedId, joinConversation, currentUserId]);

  const filteredConversations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return conversations;

    return conversations.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.preview.toLowerCase().includes(keyword),
    );
  }, [conversations, query]);

  const activeConversation = useMemo(() => {
    const fromInbox = conversations.find((item) => item.conversationId === selectedId);
    if (fromInbox) return fromInbox;

    const blocked = blockedUsers.find(
      (item) => item.conversationId === selectedId || item.userId === selectedId,
    );
    return blocked ? blockedUserToConversation(blocked) : null;
  }, [conversations, blockedUsers, selectedId]);

  const selectedBlockedUserId = activeConversation?.isBlockedEntry
    ? activeConversation.otherUserId
    : null;

  const showMobileChat = isMobile && Boolean(activeConversation);

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

    const conversationId = activeConversation.conversationId;

    try {
      await blockUser(activeConversation.otherUserId);
      setBlockStatus({
        isBlockedByMe: true,
        isBlockedByThem: false,
        isBlockedEitherWay: true,
      });
      setConversations((current) =>
        current.filter((item) => item.conversationId !== conversationId),
      );
      addBlockedUserLocally(activeConversation);
      await fetchBlockedUsers();
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
        isBlockedByThem: blockStatus.isBlockedByThem,
        isBlockedEitherWay: blockStatus.isBlockedByThem,
      });

      const items = await loadConversations();
      setConversations(items);
      setBlockedUsers((current) =>
        current.filter((item) => item.userId !== activeConversation.otherUserId),
      );
      showToast("Đã bỏ chặn người dùng.");
    } catch (err) {
      showToast(err.message ?? "Không bỏ chặn được người dùng.");
    }
  }

  async function handleSubmitUserReport({ reasonLabel, detail }) {
    if (!activeConversation?.otherUserId) return;

    await usersApi.reportUser(activeConversation.otherUserId, {
      source: "profile",
      reason: reasonLabel,
      detail,
    });
    window.dispatchEvent(new CustomEvent("sehubs-user-reports-changed"));
    window.dispatchEvent(new CustomEvent("sehub-moderator-stats-updated"));
    showToast("Đã gửi báo cáo người dùng. SEHub sẽ xem xét trong thời gian sớm nhất.");
  }

  function handleSelectBlockedUser(item) {
    setSelectedId(item.conversationId ?? item.userId);
  }

  function handleCloseBlockedList() {
    setBlockedListOpen(false);
    if (activeConversation?.isBlockedEntry) {
      setSelectedId(null);
      setMessages([]);
    }
  }

  async function handleSend({ text = "", file = null } = {}) {
    if (!selectedId) return;

    const trimmed = text.trim();
    if (!file && !trimmed) return;

    setSending(true);
    try {
      const mapped = file
        ? await sendConversationAttachment(selectedId, file, trimmed, { currentUserId })
        : await sendConversationMessage(selectedId, trimmed, { currentUserId });
      setMessages((current) => appendMessageIfNew(current, mapped));
      setConversations((current) =>
        current.map((item) =>
          item.conversationId === selectedId
            ? { ...item, preview: mapped.previewText, time: "Vừa xong" }
            : item,
        ),
      );
    } catch (err) {
      showToast(err.message ?? "Không gửi được tin nhắn.");
    } finally {
      setSending(false);
    }
  }

  function toggleEditMode() {
    setIsEditMode((current) => !current);
  }

  async function handleDeleteConversation(conversation) {
    const confirmed = await confirm({
      title: "Xóa lịch sử chat",
      description: `Xóa lịch sử chat với ${conversation.name}? Hành động này chỉ áp dụng với bạn.`,
      confirmLabel: "Xóa",
      cancelLabel: "Hủy",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteConversationHistory(conversation.conversationId);
      setConversations((current) =>
        current.filter((item) => item.conversationId !== conversation.conversationId),
      );

      if (selectedId === conversation.conversationId) {
        setSelectedId(null);
        setMessages([]);
      }

      showToast("Đã xóa lịch sử chat.");
    } catch (err) {
      showToast(err.message ?? "Không xóa được lịch sử chat.");
    }
  }

  return (
    <div className={`${styles.page} ${showMobileChat ? styles.pageMobileChat : ""}`}>
      <aside
        className={`${styles.inbox} ${showMobileChat ? styles.inboxMobileHidden : ""}`}
        aria-label="Danh sách hội thoại"
      >
        <div className={styles["inbox-header"]}>
          <h1 className={styles["inbox-title"]}>Tin nhắn</h1>
          <div className={styles["header-actions"]}>
            <button
              type="button"
              className={`${styles.compose} ${isEditMode ? styles.composeActive : ""}`}
              aria-label={isEditMode ? "Hoàn tất chỉnh sửa" : "Chỉnh sửa danh sách hội thoại"}
              aria-pressed={isEditMode}
              onClick={toggleEditMode}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
            <div className={styles["menu-wrap"]} ref={inboxMenuRef}>
              <button
                type="button"
                className={styles["menu-trigger"]}
                aria-label="Tùy chọn tin nhắn"
                aria-expanded={inboxMenuOpen}
                onClick={() => setInboxMenuOpen((current) => !current)}
              >
                <FontAwesomeIcon icon={faEllipsis} />
              </button>
              {inboxMenuOpen && (
                <div className={styles["inbox-menu"]} role="menu">
                  <button
                    type="button"
                    className={styles["inbox-menu-item"]}
                    role="menuitem"
                    onClick={handleOpenBlockedList}
                  >
                    <FontAwesomeIcon icon={faUserSlash} className={styles["inbox-menu-icon"]} />
                    Danh sách bị chặn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {blockedListOpen ? (
          <BlockedUsersList
            items={blockedUsers}
            loading={blockedUsersLoading}
            selectedUserId={selectedBlockedUserId}
            onBack={handleCloseBlockedList}
            onSelect={handleSelectBlockedUser}
          />
        ) : (
          <>
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
                <div
                  className={`${styles["conversation-item"]} ${isActive ? styles.active : ""} ${isEditMode ? styles["conversation-item-edit"] : ""}`}
                >
                  <button
                    type="button"
                    className={styles["conversation-open"]}
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

                  {isEditMode && (
                    <button
                      type="button"
                      className={styles["delete-btn"]}
                      aria-label={`Xóa lịch sử chat với ${conversation.name}`}
                      onClick={() => handleDeleteConversation(conversation)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
          </>
        )}
      </aside>

      <section className={styles.chat} aria-label="Khung chat">
        {activeConversation ? (
          <ConversationChat
            conversation={activeConversation}
            messages={messages}
            loading={messagesLoading}
            sending={sending}
            compact={showMobileChat}
            onBack={() => setSelectedId(null)}
            onSend={handleSend}
            isBlockedByMe={blockStatus.isBlockedByMe}
            isBlockedByThem={blockStatus.isBlockedByThem}
            isBlockedEitherWay={blockStatus.isBlockedEitherWay}
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
            onReport={() => setReportOpen(true)}
            onReportUser={() => setUserReportOpen(true)}
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

      <ReportReasonModal
        open={userReportOpen}
        onClose={() => setUserReportOpen(false)}
        title="Báo cáo người dùng"
        icon={faUserSlash}
        iconClassName={reportModalStyles.iconUser}
        subtitle={
          activeConversation?.username ? (
            <>
              Bạn đang báo cáo tài khoản{" "}
              <strong>
                {activeConversation.username.startsWith("@")
                  ? activeConversation.username
                  : `@${activeConversation.username}`}
              </strong>
            </>
          ) : (
            "Bạn đang báo cáo tài khoản này"
          )
        }
        detailPlaceholder="Mô tả cụ thể hành vi vi phạm của người dùng này..."
        onSubmit={handleSubmitUserReport}
      />
    </div>
  );
}

export default MessagesPage;
