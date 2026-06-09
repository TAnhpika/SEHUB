import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { MODERATOR_QUICK_LINKS } from "./moderatorHeaderData";
import headerStyles from "./ModeratorHeader.module.css";
import styles from "./ModeratorHeaderDropdown.module.css";

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
