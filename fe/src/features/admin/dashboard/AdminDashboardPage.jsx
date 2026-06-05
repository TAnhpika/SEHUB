import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import ChartCard from "@/features/admin/dashboard/ChartCard";
import DashboardAnalyticsTabs from "@/features/admin/dashboard/DashboardAnalyticsTabs";
import DashboardBadge from "@/features/admin/dashboard/DashboardBadge";
import DashboardPeriodFilter from "@/features/admin/dashboard/DashboardPeriodFilter";
import DashboardSkeleton from "@/features/admin/dashboard/DashboardSkeleton";
import DashboardStudentPlan from "@/features/admin/dashboard/DashboardStudentPlan";
import KpiGrid from "@/features/admin/dashboard/KpiGrid";
import RechartsBarChart from "@/features/admin/dashboard/charts/RechartsBarChart";
import RechartsLineChart from "@/features/admin/dashboard/charts/RechartsLineChart";
import {
  ACTIVITY_BADGE_VARIANT,
  PENDING_ACTION_BADGE,
} from "@/features/admin/dashboard/dashboardConstants";
import { CHART_COLORS } from "@/features/admin/dashboard/charts/chartTheme";
import { useDashboardData } from "@/features/admin/dashboard/useDashboardData";
import dash from "./AdminDashboardPage.module.css";

const ACTIVITY_TYPE_LABEL = {
  exam: "Đề thi",
  report: "Báo cáo",
  payment: "Thanh toán",
  user: "Tài khoản",
};

function AdminDashboardPage() {
  const { period, setPeriod, data, loading, error, refresh } = useDashboardData("month");

  return (
    <AdminPageLayout title="Dashboard" hidePageHeader>
      {loading ? <DashboardSkeleton /> : null}

      {!loading && error ? (
        <div className={dash.errorState}>
          <p>{error}</p>
          <Button type="button" onClick={refresh}>
            Thử lại
          </Button>
        </div>
      ) : null}

      {!loading && data ? (
        <div
          className={dash.dashboard}
          style={{ "--dash-chart": CHART_COLORS.primary }}
        >
          <header className={dash.pageHead}>
            <h1 className={dash.pageHeroTitle}>Tổng quan hệ thống</h1>
            <DashboardPeriodFilter period={period} onChange={setPeriod} disabled={loading} />
          </header>

          <KpiGrid stats={data.stats} />

          <DashboardStudentPlan plan={data.studentPlan} />

          <section className={dash.chartsRow} aria-label="Biểu đồ chính">
            <ChartCard title="Đăng ký mới" minimal>
              <RechartsLineChart
                data={data.userGrowth.data}
                seriesName={data.userGrowth.seriesName}
                height={200}
              />
            </ChartCard>
            <ChartCard title="Doanh thu Premium" minimal>
              <RechartsBarChart
                data={data.revenue.data}
                seriesName="Doanh thu"
                valueSuffix={data.revenue.valueSuffix}
                height={200}
              />
            </ChartCard>
          </section>

          <section className={dash.insightsRow} aria-label="Phân tích, hoạt động và việc cần xử lý">
            <DashboardAnalyticsTabs
              content={data.content}
              reportStatus={data.reportStatus}
              traffic={data.traffic}
            />

            <ChartCard title="Hoạt động gần đây" minimal viewAllTo="/admin/activity">
              <ul className={dash.activityList}>
                {data.activity.map((item) => (
                  <li key={item.id} className={dash.activityItem}>
                    <span className={dash.activityTime}>{item.time}</span>
                    <span className={dash.activityText}>{item.text}</span>
                    <DashboardBadge variant={ACTIVITY_BADGE_VARIANT[item.type] ?? "neutral"}>
                      {ACTIVITY_TYPE_LABEL[item.type] ?? item.type}
                    </DashboardBadge>
                  </li>
                ))}
              </ul>
            </ChartCard>

            <ChartCard title="Cần xử lý" minimal>
              <ul className={dash.pendingList}>
                {data.pending.map((item) => (
                  <li key={item.id}>
                    <Link to={item.to} className={dash.pendingRow}>
                      <span
                        className={`${dash.actionBadge} ${dash[PENDING_ACTION_BADGE[item.id]] ?? dash.actionMod}`}
                      >
                        {item.count}
                      </span>
                      <span className={dash.pendingLabel}>{item.label}</span>
                      <FontAwesomeIcon icon={faArrowRight} className={dash.pendingArrow} />
                    </Link>
                  </li>
                ))}
              </ul>
            </ChartCard>
          </section>
        </div>
      ) : null}
    </AdminPageLayout>
  );
}

export default AdminDashboardPage;
