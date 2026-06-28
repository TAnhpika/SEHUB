import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useThemeOptional } from "@/hooks/useTheme";
import { getChartTheme } from "./chartTheme";
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
  const { theme } = useThemeOptional() ?? { theme: "light" };
  const { colors, chartMargin, axisTickStyle, tooltipStyle } = getChartTheme();
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));

  return (
    <div className={styles.chartWrap} style={{ height }} key={theme}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ ...chartMargin, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={colors.grid} vertical={false} />
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
            fill={colors.primary}
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RechartsBarChart;
