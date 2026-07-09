/**
 * @fileoverview Sidebar điều hướng chính cho workspace Moderator SEHUB.
 *
 * Sidebar này hiển thị các nhóm chức năng kiểm duyệt, badge số lượng công việc chờ,
 * thương hiệu khu vực và overlay đóng menu trên màn hình nhỏ. Dữ liệu badge được làm
 * mới từ cache/API và đồng bộ qua các custom event của luồng moderation.
 *
 * @module common/Sidebar/ModeratorSidebar
 * @see {@link module:features/moderator/moderatorNavData} - Cấu hình mục menu và badge.
 */

import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import logoSrc from "@/img/logo.png";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  getModeratorNavBadgeCounts,
  isModeratorNavActive,
  loadModeratorNavBadgeCounts,
  MODERATOR_HOME_PATH,
  MODERATOR_NAV_SECTIONS,
} from "@/features/moderator/moderatorNavData";
import styles from "./ModeratorSidebar.module.css";

const STATS_EVENT = "sehub-moderator-stats-updated";
const EXAM_REPORTS_EVENT = "sehubs-exam-reports-changed";

/**
 * @typedef {Object} ModeratorSidebarNavItem
 * @property {string} id - Mã định danh mục menu.
 * @property {string} label - Nhãn hiển thị trên sidebar.
 * @property {string} to - Đường dẫn điều hướng của mục.
 * @property {boolean} end - Xác định nav chỉ active khi khớp chính xác.
 * @property {string} [badgeKey] - Khóa ánh xạ sang object badge count.
 * @property {import('@fortawesome/fontawesome-svg-core').IconDefinition} [icon] - Icon Font Awesome của mục.
 */

/**
 * @typedef {Object} ModeratorSidebarBadgeCounts
 * @property {number} reports - Số báo cáo cộng đồng đang chờ moderator xử lý.
 * @property {number} content - Số bài viết đang chờ duyệt trước khi công khai.
 */

/**
 * @typedef {Object} NavItemLinkProps
 * @property {ModeratorSidebarNavItem} item - Cấu hình mục điều hướng cần render.
 * @property {string} pathname - Pathname hiện tại từ router để xác định active state.
 * @property {ModeratorSidebarBadgeCounts} badgeCounts - Số lượng công việc chờ theo từng badge key.
 * @property {() => void} onNavigate - Callback đóng sidebar sau khi chuyển trang trên mobile.
 */

/**
 * Render một mục điều hướng trong sidebar moderator.
 *
 * Nếu mục có `badgeKey` và số lượng tương ứng lớn hơn 0, component sẽ hiển thị badge
 * cảnh báo để nhấn mạnh hàng đợi công việc cần xử lý.
 *
 * @param {NavItemLinkProps} props - Props của mục nav.
 * @returns {import('react').ReactElement} Phần tử `<li>` chứa `NavLink` và badge tùy chọn.
 *
 * @example
 * <NavItemLink
 *   item={MODERATOR_NAV_SECTIONS[0].items[0]}
 *   pathname="/moderator/reports"
 *   badgeCounts={{ reports: 3, content: 1 }}
 *   onNavigate={() => setSidebarOpen(false)}
 * />
 */
function NavItemLink({ item, pathname, badgeCounts, onNavigate }) {
  const active = isModeratorNavActive(item, pathname);
  const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        className={() => [styles.link, active ? styles.linkActive : ""].filter(Boolean).join(" ")}
        onClick={onNavigate}
      >
        {item.icon ? (
          <span className={styles.linkIcon} aria-hidden>
            <FontAwesomeIcon icon={item.icon} />
          </span>
        ) : null}
        <span className={styles.linkLabel}>{item.label}</span>
        {badgeCount > 0 ? (
          <span
            className={`${styles.badge} ${item.badgeKey === "reports" ? styles.badgeUrgent : styles.badgeAmber}`}
            aria-label={`${badgeCount} mục chờ`}
          >
            {badgeCount}
          </span>
        ) : null}
      </NavLink>
    </li>
  );
}

/**
 * Sidebar chính của moderator, chịu trách nhiệm:
 * - khóa cuộn body khi menu mobile mở,
 * - tải và đồng bộ badge hàng đợi moderation,
 * - render các nhóm điều hướng từ `MODERATOR_NAV_SECTIONS`.
 *
 * Badge được refresh khi:
 * - component mount,
 * - nhận event cập nhật thống kê moderation,
 * - nhận event thay đổi báo cáo đề thi,
 * - hoặc storage thay đổi giữa các tab.
 *
 * @returns {import('react').ReactElement} Sidebar moderator kèm overlay mobile khi mở menu.
 */
function ModeratorSidebar() {
  const { pathname } = useLocation();
  const { sidebarOpen, setSidebarOpen } = useModeratorPage();
  const [badgeCounts, setBadgeCounts] = useState(() => getModeratorNavBadgeCounts());

  useLockBodyScroll(sidebarOpen);

  useEffect(() => {
    let cancelled = false;

    function refreshBadges() {
      loadModeratorNavBadgeCounts()
        .then((counts) => {
          if (!cancelled) setBadgeCounts(counts);
        })
        .catch(() => {
          if (!cancelled) setBadgeCounts(getModeratorNavBadgeCounts());
        });
    }

    refreshBadges();
    window.addEventListener(STATS_EVENT, refreshBadges);
    window.addEventListener(EXAM_REPORTS_EVENT, refreshBadges);
    window.addEventListener("storage", refreshBadges);

    return () => {
      cancelled = true;
      window.removeEventListener(STATS_EVENT, refreshBadges);
      window.removeEventListener(EXAM_REPORTS_EVENT, refreshBadges);
      window.removeEventListener("storage", refreshBadges);
    };
  }, []);

  /**
   * Đóng sidebar sau khi điều hướng trên thiết bị nhỏ để trả lại không gian nội dung.
   *
   * @returns {void}
   */
  function handleNavClick() {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  }

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
        aria-label="Điều hướng kiểm duyệt"
      >
        <div className={styles.accentBar} aria-hidden />

        <div className={styles.inner}>
          <Link to={MODERATOR_HOME_PATH} className={styles.brand} onClick={handleNavClick}>
            <img src={logoSrc} alt="" className={styles.logo} decoding="async" />
            <span className={styles.brandText}>
              <span className={styles.brandName}>SEHub</span>
              <span className={styles.brandSub}>Moderator</span>
            </span>
          </Link>

          <nav className={styles.nav}>
            {MODERATOR_NAV_SECTIONS.map((section, index) => (
              <div key={section.title} className={styles.section}>
                {index > 0 ? <div className={styles.divider} aria-hidden /> : null}
                <p className={styles.sectionTitle}>{section.title}</p>
                <ul className={styles.sectionLinks}>
                  {section.items.map((item) => (
                    <NavItemLink
                      key={item.id}
                      item={item}
                      pathname={pathname}
                      badgeCounts={badgeCounts}
                      onNavigate={handleNavClick}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default ModeratorSidebar;
