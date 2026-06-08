import {
  ADMIN_QUICK_LINKS,
  getDashboardPending,
  getMergedActivityLog,
} from "@/features/admin/adminMockData";
import { getAdminDocuments } from "@/features/admin/documents/adminDocumentData";
import { getAdminExams } from "@/features/admin/exams/adminExamData";
import { getAdminReports } from "@/features/admin/moderation/adminReportData";
import { getAdminPayments, getPaymentStats } from "@/features/admin/payments/adminPaymentData";
import { getAdminUsers } from "@/features/admin/users/adminUserStore";

const CHART_MONTH_KEYS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];

const SAMPLE_TRAFFIC = {
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
  dataSource: "sample",
};

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

function buildLiveKpis() {
  const users = getAdminUsers();
  const students = users.filter((u) => u.role === "student" && u.status === "active");
  const premiumStudents = students.filter((u) => u.plan === "Premium");
  const premiumPct = students.length
    ? Math.round((premiumStudents.length / students.length) * 1000) / 10
    : 0;
  const pendingReports = getAdminReports().filter((r) => r.status === "pending");
  const urgentReports = pendingReports.filter((r) => r.urgent).length;
  const paymentStats = getPaymentStats();
  const revenueM = Math.round(paymentStats.monthRevenue / 1_000_000 * 10) / 10;

  return {
    usersTotal: users.length,
    studentsActive: students.length,
    studentsFree: students.length - premiumStudents.length,
    premiumCount: premiumStudents.length,
    premiumPct,
    pendingReports: pendingReports.length,
    urgentReports,
    revenueLabel: revenueM > 0 ? `${revenueM.toLocaleString("vi-VN")} tr` : "0 tr",
    paymentStats,
  };
}

/** Biểu đồ — ưu tiên store; ghi rõ nguồn dữ liệu mẫu */
function buildLiveCharts(live) {
  const users = getAdminUsers();
  const payments = getAdminPayments();
  const reports = getAdminReports();
  const exams = getAdminExams();
  const documents = getAdminDocuments();

  const regByMonth = {};
  for (const user of users) {
    if (!user.joinedAt) continue;
    const key = user.joinedAt.slice(0, 7);
    regByMonth[key] = (regByMonth[key] ?? 0) + 1;
  }

  const userGrowthData = CHART_MONTH_KEYS.map((monthKey, index) => ({
    label: `T${index + 1}`,
    value: regByMonth[monthKey] ?? 0,
  }));
  const newRegistrations = userGrowthData.reduce((sum, row) => sum + row.value, 0);

  const revenueByMonth = {};
  for (const payment of payments) {
    if (payment.status !== "activated") continue;
    const key = payment.createdAt.slice(0, 7);
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + payment.amount;
  }

  const revenueData = CHART_MONTH_KEYS.map((monthKey, index) => ({
    label: `T${index + 1}`,
    value: Math.round((revenueByMonth[monthKey] ?? 0) / 1_000_000 * 10) / 10,
  }));

  const premiumRatioData = CHART_MONTH_KEYS.map((_, index) => {
    if (index === CHART_MONTH_KEYS.length - 1) {
      return { label: `T${index + 1}`, value: live.premiumPct };
    }
    const factor = 0.82 + index * 0.03;
    return {
      label: `T${index + 1}`,
      value: Math.round(live.premiumPct * factor * 10) / 10,
    };
  });

  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const resolvedReports = reports.filter((r) => r.status === "resolved").length;

  const content = [
    { name: "Đề thi", value: exams.length, fill: "#2563eb" },
    { name: "Tài liệu", value: documents.length, fill: "#7c3aed" },
    { name: "Báo cáo chờ", value: pendingReports, fill: "#f59e0b" },
    { name: "Báo cáo đã xử lý", value: resolvedReports, fill: "#22c55e" },
  ].filter((item) => item.value > 0);

  const reportStatus = [
    { label: "Chờ xử lý", value: pendingReports, color: "#ef4444" },
    { label: "Đã xử lý", value: resolvedReports, color: "#22c55e" },
  ].filter((item) => item.value > 0);

  return {
    userGrowth: {
      data: userGrowthData,
      seriesName: "Đăng ký mới",
      summary: {
        total: live.usersTotal,
        delta: `${newRegistrations} đăng ký`,
        period: "6 tháng gần nhất",
      },
      dataSource: "live",
    },
    revenue: {
      data: revenueData,
      summary: {
        total: live.revenueLabel,
        delta: `${live.paymentStats.activated} đơn kích hoạt`,
        period: "tháng 6/2026",
      },
      valueSuffix: " tr",
      dataSource: "live",
    },
    premiumRatio: {
      data: premiumRatioData,
      seriesName: "Tỉ lệ Premium (%)",
      dataSource: "sample",
      sampleNote: "Xu hướng ước lượng — điểm cuối lấy từ store",
    },
    content,
    contentDataSource: "live",
    reportStatus,
    reportStatusDataSource: "live",
    traffic: SAMPLE_TRAFFIC,
  };
}

function buildMonthPayload() {
  const live = buildLiveKpis();
  const charts = buildLiveCharts(live);
  const examCount = getAdminExams().length;
  const documentCount = getAdminDocuments().length;

  return {
    periodLabel: "Tháng hiện tại · 6/2026",
    stats: [
      {
        id: "users",
        label: "Người dùng",
        value: live.usersTotal.toLocaleString("vi-VN"),
        change: `${live.studentsActive} SV active`,
        changeDetail: "tổng tài khoản trong hệ thống",
        trend: "up",
        urgent: false,
        tier: "primary",
      },
      {
        id: "revenue",
        label: "Doanh thu tháng",
        value: live.revenueLabel,
        change: `${live.paymentStats.activated} đơn`,
        changeDetail: "PayOS đã kích hoạt · tháng 6/2026",
        trend: "up",
        urgent: false,
        tier: "primary",
      },
      {
        id: "premium",
        label: "Student Premium",
        value: `${live.premiumPct}%`,
        change: `${live.premiumCount} tài khoản`,
        changeDetail: "tỉ lệ trên SV active",
        trend: "up",
        urgent: false,
        tier: "primary",
      },
      {
        id: "reports",
        label: "Báo cáo chờ",
        value: String(live.pendingReports),
        change: live.urgentReports > 0 ? `${live.urgentReports} khẩn` : "ổn định",
        changeDetail: live.pendingReports > 0 ? "cần xử lý gấp" : "không có báo cáo chờ",
        trend: live.pendingReports > 0 ? "down" : "up",
        urgent: live.pendingReports > 0,
        tier: "primary",
      },
      {
        id: "exams",
        label: "Đề thi",
        value: String(examCount),
        change: `${examCount} đề`,
        changeDetail: "trong catalog Admin",
        trend: "up",
        urgent: false,
        tier: "secondary",
      },
      {
        id: "documents",
        label: "Tài liệu",
        value: String(documentCount),
        change: `${documentCount} file`,
        changeDetail: "đã upload theo môn",
        trend: "up",
        urgent: false,
        tier: "secondary",
      },
      {
        id: "posts",
        label: "Bài viết",
        value: "—",
        change: "GĐ2",
        changeDetail: "chưa có store bài viết Admin",
        trend: "up",
        urgent: false,
        tier: "secondary",
      },
    ],
    studentPlan: {
      totalStudents: live.studentsActive,
      period: "Sinh viên active · không tính Mod/Admin",
      basic: {
        label: "Student Basic",
        sublabel: "Gói Free",
        count: live.studentsFree,
        percent: live.studentsActive
          ? Math.round((live.studentsFree / live.studentsActive) * 1000) / 10
          : 0,
        color: "#64748b",
      },
      premium: {
        label: "Student Premium",
        sublabel: "Gói trả phí",
        count: live.premiumCount,
        percent: live.premiumPct,
        color: "#2563eb",
      },
      deltaPremiumPct: "—",
      deltaPremiumCount: "—",
      deltaPeriod: "so với snapshot seed",
      targetPremiumPct: 12,
    },
    userGrowth: charts.userGrowth,
    revenue: charts.revenue,
    premiumRatio: charts.premiumRatio,
    content: charts.content,
    contentDataSource: charts.contentDataSource,
    reportStatus: charts.reportStatus,
    reportStatusDataSource: charts.reportStatusDataSource,
    traffic: charts.traffic,
    pending: getDashboardPending(),
    quickLinks: ADMIN_QUICK_LINKS,
    activity: getMergedActivityLog().slice(0, 4).map(({ id, time, text, type }) => ({
      id,
      time,
      text,
      type,
    })),
  };
}

function buildQuarterPayload() {
  const month = buildMonthPayload();
  return {
    ...month,
    periodLabel: "Quý hiện tại · Q2/2026",
    stats: month.stats.map((s) => {
      if (s.id === "revenue") {
        return { ...s, label: "Doanh thu quý", changeDetail: "tổng PayOS · snapshot store" };
      }
      return {
        ...s,
        changeDetail: s.changeDetail
          .replace("tháng", "quý")
          .replace("tuần", "quý")
          .replace("kỳ", "quý"),
      };
    }),
    studentPlan: {
      ...month.studentPlan,
      deltaPeriod: "snapshot store · chưa có lịch sử quý",
    },
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
      dataSource: "sample",
    },
  };
}

function buildYearPayload() {
  const quarter = buildQuarterPayload();
  return {
    ...quarter,
    periodLabel: "Năm hiện tại · 2026",
    stats: quarter.stats.map((s) => {
      if (s.id === "revenue") {
        return { ...s, label: "Doanh thu năm", changeDetail: "tổng PayOS · snapshot store" };
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
      deltaPeriod: "snapshot store · chưa có lịch sử năm",
    },
    traffic: {
      ...quarter.traffic,
      period: "Trung bình theo tháng trong năm (mẫu)",
      peak: 6120,
      data: [
        { label: "T1", value: 4820 },
        { label: "T2", value: 5120 },
        { label: "T3", value: 5340 },
        { label: "T4", value: 4980 },
        { label: "T5", value: 5680 },
        { label: "T6", value: 6120 },
      ],
      dataSource: "sample",
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
