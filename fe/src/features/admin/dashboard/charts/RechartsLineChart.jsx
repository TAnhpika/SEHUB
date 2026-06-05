import {
  CartesianGrid,
  Line,
  LineChart,
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
 *   yDomain?: [number, number];
 * }} props
 */
function RechartsLineChart({
  data,
  seriesName = "Giá trị",
  valueSuffix = "",
  height = 240,
  yDomain,
}) {
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));

  return (
    <div className={styles.chartWrap} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ ...chartMargin, left: 4, bottom: 4 }}>
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
            width={44}
            domain={yDomain ?? ["auto", "auto"]}
            tickFormatter={(v) => `${v}${valueSuffix}`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`${value}${valueSuffix}`, seriesName]}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART_COLORS.primary}
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#fff", stroke: CHART_COLORS.primary, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: CHART_COLORS.primary, stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RechartsLineChart;
