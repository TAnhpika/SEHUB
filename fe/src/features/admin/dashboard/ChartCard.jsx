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
  children,
  className = "",
}) {
  return (
    <article className={`${dash.card} ${className}`.trim()}>
      <header className={minimal ? dash.cardHeadMinimal : dash.cardHead}>
        {minimal ? (
          <>
            <h2 className={dash.cardTitle}>{title}</h2>
            {viewAllTo ? (
              <Link to={viewAllTo} className={dash.cardViewAll}>
                {viewAllLabel}
              </Link>
            ) : null}
          </>
        ) : (
          <>
            <div className={dash.cardHeadText}>
              <h2 className={dash.cardTitle}>{title}</h2>
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
