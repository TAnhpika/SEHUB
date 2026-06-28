import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBan,
  faCircleInfo,
  faFaceSmile,
  faFile,
  faFlag,
  faImage,
  faPaperPlane,
  faPaperclip,
  faPhone,
  faUser,
  faVideo,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import ConversationAvatar from "@/features/chat/ConversationAvatar/ConversationAvatar";
import EmojiPicker from "@/features/chat/EmojiPicker/EmojiPicker";
import ChatImageLightbox from "@/features/chat/ChatImageLightbox/ChatImageLightbox";
import { useToast } from "@/common/Toast/ToastProvider";
import { formatPresenceLabel, presenceTier } from "@/utils/presenceStatus";
import styles from "./ConversationChat.module.css";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const FILE_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,text/plain";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageBubble({ message, onImageClick }) {
  if (message.messageType === "image" && message.attachmentUrl) {
    return (
      <div className={styles.bubble}>
        {message.text?.trim() && <p className={styles.caption}>{message.text}</p>}
        <button
          type="button"
          className={styles.imageButton}
          aria-label="Phóng to ảnh"
          onClick={() =>
            onImageClick?.({
              url: message.attachmentUrl,
              alt: message.attachmentFileName || "Ảnh đính kèm",
            })
          }
        >
          <img
            src={message.attachmentUrl}
            alt={message.attachmentFileName || "Ảnh đính kèm"}
            className={styles.imageAttachment}
            loading="lazy"
          />
        </button>
      </div>
    );
  }

  if (message.messageType === "file" && message.attachmentUrl) {
    return (
      <div className={styles.bubble}>
        {message.text?.trim() && <p className={styles.caption}>{message.text}</p>}
        <a
          href={message.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.fileAttachment}
          download={message.attachmentFileName || undefined}
        >
          <FontAwesomeIcon icon={faFile} className={styles.fileIcon} />
          <span className={styles.fileMeta}>
            <span className={styles.fileName}>{message.attachmentFileName || "Tệp đính kèm"}</span>
            {message.attachmentSizeBytes ? (
              <span className={styles.fileSize}>{formatFileSize(message.attachmentSizeBytes)}</span>
            ) : null}
          </span>
        </a>
      </div>
    );
  }

  return <div className={styles.bubble}>{message.text}</div>;
}

function ConversationChat({
  conversation,
  messages = [],
  onSend,
  sending = false,
  loading = false,
  compact = false,
  onBack,
  onClose,
  isBlockedByMe = false,
  isBlockedEitherWay = false,
  onBlock,
  onUnblock,
  onReport,
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const menuRef = useRef(null);
  const emojiAnchorRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageListRef = useRef(null);

  const renderedMessages = useMemo(() => messages, [messages]);
  const inputDisabled = sending || isBlockedEitherWay;

  const rowVirtualizer = useVirtualizer({
    count: renderedMessages.length,
    getScrollElement: () => messageListRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });

  useEffect(() => {
    if (loading || renderedMessages.length === 0) return;
    rowVirtualizer.scrollToIndex(renderedMessages.length - 1, { align: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll when message count changes
  }, [renderedMessages.length, loading]);

  async function handleSendText() {
    const text = draft.trim();
    if (!text || inputDisabled) return;

    setDraft("");
    await onSend?.({ text });
  }

  async function handleAttachmentSelected(file) {
    if (!file || inputDisabled) return;

    const caption = draft.trim();
    setDraft("");
    await onSend?.({ text: caption, file });
  }

  function handleEmojiSelect(emoji) {
    setDraft((current) => `${current}${emoji}`);
    setEmojiOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendText();
    }
  }

  function showComingSoonFeature() {
    showToast("Tính năng đang phát triển...");
  }

  function openOtherProfile() {
    if (!conversation?.username) return;
    navigate(`/profile/${conversation.username}`);
  }

  const presence = {
    isOnline: conversation?.online ?? false,
    lastSeenAt: conversation?.lastSeenAt ?? null,
  };
  const statusLabel = conversation?.presenceLabel ?? formatPresenceLabel(presence);
  const statusTier = conversation?.presenceTier ?? presenceTier(presence);

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
              <p
                className={`${styles.status} ${statusTier === "online" ? styles.statusOnline : ""}`}
              >
                {statusLabel}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {!compact && (
            <>
              <button
                type="button"
                className={styles["action-btn"]}
                aria-label="Gọi thoại"
                onClick={showComingSoonFeature}
              >
                <FontAwesomeIcon icon={faPhone} />
              </button>
              <button
                type="button"
                className={styles["action-btn"]}
                aria-label="Gọi video"
                onClick={showComingSoonFeature}
              >
                <FontAwesomeIcon icon={faVideo} />
              </button>
            </>
          )}
          <div className={styles["menu-wrap"]} ref={menuRef}>
            <button
              type="button"
              className={styles["action-btn"]}
              aria-label="Tùy chọn hội thoại"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <FontAwesomeIcon icon={faCircleInfo} />
            </button>
            {menuOpen && (
              <div className={styles.menu} role="menu">
                <button
                  type="button"
                  className={`${styles["menu-item"]} ${styles["menu-item-profile"]}`}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    openOtherProfile();
                  }}
                >
                  <span className={styles.menuItemIcon} aria-hidden="true">
                    <FontAwesomeIcon icon={faUser} />
                  </span>
                  Trang cá nhân
                </button>
                <button
                  type="button"
                  className={`${styles["menu-item"]} ${styles["menu-item-report"]}`}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onReport?.();
                  }}
                >
                  <span className={styles.menuItemIcon} aria-hidden="true">
                    <FontAwesomeIcon icon={faFlag} />
                  </span>
                  Báo cáo hội thoại
                </button>
                <button
                  type="button"
                  className={`${styles["menu-item"]} ${isBlockedByMe ? styles["menu-item-unblock"] : styles["menu-item-block"]}`}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    if (isBlockedByMe) {
                      onUnblock?.();
                    } else {
                      onBlock?.();
                    }
                  }}
                >
                  <span className={styles.menuItemIcon} aria-hidden="true">
                    <FontAwesomeIcon icon={faBan} />
                  </span>
                  {isBlockedByMe ? "Bỏ chặn người dùng" : "Chặn người dùng"}
                </button>
              </div>
            )}
          </div>
          {compact && onClose && (
            <button type="button" className={styles["action-btn"]} aria-label="Đóng" onClick={onClose}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      </header>

      <div ref={messageListRef} className={styles.body}>
        {loading && <p className={styles.loading}>Đang tải tin nhắn...</p>}

        {!loading && renderedMessages.length === 0 && (
          <p className={styles.loading}>Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>
        )}

        {!loading && renderedMessages.length > 0 && (
          <div
            className={styles.messageVirtualList}
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const message = renderedMessages[virtualRow.index];
              const isSent = message.type === "sent";

              return (
                <div
                  key={message.id}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  className={`${styles["message-row"]} ${isSent ? styles.sent : styles.received} ${message.type === "date" ? styles["date-row"] : ""}`}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {message.type === "date" ? (
                    <div className={styles["date-divider"]}>
                      <span>{message.label}</span>
                    </div>
                  ) : (
                    <>
                      <MessageBubble message={message} onImageClick={setLightboxImage} />
                      <span className={styles["message-time"]}>{message.time}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        {isBlockedEitherWay && (
          <p className={styles.blockedNotice}>
            {isBlockedByMe
              ? "Bạn đã chặn người dùng này. Bỏ chặn để tiếp tục nhắn tin."
              : "Bạn không thể nhắn tin với người dùng này."}
          </p>
        )}

        <button
          type="button"
          className={styles["footer-btn"]}
          aria-label="Gửi ảnh"
          disabled={inputDisabled}
          onClick={() => imageInputRef.current?.click()}
        >
          <FontAwesomeIcon icon={faImage} />
        </button>

        <button
          type="button"
          className={styles["footer-btn"]}
          aria-label="Gửi tệp"
          disabled={inputDisabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <FontAwesomeIcon icon={faPaperclip} />
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className={styles.hiddenInput}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              handleAttachmentSelected(file);
            }
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_ACCEPT}
          className={styles.hiddenInput}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              handleAttachmentSelected(file);
            }
          }}
        />

        <label className={styles["input-wrap"]}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            aria-label="Nhập tin nhắn"
            disabled={inputDisabled}
          />
          <div className={styles.emojiWrap}>
            <button
              ref={emojiAnchorRef}
              type="button"
              className={styles.emoji}
              aria-label="Chọn emoji"
              aria-expanded={emojiOpen}
              disabled={inputDisabled}
              onClick={() => setEmojiOpen((prev) => !prev)}
            >
              <FontAwesomeIcon icon={faFaceSmile} />
            </button>
            <EmojiPicker
              open={emojiOpen}
              anchorRef={emojiAnchorRef}
              onSelect={handleEmojiSelect}
              onClose={() => setEmojiOpen(false)}
            />
          </div>
        </label>

        <button
          type="button"
          className={styles.send}
          aria-label="Gửi tin nhắn"
          onClick={handleSendText}
          disabled={!draft.trim() || inputDisabled}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </footer>

      <ChatImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}

export default ConversationChat;
