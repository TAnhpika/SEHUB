/**
 * @fileoverview Route guard giới hạn truy cập cho các màn hình/chức năng chỉ dành cho Premium.
 *
 * @module common/guards/PremiumRoute
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";

/**
 * Guard React Router cho các route yêu cầu:
 * - Đã đăng nhập.
 * - Có quyền Premium (bao gồm staff được elevate trong `resolveIsPremium`).
 *
 * Nếu chưa đăng nhập, user bị chuyển về `/login`.
 * Nếu đã đăng nhập nhưng chưa Premium, user bị chuyển về `/home/premium`
 * kèm `state.reason = "premium-required"` để UI có thể hiển thị ngữ cảnh upsell.
 *
 * @returns {import('react').ReactElement} `Outlet` khi đạt điều kiện, ngược lại là `Navigate`.
 *
 * @example
 * <Route element={<PremiumRoute />}>
 *   <Route path="/home/advisor" element={<ChatbotAdvisorPage />} />
 * </Route>
 */
function PremiumRoute() {
  const { isAuthenticated, isPremium } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isPremium) {
    return (
      <Navigate
        to="/home/premium"
        state={{ from: location.pathname, reason: "premium-required" }}
        replace
      />
    );
  }

  return <Outlet />;
}

export default PremiumRoute;
