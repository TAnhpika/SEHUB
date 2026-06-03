import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage } from "@fortawesome/free-solid-svg-icons";

export const UNREAD_MESSAGES_COUNT = 3;

function InteractionNavSection({ pathname, styles }) {
  const isActive = pathname === "/home/messages" || pathname.startsWith("/home/messages/");

  return (
    <>
      <div className={styles.divider} aria-hidden="true" />

      <div className={styles.section}>
        <p className={styles["section-title"]}>Tương tác</p>
        <ul className={styles.list}>
          <li>
            <Link
              to="/home/messages"
              className={`${styles["subject-link"]} ${styles["badge-link"]} ${isActive ? styles.active : ""}`}
            >
              <span className={styles["link-content"]}>
                <FontAwesomeIcon icon={faMessage} className={styles.icon} />
                Nhắn tin
              </span>
              {UNREAD_MESSAGES_COUNT > 0 && (
                <span className={styles["message-badge"]} aria-label={`${UNREAD_MESSAGES_COUNT} tin nhắn chưa đọc`}>
                  {UNREAD_MESSAGES_COUNT}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}

export default InteractionNavSection;
