import {
  faClipboardCheck,
  faClipboardList,
  faClockRotateLeft,
  faFileCirclePlus,
  faFlag,
  faStar,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { getPendingContentCount } from "@/features/moderator/content/contentModerationStore";
import { REPORTS_MOCK } from "@/features/moderator/reports/reportsData";

/** Sau đăng nhập — hàng đợi báo cáo ưu tiên nghiệp vụ */
export const MODERATOR_HOME_PATH = "/moderator/reports";

export const MODERATOR_NAV_SECTIONS = [
  {
    title: "Cộng đồng",
    items: [
      {
        id: "reports",
        label: "Xử lý báo cáo",
        to: "/moderator/reports",
        icon: faFlag,
        badgeKey: "reports",
        end: false,
      },
      {
        id: "content",
        label: "Duyệt bài viết",
        to: "/moderator/content",
        icon: faClipboardCheck,
        badgeKey: "content",
        end: true,
      },
      {
        id: "content-history",
        label: "Lịch sử duyệt bài",
        to: "/moderator/content/history",
        icon: faClockRotateLeft,
        end: true,
      },
      {
        id: "featured",
        label: "Bài viết nổi bật",
        to: "/moderator/featured",
        icon: faStar,
        end: false,
      },
    ],
  },
  {
    title: "Tài khoản",
    items: [
      {
        id: "violations",
        label: "Tài khoản vi phạm",
        to: "/moderator/violations",
        icon: faUserSlash,
        end: false,
      },
    ],
  },
  {
    title: "Đề thi",
    items: [
      {
        id: "practice-submissions",
        label: "Bài nộp thực hành",
        to: "/moderator/practice-submissions",
        icon: faClipboardList,
        end: false,
      },
      {
        id: "final-exam",
        label: "Thêm đề cuối kỳ",
        to: "/moderator/final-exams/add",
        icon: faFileCirclePlus,
        end: false,
      },
      {
        id: "practice-exam",
        label: "Thêm đề thực hành",
        to: "/moderator/practice-exams/add",
        icon: faClipboardList,
        end: false,
      },
    ],
  },
];

/** @deprecated — dùng MODERATOR_NAV_SECTIONS */
export const MODERATOR_NAV_GROUPS = MODERATOR_NAV_SECTIONS.map((section) => ({
  id: section.title.toLowerCase().replace(/\s+/g, "-"),
  label: section.title,
  items: section.items,
}));

export const MODERATOR_NAV_ITEMS = MODERATOR_NAV_SECTIONS.flatMap((section) => section.items);

export function flattenModeratorNavItems() {
  return MODERATOR_NAV_ITEMS;
}

export function resolveModeratorPageTitle(pathname) {
  const flat = flattenModeratorNavItems();
  const sorted = [...flat].sort((a, b) => b.to.length - a.to.length);

  for (const item of sorted) {
    const basePath = item.to.split("?")[0];
    if (item.end && pathname === basePath) return item.label;
    if (!item.end && pathname.startsWith(basePath) && basePath !== "/moderator") {
      return item.label;
    }
  }

  if (pathname === "/moderator") return "Xử lý báo cáo";
  if (pathname.startsWith("/moderator/content/history")) return "Lịch sử duyệt bài";
  if (pathname.includes("/final-exams/add/questions")) return "Thêm đề cuối kỳ";
  if (pathname.includes("/final-exams/add/review")) return "Thêm đề cuối kỳ";
  return "Kiểm duyệt";
}

export function isModeratorNavActive(item, pathname) {
  const basePath = item.to.split("?")[0];
  if (item.end) return pathname === basePath;
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function getModeratorNavBadgeCounts() {
  return {
    reports: REPORTS_MOCK.filter((report) => report.status === "pending").length,
    content: getPendingContentCount(),
  };
}
