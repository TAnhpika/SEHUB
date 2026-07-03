import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getNotificationIcon,
  NOTIFICATION_META,
} from "@/features/notifications/notificationTypes";
import styles from "./NotificationListItem.module.css";

function NotificationListItem({ item, onClick, className, role = "menuitem" }) {
  const meta = NOTIFICATION_META[item.type] ?? NOTIFICATION_META.comment;
  const icon = getNotificationIcon(item.type);

  return (
    <button
      type="button"
      role={role}
      className={[
        styles.item,
        item.read ? styles.itemRead : styles.itemUnread,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onClick?.(item)}
    >
      <span
        className={`${styles.iconWrap} ${styles[`icon-${meta.tone}`]}`}
        aria-hidden="true"
      >
        <FontAwesomeIcon icon={icon} className={styles.icon} />
      </span>

      <span className={styles.content}>
        <span className={styles.category}>{meta.label}</span>
        <span className={styles.title}>{item.title}</span>
        {item.body ? <span className={styles.body}>{item.body}</span> : null}
        <span className={styles.time}>{item.time}</span>
      </span>

      {!item.read ? <span className={styles.dot} aria-hidden="true" /> : null}
    </button>
  );
}

export default NotificationListItem;
