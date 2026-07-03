import * as adminApi from "@/api/adminApi";
import { getNotificationUnreadCount, getNotifications } from "@/api/notificationsApi";
import { mapNotificationPage } from "@/api/notificationsMapper";
import { getDashboardPending, getMergedActivityLog } from "@/features/admin/adminMockData";
import { loadAdminActivityPreview } from "@/features/admin/activity/adminActivityData";
import { getPaymentStatsFromList, loadAdminPayments } from "@/features/admin/payments/adminPaymentData";

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

function mapWorkflowNotifications(items) {
  return items
    .filter((item) => item.type === "moderation" || item.type === "examreview")
    .map((item) => ({
      id: `notif-${item.id}`,
      kind: "action",
      title: item.title,
      desc: item.body || null,
      time: item.time,
      to: item.linkUrl || "/admin",
      urgent: !item.read,
    }));
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

  const [modStats, pendingExamsPage, submissionsPage, paymentsList, recent, notifPage, unread] =
    await Promise.all([
    adminApi.getModerationStats(),
    adminApi.listExams({ status: "PendingApproval", pageSize: 1 }),
    adminApi.listModerationPracticeSubmissions({ status: "Submitted", pageSize: 1 }),
    loadAdminPayments(),
    loadAdminActivityPreview(4),
    getNotifications({ page: 1, pageSize: 20 }),
    getNotificationUnreadCount(),
  ]);

  const paymentStats = getPaymentStatsFromList(paymentsList);
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

  const workflowNotifs = mapWorkflowNotifications(mapNotificationPage(notifPage).items);
  const queueNotifs = buildNotificationsFromPending(pending, recent);
  const merged = [...workflowNotifs, ...queueNotifs];
  void unread;
  return merged;
}

export function getAdminNotificationCount() {
  return getDashboardPending().reduce((sum, item) => sum + item.count, 0);
}

export async function loadAdminNotificationCount() {
  const [notifications, unread] = await Promise.all([
    loadAdminHeaderNotifications(),
    getNotificationUnreadCount(),
  ]);
  const actionCount = notifications.filter((item) => item.kind === "action").length;
  return Math.max(unread?.totalUnread ?? 0, actionCount);
}
