import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { QUICK_LINK_ICONS } from "@/features/admin/dashboard/dashboardConstants";
import dash from "./AdminDashboardPage.module.css";

/**
 * @param {{ links: { to: string; label: string; desc?: string }[] }} props
 */
function DashboardQuickLinks({ links }) {
  return (
    <nav className={dash.quickNav} aria-label="Lối tắt quản trị">
      {links.map((item) => {
        const icon = QUICK_LINK_ICONS[item.to];
        return (
          <Link key={item.to} to={item.to} className={dash.quickNavLink}>
            <span className={dash.quickNavIcon} aria-hidden>
              {icon ? <FontAwesomeIcon icon={icon} /> : null}
            </span>
            <span className={dash.quickNavCopy}>
              <span className={dash.quickNavLabel}>{item.label}</span>
              {item.desc ? <span className={dash.quickNavDesc}>{item.desc}</span> : null}
            </span>
            <FontAwesomeIcon icon={faChevronRight} className={dash.quickNavArrow} />
          </Link>
        );
      })}
    </nav>
  );
}

export default DashboardQuickLinks;
