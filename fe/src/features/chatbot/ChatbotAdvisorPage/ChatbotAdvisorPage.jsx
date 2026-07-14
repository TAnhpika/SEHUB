import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faCheck,
  faEllipsisVertical,
  faPaperPlane,
  faPen,
  faPlus,
  faRobot,
  faTrash,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  deleteAdvisorConversation,
  loadChatbotConversation,
  loadChatbotConversations,
  loadChatbotSettings,
  renameAdvisorConversation,
  sendAdvisorMessage,
} from "@/features/chatbot/chatbotApi";
import styles from "./ChatbotAdvisorPage.module.css";

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatListTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function ChatbotAdvisorPage() {
  const { aiTokens, spendAiExplainTokens, applyAiTokenRemaining } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlConversationId = searchParams.get("c");

  const [settings, setSettings] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const listRef = useRef(null);

  const syncConversationQuery = useCallback(
    (id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) {
            next.set("c", id);
          } else {
            next.delete("c");
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const refreshConversations = useCallback(async () => {
    const list = await loadChatbotConversations();
    setConversations(list);
    return list;
  }, []);

  const openConversation = useCallback(
    async (id, { syncUrl = true } = {}) => {
      if (!id || !GUID_RE.test(id)) {
        setConversationId(null);
        setMessages([]);
        if (syncUrl) syncConversationQuery(null);
        return;
      }

      setIsThreadLoading(true);
      setMenuOpenId(null);
      try {
        const result = await loadChatbotConversation(id);
        setConversationId(result.conversationId ?? id);
        setMessages(result.messages ?? []);
        if (result.remainingTokens != null) {
          applyAiTokenRemaining(result.remainingTokens);
        }
        if (syncUrl) syncConversationQuery(id);
        setSidebarOpen(false);
      } catch (error) {
        showToast(error?.message ?? "Không tải được đoạn chat.");
        setConversationId(null);
        setMessages([]);
        if (syncUrl) syncConversationQuery(null);
      } finally {
        setIsThreadLoading(false);
      }
    },
    [applyAiTokenRemaining, showToast, syncConversationQuery],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      try {
        const [settingsResult, list] = await Promise.all([
          loadChatbotSettings(),
          loadChatbotConversations(),
        ]);
        if (cancelled) return;

        setSettings(settingsResult);
        setConversations(list);

        const requestedId =
          urlConversationId && GUID_RE.test(urlConversationId) ? urlConversationId : null;
        if (requestedId) {
          const exists = list.some((item) => item.id === requestedId);
          if (exists) {
            await openConversation(requestedId, { syncUrl: false });
          } else {
            syncConversationQuery(null);
          }
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error?.message ?? "Không tải được chatbot.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // Only bootstrap once on mount; URL-driven opens happen via sidebar clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending, isThreadLoading]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest?.("[data-thread-menu]")) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function handleNewChat() {
    setConversationId(null);
    setMessages([]);
    setDraft("");
    setMenuOpenId(null);
    setRenamingId(null);
    syncConversationQuery(null);
    setSidebarOpen(false);
  }

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
      const nextId = result?.conversationId ?? conversationId;
      if (nextId) {
        setConversationId(nextId);
        syncConversationQuery(nextId);
      }
      if (result?.messages?.length) {
        setMessages(result.messages);
      }
      if (result?.remainingTokens != null) {
        applyAiTokenRemaining(result.remainingTokens);
      }
      await refreshConversations().catch(() => {});
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

  function startRename(conversation) {
    setRenamingId(conversation.id);
    setRenameDraft(conversation.title || "");
    setMenuOpenId(null);
  }

  async function commitRename(id) {
    const title = renameDraft.trim();
    if (!title) {
      showToast("Tiêu đề không được để trống.");
      return;
    }
    try {
      const updated = await renameAdvisorConversation(id, title);
      setConversations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updated } : item)),
      );
      setRenamingId(null);
      setRenameDraft("");
    } catch (error) {
      showToast(error?.message ?? "Không đổi được tên đoạn chat.");
    }
  }

  async function handleDelete(id) {
    setMenuOpenId(null);
    const confirmed = window.confirm("Xóa đoạn chat này? Không thể hoàn tác.");
    if (!confirmed) return;

    try {
      await deleteAdvisorConversation(id);
      setConversations((prev) => prev.filter((item) => item.id !== id));
      if (conversationId === id) {
        handleNewChat();
      }
      showToast("Đã xóa đoạn chat.");
    } catch (error) {
      showToast(error?.message ?? "Không xóa được đoạn chat.");
    }
  }

  const welcomeText = settings?.welcomeMessage ?? "Xin chào! Tôi có thể hỗ trợ bạn về học vụ và SEHub.";

  return (
    <div className={styles.page}>
      <p className={styles.intro}>
        Trợ lý AI học vụ — hỏi về thủ tục, Premium, thi cử và cách dùng SEHub. Mỗi tin nhắn tốn{" "}
        {aiTokens.cost} token. Lịch sử được lưu theo tài khoản, không mất khi đăng xuất.
      </p>

      <div className={styles.shell}>
        <aside
          className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
          aria-label="Lịch sử chat AI"
        >
          <button type="button" className={styles.newChatBtn} onClick={handleNewChat}>
            <FontAwesomeIcon icon={faPlus} />
            Đoạn chat mới
          </button>

          <div className={styles.threadList}>
            {isLoading ? <p className={styles.sidebarEmpty}>Đang tải lịch sử...</p> : null}
            {!isLoading && conversations.length === 0 ? (
              <p className={styles.sidebarEmpty}>Chưa có đoạn chat nào.</p>
            ) : null}
            {conversations.map((item) => {
              const isActive = item.id === conversationId;
              const isRenaming = renamingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`${styles.threadItem} ${isActive ? styles.threadItemActive : ""}`}
                >
                  {isRenaming ? (
                    <div className={styles.renameRow}>
                      <input
                        className={styles.renameInput}
                        value={renameDraft}
                        onChange={(event) => setRenameDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitRename(item.id);
                          }
                          if (event.key === "Escape") {
                            setRenamingId(null);
                          }
                        }}
                        autoFocus
                        aria-label="Đổi tên đoạn chat"
                      />
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => commitRename(item.id)}
                        aria-label="Lưu tên"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => setRenamingId(null)}
                        aria-label="Hủy đổi tên"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.threadMain}
                        onClick={() => openConversation(item.id)}
                      >
                        <span className={styles.threadTitle}>{item.title || "Đoạn chat"}</span>
                        <span className={styles.threadTime}>
                          {formatListTime(item.updatedAt ?? item.createdAt)}
                        </span>
                      </button>
                      <div className={styles.threadMenu} data-thread-menu>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Tuỳ chọn đoạn chat"
                          aria-expanded={menuOpenId === item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuOpenId((prev) => (prev === item.id ? null : item.id));
                          }}
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </button>
                        {menuOpenId === item.id ? (
                          <div className={styles.menuPopover} role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => startRename(item)}
                            >
                              <FontAwesomeIcon icon={faPen} />
                              Đổi tên
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className={styles.menuDanger}
                              onClick={() => handleDelete(item.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              Xóa
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            className={styles.sidebarBackdrop}
            aria-label="Đóng lịch sử"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <div className={styles.chat} aria-label="Chatbot tư vấn học vụ">
          <header className={styles.header}>
            <button
              type="button"
              className={styles.mobileSidebarToggle}
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở lịch sử chat"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
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
            {isLoading || isThreadLoading ? <p className={styles.empty}>Đang tải...</p> : null}
            {!isLoading && !isThreadLoading && messages.length === 0 && !isSending ? (
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
    </div>
  );
}

export default ChatbotAdvisorPage;
