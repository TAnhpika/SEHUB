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

export function getNotificationIcon(type) {
  return TYPE_ICONS[type] ?? faBell;
}
