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

function DashboardAnalyticsTabs({ content, reportStatus, traffic }) {
  const [active, setActive] = useState("content");

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
        <span className={dash.peakBadge}>
          <FontAwesomeIcon icon={faArrowUp} className={dash.peakIcon} />
          peak {traffic.peak.toLocaleString("vi-VN")}
        </span>
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
