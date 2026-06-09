import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import DashboardHorizontalBars from "@/features/admin/dashboard/charts/DashboardHorizontalBars";
import RechartsLineChart from "@/features/admin/dashboard/charts/RechartsLineChart";
import RechartsPieChart from "@/features/admin/dashboard/charts/RechartsPieChart";
import dash from "./AdminDashboardPage.module.css";

const TABS = [
  { id: "content", label: "Nội dung" },
  { id: "reports", label: "Báo cáo" },
  { id: "traffic", label: "Lưu lượng" },
];

function sourceBadge(dataSource) {
  if (dataSource === "sample") {
    return <span className={dash.dataBadgeSample}>Dữ liệu mẫu</span>;
  }
  if (dataSource === "live") {
    return <span className={dash.dataBadgeLive}>Từ store</span>;
  }
  return null;
}

function DashboardAnalyticsTabs({
  content,
  contentDataSource,
  reportStatus,
  reportStatusDataSource,
  traffic,
}) {
  const [active, setActive] = useState("content");

  const activeSource =
    active === "content"
      ? contentDataSource
      : active === "reports"
        ? reportStatusDataSource
        : traffic.dataSource;

  return (
    <article className={dash.card}>
      <div className={dash.tabBarWrap}>
        <div className={dash.tabBar} role="tablist" aria-label="Phân tích bổ sung">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              className={active === tab.id ? `${dash.tab} ${dash.tabActive}` : dash.tab}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={dash.tabBarMeta}>
          {sourceBadge(activeSource)}
          <span className={dash.peakBadge}>
            <FontAwesomeIcon icon={faArrowUp} className={dash.peakIcon} />
            peak {traffic.peak.toLocaleString("vi-VN")}
          </span>
        </div>
      </div>

      <div className={dash.cardBody} role="tabpanel">
        {active === "content" ? (
          <RechartsPieChart data={content} height={200} centerLabel="Nội dung" />
        ) : null}
        {active === "reports" ? <DashboardHorizontalBars items={reportStatus} /> : null}
        {active === "traffic" ? (
          <RechartsLineChart
            data={traffic.data}
            seriesName={traffic.seriesName}
            height={200}
          />
        ) : null}
      </div>
    </article>
  );
}

export default DashboardAnalyticsTabs;
