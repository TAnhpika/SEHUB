import * as adminApi from "@/api/adminApi";
import { getNotificationUnreadCount, getNotifications } from "@/api/notificationsApi";
import { mapNotificationPage } from "@/api/notificationsMapper";
import { getDashboardPending, getMergedActivityLog } from "@/features/admin/adminMockData";
import { loadAdminActivityPreview } from "@/features/admin/activity/adminActivityData";
import { getPaymentStatsFromList, loadAdminPayments } from "@/features/admin/payments/adminPaymentData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const ADMIN_PENDING_IDS = new Set(["p1", "p3", "p5"]);
const MODERATOR_PENDING_IDS = new Set(["p2", "p4", "p6"]);

function buildQueueItem(id, label, count, to, urgent = count > 0) {
  if (count <= 0) {
    return null;
  }

  return {
    id: `pending-${id}`,
    kind: "action",
    title: `${label} (${count})`,
    desc: urgent ? "Cần xử lý sớm" : "Việc chờ trong hàng đợi",
    time: "Hôm nay",
    to,
    urgent,
  };
}

function mapActivityItems(recent) {
  return recent.map((row) => ({
    id: `activity-${row.id}`,
    kind: "activity",
    title: row.text,
    desc: null,
    time: row.time,
    to: "/admin/activity",
    urgent: false,
  }));
}

/** Push workflow chỉ dành cho Admin — loại moderation của Moderator và legacy DB. */
export function isAdminWorkflowPush(item) {
  if (item.type === "examreview" || item.type === "refund") {
    return true;
  }

  if (item.type === "moderation") {
    const link = item.linkUrl || "";
    return link.startsWith("/admin/");
  }

  return false;
}

function mapAdminWorkflowNotifications(items) {
  return items.filter(isAdminWorkflowPush).map((item) => ({
    id: `notif-${item.id}`,
    kind: "action",
    title: item.title,
    desc: item.body || null,
    time: item.time,
    to: item.linkUrl || "/admin",
    urgent: !item.read,
  }));
}

function splitMockPending(pending) {
  const adminQueue = pending
    .filter((item) => ADMIN_PENDING_IDS.has(item.id))
    .map((item) =>
      buildQueueItem(item.id, item.label, item.count, item.to, item.urgent),
    )
    .filter(Boolean);

  const moderatorQueue = pending
    .filter((item) => MODERATOR_PENDING_IDS.has(item.id))
    .map((item) =>
      buildQueueItem(item.id, item.label, item.count, item.to, item.urgent),
    )
    .filter(Boolean);

  return { adminQueue, moderatorQueue };
}

function buildAdminNotificationPayload({ adminTasks, moderatorQueue, activity, counts }) {
  return {
    adminTasks,
    moderatorQueue,
    activity,
    counts,
  };
}

function countActionItems(items) {
  return items.filter((item) => item.kind === "action").length;
}

function buildCounts(adminTasks, moderatorQueue) {
  const adminPending = countActionItems(adminTasks);
  const moderatorPending = countActionItems(moderatorQueue);

  return {
    adminPending,
    moderatorPending,
    total: adminPending + moderatorPending,
  };
}

/**
 * Thông báo header Admin — pending từ stats/store + audit gần đây.
 */
export function getAdminHeaderNotifications() {
  const pending = getDashboardPending();
  const recent = getMergedActivityLog()
    .slice(0, 4)
    .map(({ id, time, text }) => ({ id, time, text }));
  const { adminQueue, moderatorQueue } = splitMockPending(pending);
  const activity = mapActivityItems(recent);
  const adminTasks = [...adminQueue];
  const counts = buildCounts(adminTasks, moderatorQueue);

  return buildAdminNotificationPayload({
    adminTasks,
    moderatorQueue,
    activity,
    counts,
  });
}

export async function loadAdminHeaderNotifications() {
  if (USE_MOCK) {
    const pending = getDashboardPending();
    const recent = await loadAdminActivityPreview(4);
    const { adminQueue, moderatorQueue } = splitMockPending(pending);
    const activity = mapActivityItems(recent);
    const adminTasks = [...adminQueue];
    const counts = buildCounts(adminTasks, moderatorQueue);

    return buildAdminNotificationPayload({
      adminTasks,
      moderatorQueue,
      activity,
      counts,
    });
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
  const workflowNotifs = mapAdminWorkflowNotifications(mapNotificationPage(notifPage).items);

  const adminQueue = [
    buildQueueItem(
      "p1",
      "Duyệt đề Mod",
      pendingExamsPage.totalCount ?? 0,
      "/admin/exams/pending",
      (pendingExamsPage.totalCount ?? 0) > 0,
    ),
    buildQueueItem(
      "p3",
      "Chờ xác nhận PayOS",
      paymentStats.awaitingConfirm,
      "/admin/payments",
      paymentStats.awaitingConfirm > 0,
    ),
    buildQueueItem(
      "p5",
      "Thanh toán lỗi",
      paymentStats.failed,
      "/admin/payments",
      false,
    ),
  ].filter(Boolean);

  const moderatorQueue = [
    buildQueueItem(
      "m-reports",
      "Báo cáo chờ xử lý",
      modStats.pendingReports ?? 0,
      "/admin/moderation",
      (modStats.pendingReports ?? 0) > 0,
    ),
    buildQueueItem(
      "m-posts",
      "Bài viết chờ duyệt",
      modStats.pendingPosts ?? 0,
      "/admin/moderation/content",
      (modStats.pendingPosts ?? 0) > 0,
    ),
    buildQueueItem(
      "m-practice",
      "Bài nộp TH chờ chấm",
      submissionsPage.totalCount ?? modStats.pendingPracticeSubmissions ?? 0,
      "/admin/moderation/practice-submissions",
      (submissionsPage.totalCount ?? modStats.pendingPracticeSubmissions ?? 0) > 0,
    ),
  ].filter(Boolean);

  const adminTasks = [...workflowNotifs, ...adminQueue];
  const activity = mapActivityItems(recent);
  const counts = buildCounts(adminTasks, moderatorQueue);
  void unread;

  return buildAdminNotificationPayload({
    adminTasks,
    moderatorQueue,
    activity,
    counts,
  });
}

export function getAdminNotificationCount() {
  const payload = getAdminHeaderNotifications();
  return payload.counts.total;
}

export async function loadAdminNotificationCount() {
  const [payload, unread] = await Promise.all([
    loadAdminHeaderNotifications(),
    getNotificationUnreadCount(),
  ]);

  return Math.max(unread?.totalUnread ?? 0, payload.counts.total);
}
