import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useThemeOptional } from "@/hooks/useTheme";
import ChartResponsiveContainer from "./ChartResponsiveContainer";
import { getChartTheme } from "./chartTheme";
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
  const { theme } = useThemeOptional() ?? { theme: "light" };
  const { colors, chartMargin, axisTickStyle, tooltipStyle } = getChartTheme();
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));

  return (
    <ChartResponsiveContainer className={styles.chartWrap} style={{ height }} key={theme}>
      {({ width, height: chartHeight }) => (
        <LineChart
          width={width}
          height={chartHeight}
          data={chartData}
          margin={{ ...chartMargin, left: 4, bottom: 4 }}
        >
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
            stroke={colors.primary}
            strokeWidth={2.5}
            dot={{
              r: 4,
              fill: colors.dotFill,
              stroke: colors.primary,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: colors.primary,
              stroke: colors.dotFill,
              strokeWidth: 2,
            }}
          />
        </LineChart>
      )}
    </ChartResponsiveContainer>
  );
}

export default RechartsLineChart;
