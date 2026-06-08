import {
  faHouse,
  faShieldHalved,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { MODERATOR_HOME_PATH } from "@/features/moderator/moderatorNavData";

/** @typedef {'admin' | 'moderator' | 'student'} WorkspaceId */

export const WORKSPACES = [
  {
    id: "admin",
    label: "Quản trị Admin",
    desc: "Dashboard, user, PayOS, cấu hình hệ thống",
    to: "/admin",
    icon: faShieldHalved,
    roles: ["admin"],
  },
  {
    id: "moderator",
    label: "Kiểm duyệt",
    desc: "Báo cáo, duyệt bài, chấm bài thực hành",
    to: MODERATOR_HOME_PATH,
    icon: faUserShield,
    roles: ["admin", "moderator"],
  },
  {
    id: "student",
    label: "Trang sinh viên",
    desc: "Feed, đề thi, tài liệu, Premium",
    to: "/home",
    icon: faHouse,
    roles: ["admin", "moderator", "student"],
  },
];

/**
 * @param {string} pathname
 * @returns {WorkspaceId}
 */
export function getCurrentWorkspaceId(pathname) {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/moderator")) return "moderator";
  return "student";
}

/**
 * @param {{ role?: string } | null | undefined} user
 */
export function getAccessibleWorkspaces(user) {
  const role = user?.role ?? "student";

  if (role === "admin") {
    return WORKSPACES;
  }

  if (role === "moderator") {
    return WORKSPACES.filter((workspace) => workspace.id !== "admin");
  }

  return WORKSPACES.filter((workspace) => workspace.id === "student");
}
