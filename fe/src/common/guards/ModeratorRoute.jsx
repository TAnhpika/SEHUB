/**
 * @fileoverview Route guard bảo vệ các route thuộc khu vực Moderator SEHUB.
 *
 * Guard này đảm bảo chỉ người dùng đã xác thực và có quyền `moderator` hoặc `admin`
 * mới truy cập được workspace kiểm duyệt. Các trường hợp khác sẽ bị chuyển hướng về
 * trang đăng nhập hoặc trang chủ phù hợp với vai trò hiện tại.
 *
 * @module common/guards/ModeratorRoute
 * @see {@link module:utils/roleHelpers} - Suy ra trang đích theo vai trò người dùng.
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";
import AuthBootstrapFallback from "@/common/loading/AuthBootstrapFallback";
import { getRoleHomePath } from "@/utils/roleHelpers";

/**
 * Guard route cho workspace moderator.
 *
 * Luồng kiểm tra:
 * 1. Nếu auth đang bootstrap, hiển thị fallback loading để tránh redirect sai.
 * 2. Nếu chưa đăng nhập, chuyển về `/login` và lưu `from` để hỗ trợ quay lại sau auth.
 * 3. Nếu đã đăng nhập nhưng không có quyền moderator/admin, chuyển về home theo role.
 * 4. Nếu hợp lệ, render `Outlet` cho route con.
 *
 * @returns {import('react').ReactElement} `Outlet`, `Navigate` hoặc fallback bootstrap tùy trạng thái xác thực.
 *
 * @example
 * <Route element={<ModeratorRoute />}>
 *   <Route path="/moderator/reports" element={<ReportsPage />} />
 * </Route>
 */
function ModeratorRoute() {
  const { isAuthenticated, isModerator, isAdmin, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <AuthBootstrapFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isModerator && !isAdmin) {
    return <Navigate to={getRoleHomePath(user)} replace />;
  }

  return <Outlet />;
}

export default ModeratorRoute;
