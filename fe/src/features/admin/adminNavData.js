import {
  faBook,
  faChartLine,
  faClipboardCheck,
  faClipboardList,
  faCreditCard,
  faFileLines,
  faRobot,
  faTicket,
  faTrophy,
  faUserShield,
  faUsers,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { getAdminNavBadgeCounts } from "@/features/admin/adminNavBadges";

/**
 * Cấu trúc sidebar Admin — bám §2.5 SEHUB_PhanTichNghiepVu.md (Giai đoạn 1 + Chatbot P3).
 */
const ADMIN_NAV_TEMPLATE = [
  {
    title: "Tổng quan",
    items: [
      { id: "dashboard", label: "Dashboard", to: "/admin", icon: faChartLine, end: true },
      {
        id: "activity",
        label: "Nhật ký hoạt động",
        to: "/admin/activity",
        icon: faClipboardList,
      },
    ],
  },
  {
    title: "Người dùng",
    items: [
      { id: "users", label: "Quản lý tài khoản", to: "/admin/users", icon: faUsers, end: false },
      {
        id: "banned",
        label: "Tài khoản bị khóa",
        to: "/admin/moderation/banned",
        icon: faUserSlash,
      },
      {
        id: "permissions",
        label: "Phân quyền Mod",
        to: "/admin/permissions",
        icon: faUserShield,
      },
    ],
  },
  {
    title: "Nội dung",
    items: [
      {
        type: "group",
        id: "exams-practice",
        label: "Đề thi & thực hành",
        icon: faFileLines,
        items: [
          { id: "exams", label: "Quản lý đề thi", to: "/admin/exams", end: false },
          {
            id: "exam-pending",
            label: "Duyệt đề Mod",
            to: "/admin/exams/pending",
            badgeKey: "exam-pending",
            badgeTone: "amber",
          },
        ],
      },
      { id: "documents", label: "Quản lý tài liệu", to: "/admin/documents", icon: faBook },
      {
        type: "group",
        id: "moderation-ops",
        label: "Kiểm duyệt",
        icon: faClipboardCheck,
        items: [
          {
            id: "moderation",
            label: "Báo cáo chờ",
            to: "/admin/moderation",
            badgeKey: "moderation",
            badgeTone: "urgent",
          },
          {
            id: "pending-posts",
            label: "Bài viết chờ duyệt",
            to: "/admin/moderation/content",
            badgeKey: "pending-posts",
            badgeTone: "amber",
          },
          {
            id: "practice-submissions",
            label: "Bài nộp thực hành",
            to: "/admin/moderation/practice-submissions",
            badgeKey: "practice-submissions",
            badgeTone: "amber",
          },
        ],
      },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { id: "payments", label: "Thanh toán PayOS", to: "/admin/payments", icon: faCreditCard },
      {
        id: "gamification",
        label: "Gamification",
        to: "/admin/gamification",
        icon: faTrophy,
      },
      {
        id: "chatbot",
        label: "Chatbot tư vấn",
        to: "/admin/settings/chatbot",
        icon: faRobot,
      },
      { id: "vouchers", label: "Quản lý voucher", to: "/admin/vouchers", icon: faTicket },
    ],
  },
];

function injectBadges(items, counts) {
  return items.map((item) => {
    if (item.type === "group" && Array.isArray(item.items)) {
      return {
        ...item,
        items: item.items.map((child) => {
          if (!child.badgeKey) return child;
          const count = counts[child.badgeKey] ?? 0;
          const { badgeKey, ...rest } = child;
          return count > 0 ? { ...rest, badge: count } : rest;
        }),
      };
    }
    if (item.badgeKey) {
      const count = counts[item.badgeKey] ?? 0;
      const { badgeKey, ...rest } = item;
      return count > 0 ? { ...rest, badge: count } : rest;
    }
    return item;
  });
}

/** Nav sections với badge động từ store */
export function getAdminNavSections(badgeCounts = getAdminNavBadgeCounts()) {
  return ADMIN_NAV_TEMPLATE.map((section) => ({
    ...section,
    items: injectBadges(section.items, badgeCounts),
  }));
}

/** @deprecated — dùng getAdminNavSections() trong sidebar */
export const ADMIN_NAV_SECTIONS = getAdminNavSections();

/** Dùng breadcrumb / header — gồm cả mục trong nhóm collapse */
export function flattenAdminNavItems() {
  const sections = getAdminNavSections();
  /** @type {Array<{ id: string, label: string, to: string, end?: boolean }>} */
  const flat = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.type === "group" && Array.isArray(item.items)) {
        flat.push(...item.items);
      } else if (item.to) {
        flat.push({
          id: item.id,
          label: item.label,
          to: item.search ? `${item.to}${item.search}` : item.to,
          end: item.end,
        });
      }
    }
  }
  return flat;
}

export function resolveAdminPageTitle(pathname) {
  const flat = flattenAdminNavItems();
  const sorted = [...flat].sort((a, b) => b.to.length - a.to.length);

  for (const item of sorted) {
    const basePath = item.to.split("?")[0];
    if (item.end && pathname === basePath) return item.label;
    if (!item.end && pathname.startsWith(basePath) && basePath !== "/admin") {
      return item.label;
    }
  }

  if (pathname === "/admin") return "Dashboard";
  if (pathname.includes("/exams/new")) return "Tạo đề thi";
  if (pathname.includes("/exams/edit")) return "Sửa đề thi";
  if (pathname.startsWith("/admin/moderation/content")) return "Bài viết chờ duyệt";
  if (pathname.startsWith("/admin/moderation/practice-submissions")) return "Bài nộp thực hành";
  if (pathname.startsWith("/admin/moderation")) return "Báo cáo chờ";
  return "Quản trị";
}
