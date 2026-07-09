/**
 * @fileoverview Dropdown lối tắt nghiệp vụ dành cho Moderator trong header SEHUB.
 *
 * Panel này gom các tuyến điều hướng moderator hay dùng nhất như xử lý báo cáo,
 * duyệt bài và theo dõi tài khoản vi phạm để giảm số lần mở sidebar khi thao tác nhanh.
 *
 * @module common/Header/ModeratorHeader/ModeratorSettingsDropdown
 * @see {@link module:common/Header/ModeratorHeader/moderatorHeaderData} - Nguồn dữ liệu lối tắt moderator.
 */

import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { MODERATOR_QUICK_LINKS } from "./moderatorHeaderData";
import headerStyles from "./ModeratorHeader.module.css";
import styles from "./ModeratorHeaderDropdown.module.css";

/**
 * @typedef {Object} ModeratorSettingsDropdownProps
 * @property {boolean} open - Trạng thái panel đang mở hay đóng.
 * @property {() => void} onToggle - Callback mở/đóng panel khi nhấn nút bánh răng.
 * @property {() => void} onClose - Callback đóng panel khi chọn item, click ngoài hoặc nhấn Escape.
 */

/**
 * Dropdown chứa các lối tắt điều hướng dành riêng cho moderator.
 *
 * Panel được đóng tự động khi:
 * - click ra ngoài vùng dropdown,
 * - nhấn phím `Escape`,
 * - hoặc chọn một mục điều hướng.
 *
 * @param {ModeratorSettingsDropdownProps} props - Props điều khiển trạng thái của dropdown.
 * @returns {import('react').ReactElement} Nút bánh răng và panel lối tắt moderator.
 *
 * @example
 * <ModeratorSettingsDropdown
 *   open={openPanel === "settings"}
 *   onToggle={() => setOpenPanel("settings")}
 *   onClose={() => setOpenPanel(null)}
 * />
 */
function ModeratorSettingsDropdown({ open, onToggle, onClose }) {
  const rootRef = useRef(null);
  const panelId = useId();

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
        aria-label="Lối tắt kiểm duyệt"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <FontAwesomeIcon icon={faGear} />
      </button>

      {open ? (
        <div id={panelId} className={styles.panel} role="menu" aria-label="Lối tắt kiểm duyệt">
          <p className={styles.panelHeading}>Lối tắt kiểm duyệt</p>
          <p className={styles.panelNote}>
            Moderator quản lý nội dung và tài khoản vi phạm — không cấu hình hệ thống.
          </p>

          <ul className={styles.list}>
            {MODERATOR_QUICK_LINKS.map((item) => (
              <li key={item.id}>
                <Link to={item.to} className={styles.linkItem} role="menuitem" onClick={onClose}>
                  <span className={styles.linkRow}>
                    <span className={styles.linkIcon}>
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <span>
                      <p className={styles.linkLabel}>{item.label}</p>
                      <p className={styles.linkDescription}>{item.description}</p>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default ModeratorSettingsDropdown;
