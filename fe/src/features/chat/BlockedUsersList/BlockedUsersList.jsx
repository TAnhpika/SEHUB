import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUsersSlash } from "@fortawesome/free-solid-svg-icons";
import ConversationAvatar from "@/features/chat/ConversationAvatar/ConversationAvatar";
import ChatEmptyState from "@/features/chat/ChatEmptyState/ChatEmptyState";
import styles from "./BlockedUsersList.module.css";

function BlockedUsersList({
  items = [],
  loading = false,
  selectedUserId = null,
  onBack,
  onSelect,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.focus();
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button type="button" className={styles.back} aria-label="Quay lại danh sách hội thoại" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div className={styles.titleWrap}>
          <FontAwesomeIcon icon={faUsersSlash} className={styles.titleIcon} aria-hidden />
          <h2 className={styles.title}>Danh sách bị chặn</h2>
        </div>
      </div>

      {loading && <ChatEmptyState compact title="Đang tải..." />}

      {!loading && items.length === 0 && (
        <ChatEmptyState
          compact
          icon={faUsersSlash}
          title="Chưa chặn ai"
          description="Các tài khoản bạn chặn sẽ hiển thị tại đây."
        />
      )}

      <ul ref={listRef} className={styles.list} tabIndex={-1}>
        {items.map((item) => {
          const isActive = item.userId === selectedUserId;

          return (
            <li key={item.userId}>
              <button
                type="button"
                className={`${styles.item} ${isActive ? styles.active : ""}`}
                onClick={() => onSelect?.(item)}
              >
                <ConversationAvatar conversation={item} />
                <span className={styles.body}>
                  <span className={styles.name}>{item.name}</span>
                  <span className={styles.meta}>@{item.username}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default BlockedUsersList;
