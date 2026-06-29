import { MODERATOR_HOME_PATH } from "@/features/moderator/moderatorNavData";

export function isStaffUser(user) {
  const role = user?.role;
  return role === "admin" || role === "moderator";
}

/**
 * Đường dẫn sau đăng nhập / verify email / mở /login khi đã auth.
 * Chỉ dùng cho luồng đăng nhập — không dùng khi duyệt landing (/).
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
 * Đích sau khi map /community → /home cho user đã đăng nhập.
 * Trang chủ (/) luôn hiển thị landing — không redirect theo role.
 */
export function resolveAuthenticatedLandingPath(_user, path = "/home") {
  return path;
}
