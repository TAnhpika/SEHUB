/**
 * @fileoverview Cấu hình workspace liên role cho SEHUB và helper suy ra khả năng truy cập.
 *
 * Module này phục vụ `WorkspaceSwitcher` bằng cách mô tả từng workspace (Admin,
 * Moderator, Student), route gốc tương ứng và danh sách role được phép nhìn thấy.
 *
 * @module common/WorkspaceSwitcher/workspaceConfig
 * @see {@link module:common/WorkspaceSwitcher/WorkspaceSwitcher} - UI dùng cấu hình này để render danh sách chuyển khu vực.
 */

import {
  faHouse,
  faShieldHalved,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { MODERATOR_HOME_PATH } from "@/features/moderator/moderatorNavData";

/** @typedef {'admin' | 'moderator' | 'student'} WorkspaceId */

/**
 * @typedef {Object} WorkspaceDefinition
 * @property {WorkspaceId} id - Mã định danh workspace.
 * @property {string} label - Tên hiển thị cho người dùng cuối.
 * @property {string} desc - Mô tả ngắn giúp phân biệt mục đích của workspace.
 * @property {string} to - Route gốc điều hướng tới workspace.
 * @property {import('@fortawesome/fontawesome-svg-core').IconDefinition} icon - Icon Font Awesome đại diện cho khu vực.
 * @property {Array<'admin' | 'moderator' | 'student'>} roles - Danh sách role được phép truy cập workspace.
 */

/**
 * Danh sách đầy đủ các workspace mà hệ thống hỗ trợ.
 *
 * @constant {ReadonlyArray<WorkspaceDefinition>}
 * @readonly
 *
 * @example
 * WORKSPACES.map((workspace) => workspace.id);
 * // => ['admin', 'moderator', 'student']
 */
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
    roles: ["moderator"],
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
 * Suy ra workspace hiện tại từ pathname của router.
 *
 * @param {string} pathname
 * @returns {WorkspaceId}
 *
 * @example
 * getCurrentWorkspaceId('/moderator/reports'); // 'moderator'
 */
export function getCurrentWorkspaceId(pathname) {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/moderator")) return "moderator";
  return "student";
}

/**
 * Lọc danh sách workspace mà người dùng hiện tại có thể chuyển tới.
 *
 * Quy tắc nghiệp vụ:
 * - `admin` thấy workspace admin + student (không vào moderator).
 * - `moderator` thấy workspace moderator + student.
 * - role còn lại chỉ thấy trang sinh viên.
 *
 * @param {{ role?: string } | null | undefined} user
 * @returns {Array<WorkspaceDefinition>} Danh sách workspace hợp lệ theo role hiện tại.
 *
 * @example
 * const workspaces = getAccessibleWorkspaces({ role: 'moderator' });
 * workspaces.some((workspace) => workspace.id === 'admin'); // false
 */
export function getAccessibleWorkspaces(user) {
  const role = user?.role ?? "student";

  if (role === "admin") {
    return WORKSPACES.filter((workspace) => workspace.id !== "moderator");
  }

  if (role === "moderator") {
    return WORKSPACES.filter((workspace) => workspace.id !== "admin");
  }

  return WORKSPACES.filter((workspace) => workspace.id === "student");
}
