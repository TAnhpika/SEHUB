const LIGHT_CHART_COLORS = {
  primary: "#2563eb",
  primaryLight: "#60a5fa",
  grid: "#f1f5f9",
  axis: "#94a3b8",
  tooltipBg: "#1e293b",
  tooltipLabel: "#94a3b8",
  tooltipItem: "#f8fafc",
  dotFill: "#ffffff",
};

const DARK_CHART_COLORS = {
  primary: "#60a5fa",
  primaryLight: "#93c5fd",
  grid: "#334155",
  axis: "#94a3b8",
  tooltipBg: "#1e293b",
  tooltipLabel: "#94a3b8",
  tooltipItem: "#f8fafc",
  dotFill: "#1e293b",
};

/** @deprecated Use getChartTheme() for theme-aware colors */
export const CHART_COLORS = LIGHT_CHART_COLORS;

export const chartMargin = { top: 8, right: 12, left: 0, bottom: 0 };

function isDarkTheme() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "dark"
  );
}

export function getChartTheme() {
  const colors = isDarkTheme() ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;

  return {
    colors,
    chartMargin,
    axisTickStyle: {
      fontSize: 11,
      fill: colors.axis,
      fontWeight: 500,
    },
    tooltipStyle: {
      contentStyle: {
        background: colors.tooltipBg,
        border: "none",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 12,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.2)",
      },
      labelStyle: {
        color: colors.tooltipLabel,
        fontWeight: 600,
        marginBottom: 4,
      },
      itemStyle: { color: colors.tooltipItem, fontWeight: 600 },
    },
  };
}

export const axisTickStyle = {
  fontSize: 11,
  fill: LIGHT_CHART_COLORS.axis,
  fontWeight: 500,
};

export const tooltipStyle = {
  contentStyle: {
    background: LIGHT_CHART_COLORS.tooltipBg,
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 12,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.2)",
  },
  labelStyle: {
    color: LIGHT_CHART_COLORS.tooltipLabel,
    fontWeight: 600,
    marginBottom: 4,
  },
  itemStyle: { color: LIGHT_CHART_COLORS.tooltipItem, fontWeight: 600 },
};
