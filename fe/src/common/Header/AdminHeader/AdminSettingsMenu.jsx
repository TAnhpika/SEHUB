import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faCreditCard,
  faGear,
  faTicket,
  faTrophy,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./AdminHeader.module.css";

const SETTINGS_LINKS = [
  {
    id: "activity",
    label: "Nhật ký hoạt động",
    desc: "Audit PayOS, tài khoản, phân quyền",
    to: "/admin/activity",
    icon: faClipboardList,
  },
  {
    id: "payments",
    label: "Thanh toán PayOS",
    desc: "Xác nhận Premium & cộng token",
    to: "/admin/payments",
    icon: faCreditCard,
  },
  {
    id: "permissions",
    label: "Phân quyền Mod",
    desc: "Gán / thu hồi Moderator",
    to: "/admin/permissions",
    icon: faUserShield,
  },
  {
    id: "gamification",
    label: "Gamification",
    desc: "Hạng, danh hiệu, quy tắc điểm",
    to: "/admin/gamification",
    icon: faTrophy,
  },
  {
    id: "vouchers",
    label: "Quản lý voucher",
    desc: "Cấp FTES / giảm Premium",
    to: "/admin/vouchers",
    icon: faTicket,
  },
];

function AdminSettingsMenu() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

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

  return (
    <div className={styles.toolDropdown} ref={rootRef}>
      <button
        type="button"
        className={`${styles.toolBtn} ${open ? styles.toolBtnActive : ""}`}
        aria-label="Cài đặt & lối tắt Admin"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FontAwesomeIcon icon={faGear} />
      </button>

      {open ? (
        <div id={panelId} className={styles.toolPanel} role="menu" aria-label="Cài đặt Admin">
          <header className={styles.toolPanelHead}>
            <h2 className={styles.toolPanelTitle}>Cài đặt & lối tắt</h2>
          </header>

          <div className={styles.toolPanelBody}>
            <p className={styles.toolPanelSection}>Hệ thống</p>
            <ul className={styles.settingsList}>
              {SETTINGS_LINKS.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    className={styles.settingsItem}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.settingsIcon}>
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <span className={styles.settingsCopy}>
                      <span className={styles.settingsLabel}>{item.label}</span>
                      <span className={styles.settingsDesc}>{item.desc}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminSettingsMenu;
