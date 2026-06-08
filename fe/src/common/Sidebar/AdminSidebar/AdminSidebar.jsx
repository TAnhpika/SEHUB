import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import logoSrc from "@/img/logo.png";
import { getAdminNavSections } from "@/features/admin/adminNavData";
import styles from "./AdminSidebar.module.css";

function isNavGroup(item) {
  return item.type === "group" && Array.isArray(item.items);
}

function matchNavPath(pathname, to, end = false) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function isNavItemActive(item, pathname, searchParams) {
  if (item.id === "banned") {
    return pathname === "/admin/moderation/banned";
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

function NavItemLink({ item, nested = false, pathname, searchParams }) {
  const active = isNavItemActive(item, pathname, searchParams);
  const to = item.search
    ? { pathname: item.to, search: item.search }
    : item.to;

  return (
    <li>
      <NavLink
        to={to}
        end={item.end}
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

function NavGroup({ group, pathname, searchParams }) {
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
  const navSections = getAdminNavSections();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.accentBar} aria-hidden />

      <div className={styles.inner}>
        <Link to="/admin" className={styles.brand}>
          <img src={logoSrc} alt="" className={styles.logo} decoding="async" />
          <span className={styles.brandText}>
            <span className={styles.brandName}>SEHub</span>
            <span className={styles.brandSub}>Admin</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Điều hướng quản trị">
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
                    />
                  ) : (
                    <NavItemLink
                      key={item.id}
                      item={item}
                      pathname={pathname}
                      searchParams={searchParams}
                    />
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default AdminSidebar;
