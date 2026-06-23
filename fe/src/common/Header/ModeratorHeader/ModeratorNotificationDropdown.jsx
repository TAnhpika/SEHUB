import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import {
  buildModeratorNotifications,
  loadModeratorNotifications,
  loadModeratorUnreadCount,
} from "./moderatorHeaderData";
import headerStyles from "./ModeratorHeader.module.css";
import styles from "./ModeratorHeaderDropdown.module.css";

function ModeratorNotificationDropdown({ open, onToggle, onClose }) {
  const rootRef = useRef(null);
  const panelId = useId();
  const [notifications, setNotifications] = useState(() => buildModeratorNotifications());
  const [unreadCount, setUnreadCount] = useState(() => buildModeratorNotifications().length);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadModeratorNotifications(), loadModeratorUnreadCount()]).then(([items, count]) => {
      if (!cancelled) {
        setNotifications(items);
        setUnreadCount(count);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${headerStyles.toolBtn} ${open ? headerStyles.toolBtnOpen : ""}`}
        onClick={onToggle}
        aria-label={`Thông báo kiểm duyệt (${unreadCount} việc chờ)`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 ? <span className={headerStyles.notifDot} aria-hidden /> : null}
      </button>

      {open ? (
        <div id={panelId} className={styles.panel} role="dialog" aria-label="Thông báo kiểm duyệt">
          <p className={styles.panelHeading}>Thông báo</p>

          {notifications.length > 0 ? (
            <ul className={styles.list}>
              {notifications.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    className={styles.notifItem}
                    onClick={onClose}
                  >
                    <p className={styles.notifTitle}>{item.title}</p>
                    <p className={styles.notifDetail}>{item.detail}</p>
                    <p className={styles.notifMeta}>
                      <span>{item.time}</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>
              Không có việc chờ trong hàng đợi kiểm duyệt. Bạn sẽ nhận thông báo khi có báo cáo
              mới, bài chờ duyệt hoặc bài nộp thực hành.
            </p>
          )}

          <div className={styles.panelFooter}>
            <Link to="/moderator/reports" className={styles.footerLink} onClick={onClose}>
              Mở hàng đợi báo cáo
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ModeratorNotificationDropdown;
