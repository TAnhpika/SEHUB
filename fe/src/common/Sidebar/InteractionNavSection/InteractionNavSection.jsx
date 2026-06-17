import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faRobot } from "@fortawesome/free-solid-svg-icons";
import { loadUnreadCount } from "@/features/chat/messagesData";
import { useChatHub } from "@/hooks/useChatHub";

function InteractionNavSection({ pathname, styles, isPremium = false }) {
  const isMessagesActive =
    pathname === "/home/messages" || pathname.startsWith("/home/messages/");
  const isAdvisorActive = pathname === "/home/advisor" || pathname.startsWith("/home/advisor/");
  const [unreadCount, setUnreadCount] = useState(0);

  useChatHub({
    onUnreadCountUpdated: setUnreadCount,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchUnread() {
      try {
        const count = await loadUnreadCount();
        if (!cancelled) {
          setUnreadCount(count);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    }

    fetchUnread();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <>
      <div className={styles.divider} aria-hidden="true" />

      <div className={styles.section}>
        <p className={styles["section-title"]}>Tương tác</p>
        <ul className={styles.list}>
          <li>
            <Link
              to="/home/messages"
              className={`${styles["subject-link"]} ${styles["badge-link"]} ${isMessagesActive ? styles.active : ""}`}
            >
              <span className={styles["link-content"]}>
                <FontAwesomeIcon icon={faMessage} className={styles.icon} />
                Nhắn tin
              </span>
              {unreadCount > 0 && (
                <span className={styles["message-badge"]} aria-label={`${unreadCount} tin nhắn chưa đọc`}>
                  {unreadCount}
                </span>
              )}
            </Link>
          </li>
          {isPremium ? (
            <li>
              <Link
                to="/home/advisor"
                className={`${styles["subject-link"]} ${isAdvisorActive ? styles.active : ""}`}
              >
                <FontAwesomeIcon icon={faRobot} className={styles.icon} />
                Tư vấn AI
              </Link>
            </li>
          ) : null}
        </ul>
      </div>
    </>
  );
}

export default InteractionNavSection;
