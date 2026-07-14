import * as adminApi from "@/api/adminApi";
import { getNotificationUnreadCount, getNotifications } from "@/api/notificationsApi";
import { mapNotificationPage } from "@/api/notificationsMapper";
import { getDashboardPending, getMergedActivityLog } from "@/features/admin/adminMockData";
import { loadAdminActivityPreview } from "@/features/admin/activity/adminActivityData";
import { getPaymentStatsFromList, loadAdminPayments } from "@/features/admin/payments/adminPaymentData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const ADMIN_PENDING_IDS = new Set(["p1", "p3", "p5"]);
const MODERATION_QUEUE_IDS = new Set(["p2", "p4", "p6"]);

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

/** Push workflow Admin: chỉ link trong shell `/admin/*`. */
export function isAdminWorkflowPush(item) {
  if (item.type === "examreview" || item.type === "refund" || item.type === "moderatorwelcome") {
    return item.type !== "moderatorwelcome";
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

  const moderationQueue = pending
    .filter((item) => MODERATION_QUEUE_IDS.has(item.id))
    .map((item) =>
      buildQueueItem(item.id, item.label, item.count, item.to, item.urgent),
    )
    .filter(Boolean);

  return { adminQueue, moderationQueue };
}

function buildAdminNotificationPayload({ adminTasks, moderationQueue, activity, counts }) {
  return {
    adminTasks,
    moderatorQueue: moderationQueue,
    activity,
    counts,
  };
}

function countActionItems(items) {
  return items.filter((item) => item.kind === "action").length;
}

function buildCounts(adminTasks, moderationQueue) {
  const adminPending = countActionItems(adminTasks);
  const moderationPending = countActionItems(moderationQueue);

  return {
    adminPending,
    moderatorPending: moderationPending,
    total: adminPending + moderationPending,
  };
}

async function settleAll(promises) {
  const results = await Promise.allSettled(promises);
  return results.map((result) => (result.status === "fulfilled" ? result.value : null));
}

/**
 * Thông báo header Admin — pending từ stats/store + audit gần đây.
 */
export function getAdminHeaderNotifications() {
  const pending = getDashboardPending();
  const recent = getMergedActivityLog()
    .slice(0, 4)
    .map(({ id, time, text }) => ({ id, time, text }));
  const { adminQueue, moderationQueue } = splitMockPending(pending);
  const activity = mapActivityItems(recent);
  const adminTasks = [...adminQueue];
  const counts = buildCounts(adminTasks, moderationQueue);

  return buildAdminNotificationPayload({
    adminTasks,
    moderationQueue,
    activity,
    counts,
  });
}

export async function loadAdminHeaderNotifications() {
  if (USE_MOCK) {
    const pending = getDashboardPending();
    const recent = await loadAdminActivityPreview(4);
    const { adminQueue, moderationQueue } = splitMockPending(pending);
    const activity = mapActivityItems(recent);
    const adminTasks = [...adminQueue];
    const counts = buildCounts(adminTasks, moderationQueue);

    return buildAdminNotificationPayload({
      adminTasks,
      moderationQueue,
      activity,
      counts,
    });
  }

  const [
    modStats,
    pendingExamsPage,
    submissionsPage,
    paymentsList,
    recent,
    notifPage,
    unread,
  ] = await settleAll([
    adminApi.getModerationStats(),
    adminApi.listExams({ status: "PendingApproval", pageSize: 1 }),
    adminApi.listModerationPracticeSubmissions({ status: "Submitted", pageSize: 1 }),
    loadAdminPayments(),
    loadAdminActivityPreview(4),
    getNotifications({ page: 1, pageSize: 20 }),
    getNotificationUnreadCount(),
  ]);

  const paymentStats = paymentsList ? getPaymentStatsFromList(paymentsList) : { awaitingConfirm: 0, failed: 0 };
  const workflowNotifs = notifPage
    ? mapAdminWorkflowNotifications(mapNotificationPage(notifPage).items)
    : [];

  const adminQueue = [
    buildQueueItem(
      "p1",
      "Duyệt đề Mod",
      pendingExamsPage?.totalCount ?? 0,
      "/admin/exams/pending",
      (pendingExamsPage?.totalCount ?? 0) > 0,
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

  const moderationQueue = [
    buildQueueItem(
      "m-reports",
      "Báo cáo chờ xử lý",
      modStats?.pendingReports ?? 0,
      "/admin/moderation",
      (modStats?.pendingReports ?? 0) > 0,
    ),
    buildQueueItem(
      "m-posts",
      "Bài viết chờ duyệt",
      modStats?.pendingPosts ?? 0,
      "/admin/moderation/content",
      (modStats?.pendingPosts ?? 0) > 0,
    ),
    buildQueueItem(
      "m-practice",
      "Bài nộp TH chờ chấm",
      submissionsPage?.totalCount ?? modStats?.pendingPracticeSubmissions ?? 0,
      "/admin/moderation/practice-submissions",
      (submissionsPage?.totalCount ?? modStats?.pendingPracticeSubmissions ?? 0) > 0,
    ),
  ].filter(Boolean);

  const adminTasks = [...workflowNotifs, ...adminQueue];
  const activity = mapActivityItems(recent ?? []);
  const counts = buildCounts(adminTasks, moderationQueue);
  void unread;

  return buildAdminNotificationPayload({
    adminTasks,
    moderationQueue,
    activity,
    counts,
  });
}

export function getAdminNotificationCount() {
  const payload = getAdminHeaderNotifications();
  return payload.counts.total;
}

export async function loadAdminNotificationCount() {
  const [payload, unread] = await settleAll([
    loadAdminHeaderNotifications(),
    getNotificationUnreadCount(),
  ]);

  return Math.max(unread?.totalUnread ?? 0, payload?.counts.total ?? 0);
}
