import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCommentDots,
  faFileLines,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { faBell as faBellOutline } from "@fortawesome/free-regular-svg-icons";
import { useAuth } from "@/context";
import { NOTIFICATIONS, NOTIFICATION_META } from "./notificationData";
import styles from "./NotificationDropdown.module.css";

const TYPE_ICONS = {
  comment: faCommentDots,
  exam: faFileLines,
  streak: faFire,
};

function NotificationDropdown() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(NOTIFICATIONS);
  const rootRef = useRef(null);
  const panelId = useId();

  const notifications = useMemo(
    () =>
      items.map((item) =>
        item.id === "notif-3"
          ? {
              ...item,
              title: `Bạn đã duy trì streak ${user?.streak ?? 0} ngày — tiếp tục phát huy nhé!`,
            }
          : item,
      ),
    [items, user?.streak],
  );

  const unreadItems = notifications.filter((item) => !item.read).length;
  const hasNotifications = notifications.length > 0;

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleMarkAllRead() {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  function handleItemClick(id) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles["trigger-open"] : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Thông báo (${unreadItems} chưa đọc)`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <FontAwesomeIcon icon={faBellOutline} className={styles["bell-icon"]} />
        {unreadItems > 0 && <span className={styles.badge}>{unreadItems}</span>}
      </button>

      {open && (
        <div id={panelId} className={styles.dropdown} role="dialog" aria-label="Thông báo">
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

          {hasNotifications ? (
            <ul className={styles.list}>
              {notifications.map((item) => {
                const meta = NOTIFICATION_META[item.type] ?? NOTIFICATION_META.comment;
                const icon = TYPE_ICONS[item.type] ?? faBell;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${styles.item} ${item.read ? styles["item-read"] : styles["item-unread"]}`}
                      onClick={() => handleItemClick(item.id)}
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
          ) : (
            <div className={styles.empty}>
              <span className={styles["empty-icon"]} aria-hidden="true">
                <FontAwesomeIcon icon={faBellOutline} />
              </span>
              <p className={styles["empty-title"]}>Chưa có thông báo</p>
              <p className={styles["empty-desc"]}>Cập nhật mới sẽ hiển thị tại đây.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
