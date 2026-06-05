import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { splitStatsByTier } from "@/features/admin/dashboard/dashboardConstants";
import dash from "./AdminDashboardPage.module.css";

function KpiCell({ stat }) {
  return (
    <div className={stat.urgent ? `${dash.kpiCell} ${dash.kpiCellUrgent}` : dash.kpiCell}>
      <span className={dash.kpiLabel}>{stat.label}</span>
      <span className={dash.kpiValue}>{stat.value}</span>
      {stat.urgent ? (
        <span className={dash.badgeUrgentTag}>{stat.change}</span>
      ) : (
        <span className={dash.kpiTrendMuted}>
          {stat.trend === "up" ? <FontAwesomeIcon icon={faArrowUp} /> : null}
          {stat.trend === "down" ? <FontAwesomeIcon icon={faArrowDown} /> : null}
          {stat.change}
        </span>
      )}
    </div>
  );
}

/** Chỉ 4 KPI ưu tiên — tránh hai hàng + nhãn nhóm gây rối */
function KpiGrid({ stats }) {
  const { primary } = splitStatsByTier(stats);

  return (
    <section className={dash.kpiStrip} aria-label="Chỉ số chính">
      {primary.map((stat) => (
        <KpiCell key={stat.id} stat={stat} />
      ))}
    </section>
  );
}

export default KpiGrid;
