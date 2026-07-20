import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faClipboardCheck,
  faClipboardList,
  faClockRotateLeft,
  faCommentDots,
  faFileLines,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { mapNotificationItem } from "@/api/notificationsMapper";
import { useChatHub } from "@/hooks/useChatHub";
import {
  getAdminHeaderNotifications,
  getAdminNotificationCount,
  isAdminWorkflowPush,
  loadAdminHeaderNotifications,
  loadAdminNotificationCount,
} from "@/features/admin/adminHeaderNotifications";
import { getNotificationIcon } from "@/features/notifications/notificationTypes";
import styles from "./AdminHeader.module.css";

const FALLBACK_ICONS = {
  moderation: faClipboardCheck,
  examreview: faFileLines,
  refund: faRotateLeft,
  feedback: faCommentDots,
  activity: faClockRotateLeft,
  practiceresult: faClipboardList,
};

function resolveItemIcon(item) {
  if (item.type && item.type !== "activity") {
    return getNotificationIcon(item.type);
  }
  return FALLBACK_ICONS[item.type] ?? faBell;
}

function resolveIconTone(item) {
  if (item.kind === "activity") return "neutral";
  if (item.type === "refund") return "amber";
  if (item.type === "examreview") return "purple";
  if (item.urgent) return "blue";
  return "neutral";
}

function mapIncomingAdminNotification(payload) {
  const mapped = mapNotificationItem(payload);
  if (!isAdminWorkflowPush(mapped)) {
    return null;
  }

  return {
    id: `notif-${mapped.id}`,
    kind: "action",
    type: mapped.type,
    title: mapped.title,
    desc: mapped.body || null,
    time: mapped.time,
    to: mapped.linkUrl || "/admin",
    urgent: !mapped.read,
  };
}

function NotificationRow({ item, onNavigate }) {
  const unread = Boolean(item.urgent);
  const iconTone = resolveIconTone(item);

  return (
    <Link
      to={item.to}
      className={`${styles.notifRow} ${unread ? styles.notifRowUnread : styles.notifRowRead}`}
      onClick={onNavigate}
    >
      <span
        className={`${styles.notifAvatar} ${styles[`notifAvatar-${iconTone}`]}`}
        aria-hidden="true"
      >
        <FontAwesomeIcon icon={resolveItemIcon(item)} />
      </span>

      <span className={styles.notifContent}>
        <span className={styles.notifItemTitle}>{item.title}</span>
        {item.desc ? <span className={styles.notifItemDesc}>{item.desc}</span> : null}
        {item.time ? <span className={styles.notifItemTime}>{item.time}</span> : null}
      </span>

      {unread ? <span className={styles.notifUnreadDot} aria-label="Chưa xử lý" /> : null}
    </Link>
  );
}

function NotificationSection({ label, items, emphasize, onNavigate }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.notifPanelSection}>
      <p
        className={`${styles.notifPanelSectionLabel} ${
          emphasize ? styles.notifPanelSectionUrgent : ""
        }`}
      >
        {label}
      </p>
      <ul className={styles.notifList}>
        {items.map((item) => (
          <li key={item.id}>
            <NotificationRow item={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function AdminNotificationDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
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
  const pendingOnly = filter === "pending";

  const visibleAdminTasks = pendingOnly
    ? adminTasks.filter((item) => item.urgent || item.kind === "action")
    : adminTasks;
  const visibleModQueue = pendingOnly
    ? moderatorQueue.filter((item) => item.urgent || item.kind === "action")
    : moderatorQueue;
  const visibleActivity = pendingOnly ? [] : activity;

  const hasContent =
    visibleAdminTasks.length > 0 || visibleModQueue.length > 0 || visibleActivity.length > 0;
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

            <div className={styles.notifFilterTabs} role="tablist" aria-label="Lọc thông báo">
              <button
                type="button"
                role="tab"
                aria-selected={filter === "all"}
                className={`${styles.notifFilterTab} ${filter === "all" ? styles.notifFilterTabActive : ""}`}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === "pending"}
                className={`${styles.notifFilterTab} ${filter === "pending" ? styles.notifFilterTabActive : ""}`}
                onClick={() => setFilter("pending")}
              >
                Việc chờ
              </button>
            </div>
          </header>

          {!hasContent ? (
            <p className={styles.notifPanelEmpty}>
              {pendingOnly
                ? "Không còn việc chờ xử lý."
                : "Không có việc cần xử lý — hệ thống ổn định."}
            </p>
          ) : (
            <div className={styles.notifPanelBody}>
              {visibleAdminTasks.length > 0 ? (
                <NotificationSection
                  label={
                    counts.adminPending > 0
                      ? `Việc Admin (${counts.adminPending})`
                      : "Việc Admin"
                  }
                  items={visibleAdminTasks}
                  emphasize
                  onNavigate={closePanel}
                />
              ) : visibleModQueue.length > 0 && !pendingOnly ? (
                <p className={styles.notifPanelEmptyInline}>Không có việc Admin cần xử lý.</p>
              ) : null}

              <NotificationSection
                label={
                  counts.moderatorPending > 0
                    ? `Kiểm duyệt (${counts.moderatorPending})`
                    : "Kiểm duyệt"
                }
                items={visibleModQueue}
                emphasize={false}
                onNavigate={closePanel}
              />

              {visibleActivity.length > 0 ? (
                <NotificationSection
                  label="Hoạt động gần đây"
                  items={visibleActivity}
                  emphasize={false}
                  onNavigate={closePanel}
                />
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
