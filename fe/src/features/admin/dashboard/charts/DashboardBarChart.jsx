import styles from "./charts.module.css";

/**
 * @param {{ labels: string[]; values: number[]; unit?: string; formatValue?: (n: number) => string }} props
 */
function DashboardBarChart({ labels, values, unit = "", formatValue }) {
  const max = Math.max(...values, 1);
  const fmt =
    formatValue ??
    ((n) => (unit ? `${n.toFixed(1)} ${unit}` : String(Math.round(n))));

  return (
    <div className={styles.barChart}>
      <div className={styles.barChartPlot} role="img" aria-label="Biểu đồ cột">
        {values.map((value, i) => {
          const pct = (value / max) * 100;
          return (
            <div key={labels[i]} className={styles.barCol}>
              <span className={styles.barValue}>{fmt(value)}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ height: `${pct}%` }}
                  title={`${labels[i]}: ${fmt(value)}`}
                />
              </div>
              <span className={styles.barLabel}>{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardBarChart;
