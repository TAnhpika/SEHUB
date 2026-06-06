import {
  faBook,
  faChartLine,
  faCreditCard,
  faFileLines,
  faFlag,
  faTrophy,
  faUserShield,
  faUsers,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";

export const ADMIN_NAV_SECTIONS = [
  {
    title: "Tổng quan",
    items: [
      { id: "dashboard", label: "Dashboard", to: "/admin", icon: faChartLine, end: true },
    ],
  },
  {
    title: "Người dùng",
    items: [
      { id: "users", label: "Quản lý tài khoản", to: "/admin/users", icon: faUsers, end: false },
      {
        id: "banned",
        label: "Tài khoản bị khóa",
        to: "/admin/users",
        search: "?status=banned",
        icon: faUserSlash,
        end: false,
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
          {
            id: "exams",
            label: "Quản lý đề thi",
            to: "/admin/exams",
            end: false,
          },
          {
            id: "exam-pending",
            label: "Duyệt đề Mod",
            to: "/admin/exams/pending",
            badge: 2,
            badgeTone: "amber",
          },
          {
            id: "practice-submissions",
            label: "Bài nộp thực hành",
            to: "/admin/exams/submissions",
            badge: 5,
            badgeTone: "amber",
          },
        ],
      },
      { id: "documents", label: "Quản lý tài liệu", to: "/admin/documents", icon: faBook },
      {
        id: "moderation",
        label: "Hàng chờ báo cáo",
        to: "/admin/moderation",
        icon: faFlag,
        badge: 7,
        badgeTone: "urgent",
      },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { id: "payments", label: "Quản lý thanh toán", to: "/admin/payments", icon: faCreditCard },
      {
        id: "gamification",
        label: "Gamification config",
        to: "/admin/gamification",
        icon: faTrophy,
      },
    ],
  },
];

/** Dùng breadcrumb / header — gồm cả mục trong nhóm collapse */
export function flattenAdminNavItems() {
  /** @type {Array<{ id: string, label: string, to: string, end?: boolean }>} */
  const flat = [];
  for (const section of ADMIN_NAV_SECTIONS) {
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
