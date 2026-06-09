import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import {
  getAdminHeaderNotifications,
  getAdminNotificationCount,
} from "@/features/admin/adminHeaderNotifications";
import styles from "./AdminHeader.module.css";

function AdminNotificationDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  const notifications = useMemo(
    () => getAdminHeaderNotifications(),
    [location.pathname, location.key],
  );
  const unreadCount = useMemo(
    () => getAdminNotificationCount(),
    [location.pathname, location.key],
  );

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

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const actionItems = notifications.filter((item) => item.kind === "action");
  const activityItems = notifications.filter((item) => item.kind === "activity");

  return (
    <div className={styles.toolDropdown} ref={rootRef}>
      <button
        type="button"
        className={`${styles.toolBtn} ${open ? styles.toolBtnActive : ""}`}
        aria-label={`Thông báo (${unreadCount} việc chờ)`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 ? (
          <span className={styles.notifBadge} aria-hidden>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className={styles.toolPanel}
          role="dialog"
          aria-label="Thông báo Admin"
        >
          <header className={styles.toolPanelHead}>
            <h2 className={styles.toolPanelTitle}>Thông báo</h2>
            {unreadCount > 0 ? (
              <span className={styles.toolPanelMeta}>{unreadCount} việc chờ</span>
            ) : null}
          </header>

          {notifications.length === 0 ? (
            <p className={styles.toolPanelEmpty}>Không có việc cần xử lý — hệ thống ổn định.</p>
          ) : (
            <div className={styles.toolPanelBody}>
              {actionItems.length > 0 ? (
                <section>
                  <p className={styles.toolPanelSection}>Cần xử lý</p>
                  <ul className={styles.notifList}>
                    {actionItems.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={item.to}
                          className={`${styles.notifItem} ${
                            item.urgent ? styles.notifItemUrgent : ""
                          }`}
                          onClick={() => setOpen(false)}
                        >
                          <span className={styles.notifItemTitle}>{item.title}</span>
                          <span className={styles.notifItemDesc}>{item.desc}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {activityItems.length > 0 ? (
                <section>
                  <p className={styles.toolPanelSection}>Hoạt động gần đây</p>
                  <ul className={styles.notifList}>
                    {activityItems.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={item.to}
                          className={styles.notifItem}
                          onClick={() => setOpen(false)}
                        >
                          <span className={styles.notifItemTitle}>{item.title}</span>
                          <span className={styles.notifItemTime}>{item.time}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}

          <footer className={styles.toolPanelFoot}>
            <Link
              to="/admin/activity"
              className={styles.toolPanelLink}
              onClick={() => setOpen(false)}
            >
              Xem nhật ký đầy đủ
            </Link>
          </footer>
        </div>
      ) : null}
    </div>
  );
}

export default AdminNotificationDropdown;
