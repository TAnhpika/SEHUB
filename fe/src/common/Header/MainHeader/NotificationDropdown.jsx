import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { faBell as faBellOutline } from "@fortawesome/free-regular-svg-icons";
import {
  getNotifications,
  getNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notificationsApi";
import { mapNotificationItem, mapNotificationPage } from "@/api/notificationsMapper";
import { useChatHub } from "@/hooks/useChatHub";
import { useHoverDropdown } from "@/hooks/useHoverDropdown";
import AccountPenaltyModal from "@/features/account/AccountPenaltyModal/AccountPenaltyModal";
import {
  isAccountPenaltyNotification,
  resolvePenaltyForNotification,
} from "@/features/account/accountPenaltyUtils";
import NotificationListItem from "@/features/notifications/NotificationListItem";
import NotificationsModal from "@/features/notifications/NotificationsModal";
import {
  DROPDOWN_PREVIEW_SIZE,
  isVisibleNotification,
} from "@/features/notifications/notificationTypes";
import styles from "./NotificationDropdown.module.css";

function NotificationDropdown() {
  const navigate = useNavigate();
  const { open, setOpen, rootProps, handleTriggerClick, hide } = useHoverDropdown();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allModalOpen, setAllModalOpen] = useState(false);
  const [liveNotification, setLiveNotification] = useState(null);
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [penaltyDetails, setPenaltyDetails] = useState(null);
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  const hasNotifications = items.length > 0;
  const showViewAll = totalCount > 0 || hasNotifications;

  async function refreshNotifications() {
    try {
      const [page, unread] = await Promise.all([
        getNotifications({ page: 1, pageSize: DROPDOWN_PREVIEW_SIZE }),
        getNotificationUnreadCount(),
      ]);
      const mapped = mapNotificationPage(page);
      const visible = mapped.items.filter(isVisibleNotification);

      setItems(visible);
      setTotalCount(mapped.totalCount);
      setUnreadCount(
        typeof unread?.totalUnread === "number"
          ? unread.totalUnread
          : visible.filter((item) => !item.read).length,
      );
    } catch {
      setItems([]);
      setTotalCount(0);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  useChatHub({
    onNotificationReceived: (payload) => {
      const mapped = mapNotificationItem(payload);
      if (!isVisibleNotification(mapped)) {
        return;
      }

      setLiveNotification(mapped);
      setItems((current) => {
        if (current.some((item) => item.id === mapped.id)) {
          return current;
        }
        return [mapped, ...current].slice(0, DROPDOWN_PREVIEW_SIZE);
      });
      setTotalCount((count) => count + 1);
      if (!mapped.read) {
        setUnreadCount((count) => count + 1);
      }
    },
    onNotificationUnreadUpdated: () => {
      refreshNotifications();
    },
  });

  useEffect(() => {
    refreshNotifications();
  }, []);

  useEffect(() => {
    if (open) {
      refreshNotifications();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  }

  async function handleItemClick(item, { closeDropdown = true, closeAllModal = false } = {}) {
    if (!item.read) {
      try {
        await markNotificationRead(item.id);
      } catch {
        /* ignore */
      }
      setItems((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    if (isAccountPenaltyNotification(item)) {
      if (closeDropdown) {
        setOpen(false);
        hide();
      }
      if (closeAllModal) {
        setAllModalOpen(false);
      }
      setPenaltyModalOpen(true);
      setPenaltyLoading(true);
      setPenaltyDetails(null);
      try {
        const penalty = await resolvePenaltyForNotification(item);
        setPenaltyDetails(penalty);
      } finally {
        setPenaltyLoading(false);
      }
      return;
    }

    if (item.linkUrl) {
      if (closeDropdown) {
        setOpen(false);
        hide();
      }
      if (closeAllModal) {
        setAllModalOpen(false);
      }
      navigate(item.linkUrl);
    }
  }

  const handleModalItemsUpdated = useCallback((update) => {
    if (!update) return;

    if (update.markAllRead) {
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      return;
    }

    if (update.itemId) {
      setItems((prev) =>
        prev.map((entry) => (entry.id === update.itemId ? { ...entry, read: true } : entry)),
      );
      if (update.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    }
  }, []);

  const closeAllModal = useCallback(() => setAllModalOpen(false), []);

  function openViewAllModal() {
    setOpen(false);
    hide();
    setAllModalOpen(true);
  }

  function closePenaltyModal() {
    setPenaltyModalOpen(false);
    setPenaltyDetails(null);
  }

  return (
    <div className={styles.root} ref={rootRef} {...rootProps}>
      <AccountPenaltyModal
        open={penaltyModalOpen}
        penalty={penaltyDetails}
        loading={penaltyLoading}
        onClose={closePenaltyModal}
        variant={penaltyDetails?.penaltyType === "Temp" || penaltyDetails?.penaltyType === "Permanent" ? "ban" : "info"}
      />

      <NotificationsModal
        open={allModalOpen}
        onClose={closeAllModal}
        onItemClick={(item) => handleItemClick(item, { closeDropdown: false, closeAllModal: true })}
        onItemsUpdated={handleModalItemsUpdated}
        liveItem={liveNotification}
      />

      <button
        type="button"
        className={`${styles.trigger} ${open ? styles["trigger-open"] : ""}`}
        onClick={handleTriggerClick}
        aria-label={`Thông báo (${unreadCount} chưa đọc)`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <FontAwesomeIcon icon={faBellOutline} className={styles["bell-icon"]} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {open && (
        <div id={panelId} className={styles.dropdown} role="menu" aria-label="Thông báo">
          <header className={styles.header}>
            <div className={styles["header-text"]}>
              <h2 className={styles.title}>Thông báo</h2>
              {unreadCount > 0 && (
                <span className={styles["unread-pill"]}>{unreadCount} mới</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button type="button" className={styles["mark-read-btn"]} onClick={handleMarkAllRead}>
                Đánh dấu đã đọc
              </button>
            )}
          </header>

          {loading && <p className={styles.empty}>Đang tải thông báo...</p>}

          {!loading && hasNotifications ? (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id} role="none">
                  <NotificationListItem
                    item={item}
                    onClick={(entry) => handleItemClick(entry)}
                  />
                </li>
              ))}
            </ul>
          ) : !loading ? (
            <div className={styles.empty}>
              <span className={styles["empty-icon"]} aria-hidden="true">
                <FontAwesomeIcon icon={faBellOutline} />
              </span>
              <p className={styles["empty-title"]}>Chưa có thông báo</p>
              <p className={styles["empty-desc"]}>Cập nhật mới sẽ hiển thị tại đây.</p>
            </div>
          ) : null}

          {showViewAll && !loading ? (
            <footer className={styles.footer}>
              <button type="button" className={styles.viewAllBtn} onClick={openViewAllModal}>
                Xem tất cả thông báo
                {totalCount > items.length ? (
                  <span className={styles.viewAllCount}>({totalCount})</span>
                ) : null}
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </footer>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
