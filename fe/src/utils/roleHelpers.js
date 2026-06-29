import { MODERATOR_HOME_PATH } from "@/features/moderator/moderatorNavData";

export function isStaffUser(user) {
  const role = user?.role;
  return role === "admin" || role === "moderator";
}

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

/**
 * Đích landing khi user đã đăng nhập mở trang guest (/ hoặc /community).
 * Staff chỉ bị chuyển về panel khi đích là feed sinh viên (/home); URL sâu hơn giữ nguyên.
 */
export function resolveAuthenticatedLandingPath(user, path = "/home") {
  if (isStaffUser(user) && path === "/home") {
    return getRoleHomePath(user);
  }

  return path;
}
