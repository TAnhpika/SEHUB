import {
  faClipboardCheck,
  faClipboardList,
  faClockRotateLeft,
  faFlag,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { getNotifications, getNotificationUnreadCount } from "@/api/notificationsApi";
import { mapNotificationPage } from "@/api/notificationsMapper";
import { getPendingPracticeSubmissionCount } from "@/features/exams/practiceExamSubmissions";
import { getModeratorNavBadgeCounts } from "@/features/moderator/moderatorNavData";

/** Lối tắt nghiệp vụ kiểm duyệt — Moderator không cấu hình hệ thống (§2.4) */
export const MODERATOR_QUICK_LINKS = [
  {
    id: "reports",
    label: "Xử lý báo cáo",
    description: "Chấp thuận xóa / từ chối giữ nguyên",
    to: "/moderator/reports",
    icon: faFlag,
  },
  {
    id: "content",
    label: "Duyệt bài viết",
    description: "Pre-moderation trước khi đăng",
    to: "/moderator/content",
    icon: faClipboardCheck,
  },
  {
    id: "violations",
    label: "Tài khoản vi phạm",
    description: "Cảnh báo / khóa tạm 1 · 7 · 30 ngày",
    to: "/moderator/violations",
    icon: faUserSlash,
  },
  {
    id: "practice-submissions",
    label: "Bài nộp thực hành",
    description: "Chấm Đã xem / Đạt / Không đạt",
    to: "/moderator/practice-submissions",
    icon: faClipboardList,
  },
  {
    id: "content-history",
    label: "Lịch sử duyệt bài",
    description: "Xem lại quyết định kiểm duyệt",
    to: "/moderator/content/history",
    icon: faClockRotateLeft,
  },
];

/** Thông báo hàng đợi kiểm duyệt — báo cáo, duyệt bài, nộp TH */
export function buildModeratorNotifications() {
  const badges = getModeratorNavBadgeCounts();
  const practicePending = getPendingPracticeSubmissionCount();
  const items = [];

  if (badges.reports > 0) {
    items.push({
      id: "reports",
      title: `${badges.reports} báo cáo chờ xử lý`,
      detail: "Bài viết, bình luận và câu hỏi đề",
      time: "Cần xử lý",
      to: "/moderator/reports",
    });
  }

  if (badges.content > 0) {
    items.push({
      id: "content",
      title: `${badges.content} bài viết chờ duyệt`,
      detail: "Pre-moderation trước khi hiển thị công khai",
      time: "Duyệt nội dung",
      to: "/moderator/content",
    });
  }

  if (practicePending > 0) {
    items.push({
      id: "practice",
      title: `${practicePending} bài nộp thực hành chờ chấm`,
      detail: "Sinh viên Premium nộp GitHub / file",
      time: "Đề thi",
      to: "/moderator/practice-submissions",
    });
  }

  return items;
}

function mapModeratorWorkflowNotifications(items) {
  return items
    .filter((item) => item.type === "moderation" || item.type === "examreview")
    .map((item) => ({
      id: `notif-${item.id}`,
      title: item.title,
      detail: item.body || "Cần xử lý",
      time: item.time,
      to: item.linkUrl || "/moderator/reports",
    }));
}

export async function loadModeratorNotifications() {
  try {
    const page = await getNotifications({ page: 1, pageSize: 20 });
    const workflow = mapModeratorWorkflowNotifications(mapNotificationPage(page).items);
    if (workflow.length > 0) {
      return workflow;
    }
  } catch {
    // fall back to queue badges below
  }

  return buildModeratorNotifications();
}

export function getModeratorUnreadCount() {
  return buildModeratorNotifications().length;
}

export async function loadModeratorUnreadCount() {
  try {
    const unread = await getNotificationUnreadCount();
    if (typeof unread?.totalUnread === "number" && unread.totalUnread > 0) {
      return unread.totalUnread;
    }
  } catch {
    // ignore
  }

  return getModeratorUnreadCount();
}
