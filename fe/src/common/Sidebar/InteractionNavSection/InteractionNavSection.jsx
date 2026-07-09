/**
 * @fileoverview Section sidebar cho các điểm chạm tương tác như nhắn tin và AI Advisor.
 *
 * @module common/Sidebar/InteractionNavSection
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faRobot } from "@fortawesome/free-solid-svg-icons";
import { loadUnreadCount } from "@/features/chat/messagesData";
import { useChatHub } from "@/hooks/useChatHub";

/**
 * @typedef {Object} InteractionNavSectionProps
 * @property {string} pathname - Pathname hiện tại để xác định trạng thái active.
 * @property {Record<string, string>} styles - CSS module do sidebar cha truyền xuống.
 * @property {boolean} [isPremium=false] - Cờ mở/ẩn lối vào AI Advisor.
 * @property {() => void} [onNavigate] - Callback đóng drawer sau khi người dùng điều hướng.
 */

/**
 * Section điều hướng tính năng tương tác trong sidebar chính.
 *
 * Module này đồng bộ badge tin nhắn chưa đọc từ `useChatHub` và lần fetch đầu qua `loadUnreadCount`.
 * Link AI Advisor chỉ hiện khi người dùng có quyền Premium.
 *
 * @param {InteractionNavSectionProps} props - Props render section tương tác.
 * @returns {import('react').ReactElement} Danh sách link tương tác kèm badge unread.
 *
 * @example
 * <InteractionNavSection
 *   pathname={pathname}
 *   styles={styles}
 *   isPremium={isPremium}
 * />
 */
function InteractionNavSection({ pathname, styles, isPremium = false, onNavigate }) {
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
              onClick={onNavigate}
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
                onClick={onNavigate}
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
