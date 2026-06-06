import { DASHBOARD_PERIOD_OPTIONS } from "./dashboardApi";
import dash from "./AdminDashboardPage.module.css";

function DashboardPeriodFilter({ period, onChange, disabled }) {
  return (
    <div className={dash.periodFilter} role="group" aria-label="Kỳ thống kê">
      {DASHBOARD_PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={period === opt.id ? `${dash.periodBtn} ${dash.periodBtnActive}` : dash.periodBtn}
          aria-pressed={period === opt.id}
          disabled={disabled}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default DashboardPeriodFilter;
