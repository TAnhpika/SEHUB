import dash from "./AdminDashboardPage.module.css";

function DashboardStudentPlan({ plan }) {
  return (
    <article className={dash.card}>
      <header className={dash.cardHeadMinimal}>
        <h2 className={dash.cardTitle}>Student Basic / Premium</h2>
      </header>
      <div className={dash.planCompact}>
        <div
          className={dash.planStackBar}
          role="img"
          aria-label={`Basic ${plan.basic.percent}%, Premium ${plan.premium.percent}%`}
        >
          <div className={dash.planStackBasic} style={{ width: `${plan.basic.percent}%` }} />
          <div className={dash.planStackPremium} style={{ width: `${plan.premium.percent}%` }} />
        </div>
        <div className={dash.planMetrics}>
          <div className={dash.planMetric}>
            <span className={dash.planMetricValue}>
              {plan.basic.count.toLocaleString("vi-VN")}
            </span>
            <span className={dash.planMetricPct}>
              Basic · {plan.basic.percent}%
            </span>
          </div>
          <div className={dash.planMetric}>
            <span className={dash.planMetricValue}>{plan.premium.count.toLocaleString("vi-VN")}</span>
            <span className={dash.planMetricPct}>Premium · {plan.premium.percent}%</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default DashboardStudentPlan;
