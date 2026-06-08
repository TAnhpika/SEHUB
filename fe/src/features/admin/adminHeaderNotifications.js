import { getDashboardPending, getMergedActivityLog } from "@/features/admin/adminMockData";

/**
 * Thông báo header Admin — đọc từ store (pending + audit gần đây).
 */
export function getAdminHeaderNotifications() {
  const pending = getDashboardPending()
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

  const recent = getMergedActivityLog()
    .slice(0, 4)
    .map((row) => ({
      id: `activity-${row.id}`,
      kind: "activity",
      title: row.text,
      desc: null,
      time: row.time,
      to: "/admin/activity",
      urgent: false,
    }));

  return [...pending, ...recent];
}

export function getAdminNotificationCount() {
  return getDashboardPending().reduce((sum, item) => sum + item.count, 0);
}
