import { Link } from "react-router-dom";
import dash from "./AdminDashboardPage.module.css";

/**
 * @param {{
 *   title: string;
 *   desc?: string;
 *   stats?: { label: string; value: string; accent?: boolean }[];
 *   minimal?: boolean;
 *   viewAllTo?: string;
 *   viewAllLabel?: string;
 *   dataSource?: "live" | "sample";
 *   children: import('react').ReactNode;
 *   className?: string;
 * }} props
 */
function ChartCard({
  title,
  desc,
  stats,
  minimal = false,
  viewAllTo,
  viewAllLabel = "Xem tất cả",
  dataSource,
  children,
  className = "",
}) {
  const sourceBadge =
    dataSource === "sample" ? (
      <span className={dash.dataBadgeSample}>Dữ liệu mẫu</span>
    ) : dataSource === "live" ? (
      <span className={dash.dataBadgeLive}>Từ store</span>
    ) : null;
  return (
    <article className={`${dash.card} ${className}`.trim()}>
      <header className={minimal ? dash.cardHeadMinimal : dash.cardHead}>
        {minimal ? (
          <>
            <div className={dash.cardHeadMinimalTitle}>
              <h2 className={dash.cardTitle}>{title}</h2>
              {sourceBadge}
            </div>
            {viewAllTo ? (
              <Link to={viewAllTo} className={dash.cardViewAll}>
                {viewAllLabel}
              </Link>
            ) : null}
          </>
        ) : (
          <>
            <div className={dash.cardHeadText}>
              <div className={dash.cardHeadMinimalTitle}>
                <h2 className={dash.cardTitle}>{title}</h2>
                {sourceBadge}
              </div>
              {desc ? <p className={dash.cardDesc}>{desc}</p> : null}
            </div>
            {stats?.length ? (
              <dl className={dash.cardStats}>
                {stats.map((s) => (
                  <div key={s.label} className={dash.cardStat}>
                    <dt>{s.label}</dt>
                    <dd className={s.accent ? dash.cardStatAccent : undefined}>{s.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </>
        )}
      </header>
      <div className={dash.cardBody}>{children}</div>
    </article>
  );
}

export default ChartCard;
