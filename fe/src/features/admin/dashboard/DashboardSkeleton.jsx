import dash from "./AdminDashboardPage.module.css";

function Shimmer({ className }) {
  return <span className={`${dash.skeleton} ${className ?? ""}`} aria-hidden />;
}

function DashboardSkeleton() {
  return (
    <div className={dash.dashboard} aria-busy="true" aria-label="Đang tải dashboard">
      <Shimmer className={dash.skelPageHead} />
      <Shimmer className={dash.skelKpiPrimary} />
      <Shimmer className={dash.skelPlan} />
      <div className={dash.chartsRow}>
        <Shimmer className={dash.skelChartCard} />
        <Shimmer className={dash.skelChartCard} />
      </div>
      <div className={dash.insightsRow}>
        <Shimmer className={dash.skelTabs} />
        <Shimmer className={dash.skelChartCard} />
        <Shimmer className={dash.skelSideBox} />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
