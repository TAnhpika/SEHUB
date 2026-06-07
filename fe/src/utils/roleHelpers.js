import { MODERATOR_HOME_PATH } from "@/features/moderator/moderatorNavData";

/**
 * Đường dẫn mặc định sau đăng nhập theo vai trò.
 * Staff (admin/moderator) luôn về panel riêng — không quay lại trang guest trong state.from.
 * @param {{ role?: string } | null | undefined} user
 * @param {string} [fallback="/home"]
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
