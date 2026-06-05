import {
  ADMIN_CHART_CONTENT,
  ADMIN_CHART_REPORT_STATUS,
  ADMIN_DASHBOARD_PENDING,
  ADMIN_QUICK_LINKS,
  ADMIN_RECENT_ACTIVITY,
} from "@/features/admin/adminMockData";

export const DASHBOARD_PERIOD_OPTIONS = [
  { id: "month", label: "Tháng" },
  { id: "quarter", label: "Quý" },
  { id: "year", label: "Năm" },
];

const API_DELAY_MS = 680;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildMonthPayload() {
  return {
    periodLabel: "Tháng hiện tại · 6/2026",
    stats: [
      {
        id: "users",
        label: "Người dùng",
        value: "2.148",
        change: "+12,4%",
        changeDetail: "so với tháng trước",
        trend: "up",
        urgent: false,
        tier: "primary",
      },
      {
        id: "revenue",
        label: "Doanh thu tháng",
        value: "48,2 tr",
        change: "+18,2%",
        changeDetail: "PayOS · VNĐ",
        trend: "up",
        urgent: false,
        tier: "primary",
      },
      {
        id: "premium",
        label: "Student Premium",
        value: "8,7%",
        change: "+0,6 pp",
        changeDetail: "186 tài khoản · tỉ lệ gói",
        trend: "up",
        urgent: false,
        tier: "primary",
      },
      {
        id: "reports",
        label: "Báo cáo chờ",
        value: "7",
        change: "3 khẩn",
        changeDetail: "cần xử lý gấp",
        trend: "down",
        urgent: true,
        tier: "primary",
      },
      {
        id: "exams",
        label: "Đề thi",
        value: "524",
        change: "+8",
        changeDetail: "đề mới trong tháng",
        trend: "up",
        urgent: false,
        tier: "secondary",
      },
      {
        id: "documents",
        label: "Tài liệu",
        value: "312",
        change: "+6",
        changeDetail: "upload trong tháng",
        trend: "up",
        urgent: false,
        tier: "secondary",
      },
      {
        id: "posts",
        label: "Bài viết",
        value: "2.063",
        change: "+45",
        changeDetail: "bài mới trong kỳ",
        trend: "up",
        urgent: false,
        tier: "secondary",
      },
    ],
    studentPlan: {
      totalStudents: 2148,
      period: "Sinh viên active · không tính Mod/Admin",
      basic: {
        label: "Student Basic",
        sublabel: "Gói Free",
        count: 1962,
        percent: 91.3,
        color: "#64748b",
      },
      premium: {
        label: "Student Premium",
        sublabel: "Gói trả phí",
        count: 186,
        percent: 8.7,
        color: "#2563eb",
      },
      deltaPremiumPct: "+0,6 pp",
      deltaPremiumCount: "+12",
      deltaPeriod: "so với tháng trước",
      targetPremiumPct: 12,
    },
    userGrowth: {
      labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
      data: [
        { label: "T1", value: 186 },
        { label: "T2", value: 204 },
        { label: "T3", value: 198 },
        { label: "T4", value: 241 },
        { label: "T5", value: 268 },
        { label: "T6", value: 312 },
      ],
      summary: { total: 2148, delta: "+12,4%", period: "6 tháng gần nhất" },
      seriesName: "Đăng ký mới",
    },
    revenue: {
      labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
      data: [
        { label: "T1", value: 32.1 },
        { label: "T2", value: 35.8 },
        { label: "T3", value: 38.4 },
        { label: "T4", value: 41.2 },
        { label: "T5", value: 45.6 },
        { label: "T6", value: 48.2 },
      ],
      summary: { total: "48,2 tr", delta: "+18,2%", period: "tháng 6/2026" },
      valueSuffix: " tr",
    },
    premiumRatio: {
      data: [
        { label: "T1", value: 7.2 },
        { label: "T2", value: 7.5 },
        { label: "T3", value: 7.9 },
        { label: "T4", value: 8.1 },
        { label: "T5", value: 8.3 },
        { label: "T6", value: 8.7 },
      ],
      seriesName: "Tỉ lệ Premium (%)",
    },
    content: ADMIN_CHART_CONTENT.map((item) => ({
      name: item.label,
      value: item.value,
      fill: item.color,
    })),
    reportStatus: ADMIN_CHART_REPORT_STATUS,
    traffic: {
      data: [
        { label: "6h", value: 120 },
        { label: "9h", value: 340 },
        { label: "12h", value: 520 },
        { label: "15h", value: 480 },
        { label: "18h", value: 610 },
        { label: "21h", value: 390 },
      ],
      peak: 610,
      seriesName: "Phiên hoạt động",
      period: "Hôm nay theo giờ",
    },
    pending: ADMIN_DASHBOARD_PENDING,
    quickLinks: ADMIN_QUICK_LINKS,
    activity: ADMIN_RECENT_ACTIVITY,
  };
}

function buildQuarterPayload() {
  const month = buildMonthPayload();
  return {
    ...month,
    periodLabel: "Quý hiện tại · Q2/2026",
    stats: month.stats.map((s) => {
      if (s.id === "users") {
        return { ...s, value: "2.412", change: "+15,1%", changeDetail: "so với quý trước" };
      }
      if (s.id === "revenue") {
        return {
          ...s,
          label: "Doanh thu quý",
          value: "132,8 tr",
          change: "+22,4%",
          changeDetail: "tổng PayOS quý",
        };
      }
      if (s.id === "premium") {
        return {
          ...s,
          value: "9,1%",
          change: "+0,9 pp",
          changeDetail: "198 tài khoản · tỉ lệ gói",
        };
      }
      if (s.id === "reports") {
        return { ...s, value: "5", change: "1 khẩn", changeDetail: "còn lại trong quý", urgent: true };
      }
      if (s.id === "posts") {
        return { ...s, value: "2.312", change: "+52", changeDetail: "bài mới trong quý" };
      }
      return {
        ...s,
        changeDetail: s.changeDetail.replace("tháng", "quý").replace("tuần", "quý").replace("kỳ", "quý"),
      };
    }),
    studentPlan: {
      ...month.studentPlan,
      totalStudents: 2412,
      basic: { ...month.studentPlan.basic, count: 2193, percent: 90.9 },
      premium: { ...month.studentPlan.premium, count: 198, percent: 9.1 },
      deltaPremiumPct: "+0,9 pp",
      deltaPremiumCount: "+18",
      deltaPeriod: "so với quý trước",
    },
    userGrowth: {
      labels: ["Q3/25", "Q4/25", "Q1/26", "Q2/26"],
      data: [
        { label: "Q3/25", value: 1680 },
        { label: "Q4/25", value: 1890 },
        { label: "Q1/26", value: 2055 },
        { label: "Q2/26", value: 2412 },
      ],
      summary: { total: 2412, delta: "+15,1%", period: "4 quý gần nhất" },
      seriesName: "Tổng user (cuối quý)",
    },
    revenue: {
      labels: ["Q3/25", "Q4/25", "Q1/26", "Q2/26"],
      data: [
        { label: "Q3/25", value: 98.4 },
        { label: "Q4/25", value: 108.2 },
        { label: "Q1/26", value: 118.6 },
        { label: "Q2/26", value: 132.8 },
      ],
      summary: { total: "132,8 tr", delta: "+22,4%", period: "quý 2/2026" },
      valueSuffix: " tr",
    },
    premiumRatio: {
      data: [
        { label: "Q3/25", value: 7.8 },
        { label: "Q4/25", value: 8.2 },
        { label: "Q1/26", value: 8.6 },
        { label: "Q2/26", value: 9.1 },
      ],
      seriesName: "Tỉ lệ Premium (%)",
    },
    content: ADMIN_CHART_CONTENT.map((item) => ({
      name: item.label,
      value: Math.round(item.value * 1.12),
      fill: item.color,
    })),
    reportStatus: ADMIN_CHART_REPORT_STATUS.map((r) => ({
      ...r,
      value: Math.round(r.value * 1.08),
    })),
    traffic: {
      data: [
        { label: "T2", value: 4200 },
        { label: "T3", value: 4580 },
        { label: "T4", value: 5120 },
        { label: "T5", value: 4890 },
        { label: "T6", value: 5340 },
        { label: "T7", value: 4980 },
      ],
      peak: 5340,
      seriesName: "Phiên / ngày",
      period: "Trung bình theo ngày trong quý",
    },
  };
}

function buildYearPayload() {
  const quarter = buildQuarterPayload();
  return {
    ...quarter,
    periodLabel: "Năm hiện tại · 2026",
    stats: quarter.stats.map((s) => {
      if (s.id === "users") {
        return { ...s, value: "2.648", change: "+18,2%", changeDetail: "so với năm trước" };
      }
      if (s.id === "revenue") {
        return {
          ...s,
          label: "Doanh thu năm",
          value: "458,2 tr",
          change: "+28,6%",
          changeDetail: "tổng PayOS năm",
        };
      }
      if (s.id === "premium") {
        return {
          ...s,
          value: "10,2%",
          change: "+1,4 pp",
          changeDetail: "268 tài khoản · tỉ lệ gói",
        };
      }
      if (s.id === "reports") {
        return { ...s, value: "8", change: "2 khẩn", changeDetail: "còn lại trong năm", urgent: true };
      }
      if (s.id === "posts") {
        return { ...s, value: "2.812", change: "+186", changeDetail: "bài mới trong năm" };
      }
      return {
        ...s,
        changeDetail: s.changeDetail
          .replace("quý", "năm")
          .replace("tháng", "năm")
          .replace("tuần", "năm")
          .replace("kỳ", "năm"),
      };
    }),
    studentPlan: {
      ...quarter.studentPlan,
      totalStudents: 2648,
      basic: { ...quarter.studentPlan.basic, count: 2378, percent: 89.8 },
      premium: { ...quarter.studentPlan.premium, count: 268, percent: 10.2 },
      deltaPremiumPct: "+1,4 pp",
      deltaPremiumCount: "+42",
      deltaPeriod: "so với năm trước",
    },
    userGrowth: {
      labels: ["2023", "2024", "2025", "2026"],
      data: [
        { label: "2023", value: 1420 },
        { label: "2024", value: 1785 },
        { label: "2025", value: 2190 },
        { label: "2026", value: 2648 },
      ],
      summary: { total: 2648, delta: "+18,2%", period: "4 năm gần nhất" },
      seriesName: "Tổng user (cuối năm)",
    },
    revenue: {
      labels: ["2023", "2024", "2025", "2026"],
      data: [
        { label: "2023", value: 285.4 },
        { label: "2024", value: 332.8 },
        { label: "2025", value: 396.2 },
        { label: "2026", value: 458.2 },
      ],
      summary: { total: "458,2 tr", delta: "+28,6%", period: "năm 2026" },
      valueSuffix: " tr",
    },
    premiumRatio: {
      data: [
        { label: "2023", value: 6.8 },
        { label: "2024", value: 7.6 },
        { label: "2025", value: 8.9 },
        { label: "2026", value: 10.2 },
      ],
      seriesName: "Tỉ lệ Premium (%)",
    },
    traffic: {
      ...quarter.traffic,
      period: "Trung bình theo tháng trong năm",
      peak: 6120,
      data: [
        { label: "T1", value: 4820 },
        { label: "T2", value: 5120 },
        { label: "T3", value: 5340 },
        { label: "T4", value: 4980 },
        { label: "T5", value: 5680 },
        { label: "T6", value: 6120 },
      ],
    },
  };
}

/**
 * @param {"month" | "quarter" | "year"} period
 */
export async function fetchDashboardData(period) {
  await delay(API_DELAY_MS);
  if (period === "quarter") return buildQuarterPayload();
  if (period === "year") return buildYearPayload();
  return buildMonthPayload();
}
