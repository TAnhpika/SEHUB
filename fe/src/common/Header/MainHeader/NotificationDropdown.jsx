import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCommentDots,
  faFileLines,
  faFire,
  faUserPlus,
  faUserGroup,
  faRotateLeft,
  faClipboardCheck,
  faAt,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
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
import { NOTIFICATION_META } from "./notificationData";
import styles from "./NotificationDropdown.module.css";

function isVisibleNotification(item) {
  return item.type !== "message";
}

const TYPE_ICONS = {
  comment: faCommentDots,
  exam: faFileLines,
  streak: faFire,
  follow: faUserPlus,
  friendrequest: faUserGroup,
  friendaccepted: faUserGroup,
  like: faCommentDots,
  token: faBell,
  badge: faBell,
  refund: faRotateLeft,
  moderation: faClipboardCheck,
  examreview: faFileLines,
  mention: faAt,
  practiceresult: faClipboardList,
};

function NotificationDropdown() {
  const navigate = useNavigate();
  const { open, setOpen, rootProps, handleTriggerClick } = useHoverDropdown();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef(null);
  const panelId = useId();

  const unreadItems = items.filter((item) => !item.read).length;
  const hasNotifications = items.length > 0;

  const notifications = useMemo(() => items, [items]);

  async function refreshNotifications() {
    try {
      const [page, unread] = await Promise.all([
        getNotifications({ page: 1, pageSize: 20 }),
        getNotificationUnreadCount(),
      ]);
      const mapped = mapNotificationPage(page);
      setItems(mapped.items.filter(isVisibleNotification));

      if (typeof unread?.totalUnread === "number" && unread.totalUnread !== mapped.items.filter((i) => !i.read).length) {
        // keep badge in sync when server count differs from loaded page
      }
    } catch {
      setItems([]);
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
      setItems((current) => {
        if (current.some((item) => item.id === mapped.id)) {
          return current;
        }
        return [mapped, ...current];
      });
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
    }

    if (item.linkUrl) {
      setOpen(false);
      navigate(item.linkUrl);
    }
  }

  return (
    <div className={styles.root} ref={rootRef} {...rootProps}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles["trigger-open"] : ""}`}
        onClick={handleTriggerClick}
        aria-label={`Thông báo (${unreadItems} chưa đọc)`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <FontAwesomeIcon icon={faBellOutline} className={styles["bell-icon"]} />
        {unreadItems > 0 && <span className={styles.badge}>{unreadItems}</span>}
      </button>

      {open && (
        <div id={panelId} className={styles.dropdown} role="menu" aria-label="Thông báo">
          <header className={styles.header}>
            <div className={styles["header-text"]}>
              <h2 className={styles.title}>Thông báo</h2>
              {unreadItems > 0 && (
                <span className={styles["unread-pill"]}>{unreadItems} mới</span>
              )}
            </div>
            {unreadItems > 0 && (
              <button type="button" className={styles["mark-read-btn"]} onClick={handleMarkAllRead}>
                Đánh dấu đã đọc
              </button>
            )}
          </header>

          {loading && <p className={styles.empty}>Đang tải thông báo...</p>}

          {!loading && hasNotifications ? (
            <ul className={styles.list}>
              {notifications.map((item) => {
                const meta = NOTIFICATION_META[item.type] ?? NOTIFICATION_META.comment;
                const icon = TYPE_ICONS[item.type] ?? faBell;

                return (
                  <li key={item.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className={`${styles.item} ${item.read ? styles["item-read"] : styles["item-unread"]}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <span
                        className={`${styles.iconWrap} ${styles[`icon-${meta.tone}`]}`}
                        aria-hidden="true"
                      >
                        <FontAwesomeIcon icon={icon} className={styles.icon} />
                      </span>

                      <span className={styles.content}>
                        <span className={styles.category}>{meta.label}</span>
                        <span className={styles["item-title"]}>{item.title}</span>
                        <span className={styles["item-time"]}>{item.time}</span>
                      </span>

                      {!item.read && <span className={styles.dot} aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
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
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
