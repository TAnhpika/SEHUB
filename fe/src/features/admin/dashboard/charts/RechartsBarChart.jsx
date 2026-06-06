import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  axisTickStyle,
  CHART_COLORS,
  chartMargin,
  tooltipStyle,
} from "./chartTheme";
import styles from "./recharts.module.css";

/**
 * @param {{
 *   data: { label: string; value: number }[];
 *   seriesName?: string;
 *   valueSuffix?: string;
 *   height?: number;
 * }} props
 */
function RechartsBarChart({
  data,
  seriesName = "Giá trị",
  valueSuffix = "",
  height = 240,
}) {
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));

  return (
    <div className={styles.chartWrap} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ ...chartMargin, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => `${v}${valueSuffix}`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`${value}${valueSuffix}`, seriesName]}
            cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
          />
          <Bar
            dataKey="value"
            fill={CHART_COLORS.primary}
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RechartsBarChart;
