export const CHART_COLORS = {
  primary: "#2563eb",
  primaryLight: "#60a5fa",
  grid: "#f1f5f9",
  axis: "#94a3b8",
  tooltipBg: "#1e293b",
};

export const chartMargin = { top: 8, right: 12, left: 0, bottom: 0 };

export const axisTickStyle = {
  fontSize: 11,
  fill: CHART_COLORS.axis,
  fontWeight: 500,
};

export const tooltipStyle = {
  contentStyle: {
    background: CHART_COLORS.tooltipBg,
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 12,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.2)",
  },
  labelStyle: { color: "#94a3b8", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "#f8fafc", fontWeight: 600 },
};
