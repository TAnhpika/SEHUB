import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { faBell as faBellOutline } from "@fortawesome/free-regular-svg-icons";
import { Modal } from "@/common/Modal/Modal";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notificationsApi";
import { mapNotificationPage } from "@/api/notificationsMapper";
import NotificationListItem from "@/features/notifications/NotificationListItem";
import {
  isVisibleNotification,
  MODAL_PAGE_SIZE,
} from "@/features/notifications/notificationTypes";
import styles from "./NotificationsModal.module.css";

function mergeNotificationItems(current, incoming) {
  const seen = new Set(current.map((item) => item.id));
  const merged = [...current];
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      merged.push(item);
      seen.add(item.id);
    }
  }
  return merged;
}

function NotificationsModal({
  open,
  onClose,
  onItemClick,
  onItemsUpdated,
  liveItem = null,
}) {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const onItemClickRef = useRef(onItemClick);
  const onItemsUpdatedRef = useRef(onItemsUpdated);
  onItemClickRef.current = onItemClick;
  onItemsUpdatedRef.current = onItemsUpdated;

  const unreadCount = items.filter((item) => !item.read).length;
  const hasMore = items.length < totalCount;

  const loadPage = useCallback(async (pageNumber, { append = false } = {}) => {
    const isFirstPage = pageNumber === 1 && !append;
    if (isFirstPage) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getNotifications({
        page: pageNumber,
        pageSize: MODAL_PAGE_SIZE,
      });
      const mapped = mapNotificationPage(response);
      const visible = mapped.items.filter(isVisibleNotification);

      setTotalCount(mapped.totalCount);
      setPage(pageNumber);
      setItems((current) => (append ? mergeNotificationItems(current, visible) : visible));
    } catch (err) {
      if (!append) {
        setItems([]);
        setTotalCount(0);
        setError(err.message ?? "Không tải được thông báo.");
      }
    } finally {
      if (isFirstPage) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setItems([]);
      setTotalCount(0);
      setPage(1);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    loadPage(1);
  }, [open, loadPage]);

  useEffect(() => {
    if (!open || !liveItem || !isVisibleNotification(liveItem)) {
      return;
    }

    setItems((current) => {
      if (current.some((item) => item.id === liveItem.id)) {
        return current;
      }
      return [liveItem, ...current];
    });
    setTotalCount((count) => Math.max(count + 1, 1));
  }, [open, liveItem]);

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      onItemsUpdatedRef.current?.({ markAllRead: true });
    } catch {
      /* ignore */
    }
  }

  async function handleItemClick(item) {
    if (!item.read) {
      try {
        await markNotificationRead(item.id);
      } catch {
        /* ignore */
      }
      setItems((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
      );
      onItemsUpdatedRef.current?.({ itemId: item.id, read: true });
    }

    onItemClickRef.current?.(item);
  }

  function handleLoadMore() {
    if (!hasMore || loadingMore) return;
    loadPage(page + 1, { append: true });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tất cả thông báo"
      panelClassName={styles.panel}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Hộp thư</p>
          <h2 className={styles.title}>Tất cả thông báo</h2>
          {!loading && totalCount > 0 ? (
            <p className={styles.meta}>
              {unreadCount > 0 ? `${unreadCount} chưa đọc · ` : ""}
              {totalCount} tổng cộng
            </p>
          ) : null}
        </div>
        <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      {unreadCount > 0 ? (
        <div className={styles.actions}>
          <button type="button" className={styles.markReadBtn} onClick={handleMarkAllRead}>
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className={styles.status}>Đang tải thông báo…</p>
      ) : error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <FontAwesomeIcon icon={faBellOutline} />
          </span>
          <p className={styles.emptyTitle}>Chưa có thông báo</p>
          <p className={styles.emptyDesc}>Cập nhật mới sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} role="none">
              <NotificationListItem item={item} onClick={handleItemClick} role="button" />
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && hasMore ? (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Đang tải…" : `Tải thêm (${items.length}/${totalCount})`}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}

export default NotificationsModal;
