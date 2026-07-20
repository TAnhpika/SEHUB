import {
  faBell,
  faCommentDots,
  faFileLines,
  faFire,
  faUserPlus,
  faUserGroup,
  faRotateLeft,
  faClipboardCheck,
  faAt,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { NOTIFICATION_META } from "@/common/Header/MainHeader/notificationData";

export { NOTIFICATION_META };

export const DROPDOWN_PREVIEW_SIZE = 8;
export const MODAL_PAGE_SIZE = 30;

const TYPE_ICONS = {
  comment: faCommentDots,
  exam: faFileLines,
  streak: faFire,
  follow: faUserPlus,
  friendrequest: faUserGroup,
  friendaccepted: faUserGroup,
  like: faCommentDots,
  token: faBell,
  badge: faBell,
  refund: faRotateLeft,
  moderation: faClipboardCheck,
  examreview: faFileLines,
  mention: faAt,
  practiceresult: faClipboardList,
};

export function isVisibleNotification(item) {
  return item.type !== "message";
}

/** Notifications that may include point awards — refresh auth gamification after them. */
export function isGamificationNotification(item) {
  if (!item) return false;
  const type = String(item.type ?? "").toLowerCase();
  if (type === "streak" || type === "badge" || type === "exam" || type === "examreview") {
    return true;
  }
  if (type === "moderation") {
    const haystack = `${item.title ?? ""} ${item.body ?? ""} ${item.linkUrl ?? ""}`.toLowerCase();
    return (
      haystack.includes("điểm") ||
      haystack.includes("/home/feedback") ||
      haystack.includes("đã được xử lý")
    );
  }
  return false;
}

export function getNotificationIcon(type) {
  return TYPE_ICONS[type] ?? faBell;
}
