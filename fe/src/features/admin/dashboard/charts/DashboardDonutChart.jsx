import styles from "./charts.module.css";

const R = 52;
const C = 2 * Math.PI * R;

/**
 * @param {{ segments: { label: string; value: number; color: string }[] }} props
 */
function DashboardDonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;

  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * C;
    const arc = {
      ...seg,
      pct,
      dash,
      offset: -offset,
    };
    offset += dash;
    return arc;
  });

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 140 140" className={styles.donutSvg} role="img" aria-label="Biểu đồ tròn">
        <circle cx="70" cy="70" r={R} className={styles.donutBg} />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth="18"
            strokeDasharray={`${arc.dash} ${C - arc.dash}`}
            strokeDashoffset={arc.offset}
            strokeLinecap="round"
            className={styles.donutSegment}
            transform="rotate(-90 70 70)"
          >
            <title>
              {arc.label}: {arc.value} ({Math.round(arc.pct * 100)}%)
            </title>
          </circle>
        ))}
        <text x="70" y="66" textAnchor="middle" className={styles.donutTotal}>
          {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
        </text>
        <text x="70" y="82" textAnchor="middle" className={styles.donutTotalLabel}>
          tổng
        </text>
      </svg>
      <ul className={styles.donutLegend}>
        {segments.map((seg) => (
          <li key={seg.label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: seg.color }} />
            <span className={styles.legendLabel}>{seg.label}</span>
            <span className={styles.legendValue}>
              {seg.value.toLocaleString("vi-VN")}
            </span>
            <span className={styles.legendPct}>
              {Math.round((seg.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DashboardDonutChart;
