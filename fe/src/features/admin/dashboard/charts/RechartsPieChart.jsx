import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useThemeOptional } from "@/hooks/useTheme";
import { getChartTheme } from "./chartTheme";
import styles from "./recharts.module.css";

function formatCenterTotal(total) {
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1).replace(".", ",")}k`;
  }
  return total.toLocaleString("vi-VN");
}

/**
 * @param {{
 *   data: { name: string; value: number; fill: string }[];
 *   height?: number;
 *   centerLabel?: string;
 * }} props
 */
function RechartsPieChart({ data, height = 220, centerLabel = "Tổng" }) {
  const { theme } = useThemeOptional() ?? { theme: "light" };
  const { colors, tooltipStyle } = getChartTheme();
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className={styles.pieWrap} key={theme}>
      <div className={styles.pieChartBox} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke={colors.dotFill}
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name) => [
                `${Number(value).toLocaleString("vi-VN")} (${total ? Math.round((Number(value) / total) * 100) : 0}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.pieCenter} aria-hidden>
          <span className={styles.pieCenterValue}>{formatCenterTotal(total)}</span>
          <span className={styles.pieCenterLabel}>{centerLabel}</span>
        </div>
      </div>
      <ul className={styles.pieLegend}>
        {data.map((item) => (
          <li key={item.name} className={styles.pieLegendItem}>
            <span className={styles.pieLegendDot} style={{ background: item.fill }} />
            <span className={styles.pieLegendLabel}>{item.name}</span>
            <span className={styles.pieLegendValue}>
              {item.value.toLocaleString("vi-VN")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RechartsPieChart;
