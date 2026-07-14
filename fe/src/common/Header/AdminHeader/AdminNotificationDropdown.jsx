import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { mapNotificationItem } from "@/api/notificationsMapper";
import { useChatHub } from "@/hooks/useChatHub";
import {
  getAdminHeaderNotifications,
  getAdminNotificationCount,
  isAdminWorkflowPush,
  loadAdminHeaderNotifications,
  loadAdminNotificationCount,
} from "@/features/admin/adminHeaderNotifications";
import styles from "./AdminHeader.module.css";

function mapIncomingAdminNotification(payload) {
  const mapped = mapNotificationItem(payload);
  if (!isAdminWorkflowPush(mapped)) {
    return null;
  }

  return {
    id: `notif-${mapped.id}`,
    kind: "action",
    title: mapped.title,
    desc: mapped.body || null,
    time: mapped.time,
    to: mapped.linkUrl || "/admin",
    urgent: !mapped.read,
  };
}

function NotificationSection({ label, items, urgentLabel, onNavigate }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.notifPanelSection}>
      <p
        className={`${styles.notifPanelSectionLabel} ${
          urgentLabel ? styles.notifPanelSectionUrgent : ""
        }`}
      >
        {label}
      </p>
      <ul className={styles.notifList}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.to}
              className={`${styles.notifItem} ${item.urgent ? styles.notifItemUrgent : ""}`}
              onClick={onNavigate}
            >
              <span className={styles.notifItemTitle}>{item.title}</span>
              {item.desc ? <span className={styles.notifItemDesc}>{item.desc}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AdminNotificationDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState(() => getAdminHeaderNotifications());
  const [unreadCount, setUnreadCount] = useState(() => getAdminNotificationCount());
  const rootRef = useRef(null);
  const panelId = useId();

  const refreshNotifications = useCallback(() => {
    Promise.all([loadAdminHeaderNotifications(), loadAdminNotificationCount()]).then(
      ([nextPayload, count]) => {
        setPayload(nextPayload);
        setUnreadCount(count);
      },
    );
  }, []);

  useChatHub({
    onNotificationReceived: (incoming) => {
      const item = mapIncomingAdminNotification(incoming);
      if (!item) {
        return;
      }

      setPayload((current) => {
        const adminTasks = current.adminTasks.some((entry) => entry.id === item.id)
          ? current.adminTasks
          : [item, ...current.adminTasks];
        const adminPending = adminTasks.filter((entry) => entry.kind === "action").length;
        const moderationPending = current.moderatorQueue.filter((entry) => entry.kind === "action").length;

        return {
          ...current,
          adminTasks,
          counts: {
            adminPending,
            moderatorPending: moderationPending,
            total: adminPending + moderationPending,
          },
        };
      });
      setUnreadCount((current) => current + 1);
    },
    onNotificationUnreadUpdated: () => {
      refreshNotifications();
    },
  });

  useEffect(() => {
    refreshNotifications();
  }, [location.pathname, location.key, refreshNotifications]);

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

  useEffect(() => {
    if (open) {
      refreshNotifications();
    }
  }, [open, refreshNotifications]);

  const { adminTasks, moderatorQueue, activity, counts } = payload;
  const hasContent =
    adminTasks.length > 0 || moderatorQueue.length > 0 || activity.length > 0;
  const closePanel = () => setOpen(false);

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
          className={`${styles.toolPanel} ${styles.notifPanel}`}
          role="dialog"
          aria-label="Thông báo Admin"
        >
          <header className={styles.notifPanelHead}>
            <div className={styles.notifPanelHeadText}>
              <h2 className={styles.toolPanelTitle}>Thông báo</h2>
              {unreadCount > 0 ? (
                <span className={styles.notifPanelMeta}>{unreadCount} việc chờ</span>
              ) : null}
            </div>
          </header>

          {!hasContent ? (
            <p className={styles.notifPanelEmpty}>Không có việc cần xử lý — hệ thống ổn định.</p>
          ) : (
            <div className={styles.notifPanelBody}>
              {adminTasks.length > 0 ? (
                <NotificationSection
                  label={
                    counts.adminPending > 0
                      ? `Việc Admin (${counts.adminPending})`
                      : "Việc Admin"
                  }
                  items={adminTasks}
                  urgentLabel
                  onNavigate={closePanel}
                />
              ) : moderatorQueue.length > 0 ? (
                <p className={styles.notifPanelEmpty}>Không có việc Admin cần xử lý.</p>
              ) : null}

              <NotificationSection
                label={
                  counts.moderatorPending > 0
                    ? `Kiểm duyệt (${counts.moderatorPending})`
                    : "Kiểm duyệt"
                }
                items={moderatorQueue}
                urgentLabel={false}
                onNavigate={closePanel}
              />

              {activity.length > 0 ? (
                <section className={styles.notifPanelSection}>
                  <p className={styles.notifPanelSectionLabel}>Hoạt động gần đây</p>
                  <ul className={styles.notifList}>
                    {activity.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={item.to}
                          className={styles.notifItem}
                          onClick={closePanel}
                        >
                          <span className={styles.notifItemTitle}>{item.title}</span>
                          {item.time ? (
                            <span className={styles.notifItemTime}>{item.time}</span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}

          <footer className={styles.notifPanelFoot}>
            <Link to="/admin/activity" className={styles.toolPanelLink} onClick={closePanel}>
              Xem nhật ký đầy đủ
            </Link>
          </footer>
        </div>
      ) : null}
    </div>
  );
}

export default AdminNotificationDropdown;
