/**
 * @fileoverview Helper ánh xạ vai trò người dùng sang workspace và đường dẫn mặc định.
 *
 * Các hàm trong module này được dùng ở guard, luồng đăng nhập và điều hướng landing
 * để đảm bảo staff (admin/moderator) luôn được đưa về đúng khu vực nghiệp vụ của họ.
 *
 * @module utils/roleHelpers
 */

import { MODERATOR_HOME_PATH } from "@/features/moderator/moderatorNavData";

/**
 * Kiểm tra người dùng có thuộc nhóm staff nội bộ hay không.
 *
 * Staff ở đây bao gồm `admin` và `moderator`, là các role có workspace vận hành riêng.
 *
 * @param {{ role?: string } | null | undefined} user - Người dùng cần kiểm tra.
 * @returns {boolean} `true` nếu user là admin hoặc moderator.
 *
 * @example
 * isStaffUser({ role: "moderator" }); // true
 * isStaffUser({ role: "student" }); // false
 */
export function isStaffUser(user) {
  const role = user?.role;
  return role === "admin" || role === "moderator";
}

/**
 * Đường dẫn sau đăng nhập / verify email / mở /login khi đã auth.
 * Chỉ dùng cho luồng đăng nhập — không dùng khi duyệt landing (/).
 * @param {{ role?: string } | null | undefined} user
 * @param {string} [fallback="/home"]
 * @returns {string} Route gốc phù hợp với role hiện tại hoặc `fallback`.
 *
 * @example
 * getRoleHomePath({ role: "admin" }); // "/admin"
 * getRoleHomePath({ role: "moderator" }); // MODERATOR_HOME_PATH
 */
export function getRoleHomePath(user, fallback = "/home") {
  if (user?.role === "admin") {
    return "/admin";
  }

  if (user?.role === "moderator") {
    return MODERATOR_HOME_PATH;
  }

  return fallback;
}

/**
 * Đích sau khi map /community → /home cho user đã đăng nhập.
 * Staff (admin/moderator) luôn về workspace tương ứng thay vì /home.
 *
 * @param {{ role?: string } | null | undefined} user - Người dùng đã xác thực.
 * @param {string} [path="/home"] - Đường dẫn fallback cho non-staff.
 * @returns {string} Landing path sau khi chuẩn hóa theo role.
 *
 * @example
 * resolveAuthenticatedLandingPath({ role: "moderator" }, "/home");
 * // => MODERATOR_HOME_PATH
 */
export function resolveAuthenticatedLandingPath(user, path = "/home") {
  if (isStaffUser(user)) {
    return getRoleHomePath(user);
  }

  return path;
}
