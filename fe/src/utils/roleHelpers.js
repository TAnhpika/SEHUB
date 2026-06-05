/**
 * Đường dẫn mặc định sau đăng nhập theo vai trò.
 * @param {{ role?: string } | null | undefined} user
 * @param {string} [fallback="/home"]
 */
export function getRoleHomePath(user, fallback = "/home") {
  if (user?.role === "admin") {
    return fallback === "/home" ? "/admin" : fallback;
  }

  if (user?.role === "moderator") {
    return fallback === "/home" ? "/moderator/reports" : fallback;
  }

  return fallback;
}
