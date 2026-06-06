import styles from "./charts.module.css";

/**
 * @param {{ labels: string[]; values: number[]; height?: number }} props
 */
function DashboardLineChart({ labels, values, height = 200 }) {
  const width = 400;
  const padX = 36;
  const padY = 24;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padX + (i / Math.max(values.length - 1, 1)) * chartW;
    const y = padY + chartH - ((v - min) / range) * chartH;
    return { x, y, v };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return (
    <div className={styles.chartRoot}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.chartSvg}
        role="img"
        aria-label="Biểu đồ đường"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padY + chartH * (1 - t);
          return (
            <line
              key={t}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              className={styles.gridLine}
            />
          );
        })}
        <path d={areaPath} className={styles.areaFill} />
        <path d={linePath} className={styles.lineStroke} fill="none" />
        {points.map((p, i) => (
          <g key={labels[i]}>
            <circle cx={p.x} cy={p.y} r="5" className={styles.lineDot} />
            <title>
              {labels[i]}: {values[i]}
            </title>
          </g>
        ))}
      </svg>
      <div className={styles.axisLabels} style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
        {labels.map((label) => (
          <span key={label} className={styles.axisLabel}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default DashboardLineChart;
