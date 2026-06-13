import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import logoSrc from "@/img/logo.png";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import { refreshPendingContentCount } from "@/features/moderator/content/contentModerationService";
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

function ModeratorSidebar() {
  const { pathname } = useLocation();
  const { sidebarOpen, setSidebarOpen } = useModeratorPage();
  const [badgeCounts, setBadgeCounts] = useState(() => getModeratorNavBadgeCounts());

  useEffect(() => {
    let cancelled = false;

    function refreshBadges() {
      loadModeratorNavBadgeCounts().then((counts) => {
        if (!cancelled) setBadgeCounts(counts);
      });
      refreshPendingContentCount()
        .then(() => {
          if (!cancelled) setBadgeCounts(getModeratorNavBadgeCounts());
        })
        .catch(() => {});
    }

    refreshBadges();
    window.addEventListener(STATS_EVENT, refreshBadges);
    window.addEventListener(EXAM_REPORTS_EVENT, refreshBadges);
    window.addEventListener("sehub-content-moderation-updated", refreshBadges);
    window.addEventListener("storage", refreshBadges);

    return () => {
      cancelled = true;
      window.removeEventListener(STATS_EVENT, refreshBadges);
      window.removeEventListener(EXAM_REPORTS_EVENT, refreshBadges);
      window.removeEventListener("sehub-content-moderation-updated", refreshBadges);
      window.removeEventListener("storage", refreshBadges);
    };
  }, []);

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
