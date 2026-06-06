import {
  faClipboardCheck,
  faClipboardList,
  faFileCirclePlus,
  faFlag,
  faStar,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { CONTENT_QUEUE_MOCK } from "@/features/moderator/content/contentModerationData";
import { REPORTS_MOCK } from "@/features/moderator/reports/reportsData";

/** Sau đăng nhập (mock) — hàng đợi báo cáo ưu tiên nghiệp vụ */
export const MODERATOR_HOME_PATH = "/moderator/reports";

export const MODERATOR_NAV_GROUPS = [
  {
    id: "community",
    label: "Cộng đồng",
    items: [
      {
        id: "reports",
        label: "Xử lý báo cáo",
        to: "/moderator/reports",
        icon: faFlag,
        badgeKey: "reports",
        matchPaths: ["/moderator/reports"],
      },
      {
        id: "content",
        label: "Duyệt nội dung",
        to: "/moderator/content",
        icon: faClipboardCheck,
        badgeKey: "content",
        matchPaths: ["/moderator/content"],
      },
      {
        id: "featured",
        label: "Bài viết nổi bật",
        to: "/moderator/featured",
        icon: faStar,
        matchPaths: ["/moderator/featured"],
      },
    ],
  },
  {
    id: "accounts",
    label: "Tài khoản",
    items: [
      {
        id: "violations",
        label: "Tài khoản vi phạm",
        to: "/moderator/violations",
        icon: faUserSlash,
        matchPaths: ["/moderator/violations"],
      },
    ],
  },
  {
    id: "exams",
    label: "Đề thi",
    items: [
      {
        id: "final-exam",
        label: "Thêm đề cuối kỳ",
        to: "/moderator/final-exams/add",
        icon: faFileCirclePlus,
        matchPaths: ["/moderator/final-exams/add"],
      },
      {
        id: "practice-exam",
        label: "Thêm đề thực hành",
        to: "/moderator/practice-exams/add",
        icon: faClipboardList,
        matchPaths: ["/moderator/practice-exams/add"],
      },
    ],
  },
];

export const MODERATOR_NAV_ITEMS = MODERATOR_NAV_GROUPS.flatMap((group) => group.items);

export function isModeratorNavActive(item, pathname) {
  const paths = item.matchPaths ?? [item.to];
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function getModeratorNavBadgeCounts() {
  return {
    reports: REPORTS_MOCK.filter((report) => report.status === "pending").length,
    content: CONTENT_QUEUE_MOCK.length,
  };
}
