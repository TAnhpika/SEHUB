import * as adminApi from "@/api/adminApi";
import { getDashboardPending, getMergedActivityLog } from "@/features/admin/adminMockData";
import { loadAdminActivityPreview } from "@/features/admin/activity/adminActivityData";
import { getPaymentStats, loadAdminPayments } from "@/features/admin/payments/adminPaymentData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function buildNotificationsFromPending(pending, recent) {
  const pendingItems = pending
    .filter((item) => item.count > 0)
    .map((item) => ({
      id: `pending-${item.id}`,
      kind: "action",
      title: `${item.label} (${item.count})`,
      desc: item.urgent ? "Cần xử lý sớm" : "Việc chờ trong hàng đợi",
      time: "Hôm nay",
      to: item.to,
      urgent: item.urgent,
    }));

  const recentItems = recent.map((row) => ({
    id: `activity-${row.id}`,
    kind: "activity",
    title: row.text,
    desc: null,
    time: row.time,
    to: "/admin/activity",
    urgent: false,
  }));

  return [...pendingItems, ...recentItems];
}

/**
 * Thông báo header Admin — pending từ stats/store + audit gần đây.
 */
export function getAdminHeaderNotifications() {
  const pending = getDashboardPending();
  const recent = getMergedActivityLog()
    .slice(0, 4)
    .map(({ id, time, text }) => ({ id, time, text }));
  return buildNotificationsFromPending(pending, recent);
}

export async function loadAdminHeaderNotifications() {
  if (USE_MOCK) {
    const pending = getDashboardPending();
    const recent = await loadAdminActivityPreview(4);
    return buildNotificationsFromPending(pending, recent);
  }

  const [modStats, pendingExamsPage, submissionsPage, paymentsPage, recent] = await Promise.all([
    adminApi.getModerationStats(),
    adminApi.listExams({ status: "PendingApproval", pageSize: 1 }),
    adminApi.listModerationPracticeSubmissions({ status: "Submitted", pageSize: 1 }),
    loadAdminPayments(),
    loadAdminActivityPreview(4),
  ]);

  const paymentStats = getPaymentStats();
  const pending = [
    {
      id: "p1",
      label: "Duyệt đề Mod",
      count: pendingExamsPage.totalCount ?? 0,
      to: "/admin/exams/pending",
      urgent: (pendingExamsPage.totalCount ?? 0) > 0,
    },
    {
      id: "p2",
      label: "Báo cáo chờ",
      count: modStats.pendingReports ?? 0,
      to: "/admin/moderation",
      urgent: (modStats.pendingReports ?? 0) > 0,
    },
    {
      id: "p3",
      label: "Chờ xác nhận PayOS",
      count: paymentStats.awaitingConfirm,
      to: "/admin/payments",
      urgent: paymentStats.awaitingConfirm > 0,
    },
    {
      id: "p4",
      label: "Bài nộp TH chờ chấm",
      count: submissionsPage.totalCount ?? modStats.pendingPracticeSubmissions ?? 0,
      to: "/admin/exams/submissions",
      urgent: (submissionsPage.totalCount ?? 0) > 0,
    },
  ].filter((item) => item.count > 0 || item.id === "p2");

  void paymentsPage;
  return buildNotificationsFromPending(pending, recent);
}

export function getAdminNotificationCount() {
  return getDashboardPending().reduce((sum, item) => sum + item.count, 0);
}

export async function loadAdminNotificationCount() {
  const notifications = await loadAdminHeaderNotifications();
  return notifications.filter((item) => item.kind === "action").length;
}
