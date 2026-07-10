import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import logoSrc from "@/img/logo.png";
import { useAdminPage } from "@/features/admin/context/AdminPageContext";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { getAdminNavSections } from "@/features/admin/adminNavData";
import {
  getAdminNavBadgeCounts,
  loadAdminNavBadgeCounts,
} from "@/features/admin/adminNavBadges";
import styles from "./AdminSidebar.module.css";

function isNavGroup(item) {
  return item.type === "group" && Array.isArray(item.items);
}

function matchNavPath(pathname, to, end = false) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

const MODERATION_RESERVED_SEGMENTS = new Set(["content", "practice-submissions", "banned"]);

function isModerationReportsPath(pathname) {
  if (pathname === "/admin/moderation") return true;
  if (!pathname.startsWith("/admin/moderation/")) return false;
  const segment = pathname.slice("/admin/moderation/".length).split("/")[0];
  return !MODERATION_RESERVED_SEGMENTS.has(segment);
}

function isNavItemActive(item, pathname, searchParams) {
  if (item.id === "banned") {
    return pathname === "/admin/moderation/banned";
  }
  if (item.id === "moderation") {
    return isModerationReportsPath(pathname);
  }
  if (item.id === "pending-posts") {
    return pathname.startsWith("/admin/moderation/content");
  }
  if (item.id === "practice-submissions") {
    return pathname.startsWith("/admin/moderation/practice-submissions");
  }
  if (item.id === "feedback") {
    return pathname.startsWith("/admin/feedback");
  }
  if (item.id === "users") {
    return pathname === "/admin/users" || pathname.startsWith("/admin/users/");
  }
  if (item.id === "exams") {
    if (pathname === "/admin/exams") return true;
    if (!pathname.startsWith("/admin/exams/")) return false;
    const segment = pathname.slice("/admin/exams/".length).split("/")[0];
    return segment !== "pending" && segment !== "submissions";
  }
  return matchNavPath(pathname, item.to, item.end);
}

function NavItemLink({ item, nested = false, pathname, searchParams, onNavigate }) {
  const active = isNavItemActive(item, pathname, searchParams);
  const to = item.search
    ? { pathname: item.to, search: item.search }
    : item.to;

  return (
    <li>
      <NavLink
        to={to}
        end={item.end}
        onClick={onNavigate}
        className={() =>
          [nested ? styles.linkNested : styles.link, active ? styles.linkActive : ""]
            .filter(Boolean)
            .join(" ")
        }
      >
        {!nested && item.icon ? (
          <span className={styles.linkIcon} aria-hidden>
            <FontAwesomeIcon icon={item.icon} />
          </span>
        ) : (
          <span className={styles.nestedDot} aria-hidden />
        )}
        <span className={styles.linkLabel}>{item.label}</span>
        {item.badge ? (
          <span
            className={[
              styles.badge,
              item.badgeTone === "urgent" ? styles.badgeUrgent : styles.badgeAmber,
            ].join(" ")}
            aria-label={`${item.badge} mục chờ`}
          >
            {item.badge}
          </span>
        ) : null}
      </NavLink>
    </li>
  );
}

function NavGroup({ group, pathname, searchParams, onNavigate }) {
  const childActive = group.items.some((child) =>
    isNavItemActive(child, pathname, searchParams),
  );
  const groupBadge = group.items.reduce(
    (sum, child) => sum + (Number(child.badge) || 0),
    0,
  );

  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <li className={styles.group}>
      <button
        type="button"
        className={`${styles.groupToggle} ${childActive ? styles.groupToggleActive : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.linkIcon} aria-hidden>
          <FontAwesomeIcon icon={group.icon} />
        </span>
        <span className={styles.linkLabel}>{group.label}</span>
        {groupBadge > 0 ? (
          <span
            className={`${styles.badge} ${styles.badgeAmber}`}
            aria-label={`${groupBadge} mục chờ trong nhóm`}
          >
            {groupBadge}
          </span>
        ) : null}
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`${styles.groupChevron} ${open ? styles.groupChevronOpen : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul className={styles.groupLinks}>
          {group.items.map((child) => (
            <NavItemLink
              key={child.id}
              item={child}
              nested
              pathname={pathname}
              searchParams={searchParams}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function AdminSidebar() {
  const { pathname, search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const { sidebarOpen, setSidebarOpen } = useAdminPage();
  const [badgeCounts, setBadgeCounts] = useState(() => getAdminNavBadgeCounts());
  const navSections = getAdminNavSections(badgeCounts);

  useLockBodyScroll(sidebarOpen);

  useEffect(() => {
    let cancelled = false;
    loadAdminNavBadgeCounts().then((counts) => {
      if (!cancelled) setBadgeCounts(counts);
    });
    const refresh = () => {
      loadAdminNavBadgeCounts().then((counts) => {
        if (!cancelled) setBadgeCounts(counts);
      });
    };
    window.addEventListener("sehub-admin-stats-updated", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("sehub-admin-stats-updated", refresh);
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
        aria-label="Điều hướng quản trị"
      >
        <div className={styles.accentBar} aria-hidden />

        <div className={styles.inner}>
          <Link to="/admin" className={styles.brand} onClick={handleNavClick}>
            <img src={logoSrc} alt="" className={styles.logo} decoding="async" />
            <span className={styles.brandText}>
              <span className={styles.brandName}>SEHub</span>
              <span className={styles.brandSub}>Admin</span>
            </span>
          </Link>

          <nav className={styles.nav}>
            {navSections.map((section, index) => (
              <div key={section.title} className={styles.section}>
                {index > 0 ? <div className={styles.divider} aria-hidden /> : null}
                <p className={styles.sectionTitle}>{section.title}</p>
                <ul className={styles.sectionLinks}>
                  {section.items.map((item) =>
                    isNavGroup(item) ? (
                      <NavGroup
                        key={item.id}
                        group={item}
                        pathname={pathname}
                        searchParams={searchParams}
                        onNavigate={handleNavClick}
                      />
                    ) : (
                      <NavItemLink
                        key={item.id}
                        item={item}
                        pathname={pathname}
                        searchParams={searchParams}
                        onNavigate={handleNavClick}
                      />
                    ),
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
