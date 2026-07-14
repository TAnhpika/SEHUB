/**
 * @fileoverview Dropdown thông báo nghiệp vụ cho moderator trong header SEHUB.
 *
 * Dropdown này tổng hợp thông báo moderation từ API, cache badge cục bộ và tín hiệu
 * realtime từ ChatHub để moderator nhìn thấy ngay các việc chờ như báo cáo, bài viết
 * cần duyệt hoặc bài nộp thực hành cần chấm.
 *
 * @module common/Header/ModeratorHeader/ModeratorNotificationDropdown
 * @see {@link module:common/Header/ModeratorHeader/moderatorHeaderData} - Hàm tải và dựng danh sách thông báo.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { mapNotificationItem } from "@/api/notificationsMapper";
import { useChatHub } from "@/hooks/useChatHub";
import {
  buildModeratorNotifications,
  loadModeratorNotifications,
  loadModeratorUnreadCount,
} from "./moderatorHeaderData";
import headerStyles from "./ModeratorHeader.module.css";
import styles from "./ModeratorHeaderDropdown.module.css";

const STATS_EVENT = "sehub-moderator-stats-updated";

/**
 * @typedef {Object} ModeratorNotificationItem
 * @property {string} id - Định danh duy nhất của thông báo trong danh sách render.
 * @property {string} title - Tiêu đề ngắn gọn của việc chờ xử lý.
 * @property {string} detail - Mô tả bổ sung để moderator hiểu ngữ cảnh.
 * @property {string} time - Nhãn thời gian hoặc trạng thái ưu tiên.
 * @property {string} to - Đường dẫn điều hướng khi người dùng bấm vào thông báo.
 */

/**
 * @typedef {Object} ModeratorNotificationDropdownProps
 * @property {boolean} open - Trạng thái panel đang mở hay đóng.
 * @property {() => void} onToggle - Hàm đảo trạng thái dropdown khi bấm nút chuông.
 * @property {() => void} onClose - Hàm đóng panel khi click ra ngoài hoặc nhấn Escape.
 */

/**
 * Chuẩn hóa payload realtime thành thông báo dành cho moderator.
 *
 * Chỉ giữ lại các notification thuộc workflow moderation hoặc exam review. Những loại
 * thông báo khác sẽ bị bỏ qua để không làm nhiễu header kiểm duyệt.
 *
 * @param {unknown} payload - Payload thô nhận từ ChatHub.
 * @returns {ModeratorNotificationItem | null} Thông báo đã chuẩn hóa hoặc `null` nếu không thuộc moderator workflow.
 *
 * @example
 * const item = mapIncomingModeratorNotification(payload);
 * if (item) {
 *   // thêm vào danh sách dropdown
 * }
 */
function mapIncomingModeratorNotification(payload) {
  const mapped = mapNotificationItem(payload);
  if (mapped.type !== "moderation" && mapped.type !== "examreview" && mapped.type !== "moderatorwelcome") {
    return null;
  }

  return {
    id: `notif-${mapped.id}`,
    title: mapped.title,
    detail: mapped.body || "Cần xử lý",
    time: mapped.time,
    to: mapped.linkUrl || "/moderator/reports",
  };
}

/**
 * Dropdown thông báo ở header moderator.
 *
 * Nguồn dữ liệu:
 * - tải ban đầu từ `loadModeratorNotifications()` và `loadModeratorUnreadCount()`,
 * - nhận realtime qua `useChatHub`,
 * - đóng panel khi click ra ngoài hoặc nhấn `Escape`.
 *
 * @param {ModeratorNotificationDropdownProps} props - Props điều khiển trạng thái mở/đóng dropdown.
 * @returns {import('react').ReactElement} Nút chuông và panel thông báo moderator.
 */
function ModeratorNotificationDropdown({ open, onToggle, onClose }) {
  const rootRef = useRef(null);
  const panelId = useId();
  const [notifications, setNotifications] = useState(() => buildModeratorNotifications());
  const [unreadCount, setUnreadCount] = useState(() => buildModeratorNotifications().length);

  /**
   * Đồng bộ lại danh sách thông báo và số lượng chưa đọc từ API/fallback cục bộ.
   *
   * @returns {void}
   */
  const refreshNotifications = useCallback(() => {
    Promise.all([loadModeratorNotifications(), loadModeratorUnreadCount()]).then(([items, count]) => {
      setNotifications(items);
      setUnreadCount(count);
    });
  }, []);

  useChatHub({
    onNotificationReceived: (payload) => {
      const item = mapIncomingModeratorNotification(payload);
      if (!item) {
        return;
      }

      setNotifications((current) => {
        if (current.some((entry) => entry.id === item.id)) {
          return current;
        }
        return [item, ...current];
      });
      setUnreadCount((current) => current + 1);
      window.dispatchEvent(new CustomEvent(STATS_EVENT));
    },
    onNotificationUnreadUpdated: () => {
      refreshNotifications();
      window.dispatchEvent(new CustomEvent(STATS_EVENT));
    },
  });

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (open) {
      refreshNotifications();
    }
  }, [open, refreshNotifications]);

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
