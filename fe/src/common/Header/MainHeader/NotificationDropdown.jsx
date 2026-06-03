import { useEffect, useId, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { NOTIFICATIONS } from "./notificationData";
import styles from "./NotificationDropdown.module.css";

function NotificationDropdown({ unreadCount = 0 }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();
  const hasNotifications = NOTIFICATIONS.length > 0;

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

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles["trigger-open"] : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Thông báo (${unreadCount} chưa đọc)`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <FontAwesomeIcon icon={faBell} className={styles["bell-icon"]} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {open && (
        <div id={panelId} className={styles.dropdown} role="dialog" aria-label="Thông báo">
          <header className={styles.header}>
            <h2 className={styles.title}>Thông báo</h2>
          </header>

          {hasNotifications ? (
            <ul className={styles.list}>
              {NOTIFICATIONS.map((item) => (
                <li key={item.id} className={styles.item}>
                  <p className={styles["item-title"]}>{item.title}</p>
                  <p className={styles["item-time"]}>{item.time}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Chưa có thông báo nào</p>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
