import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";

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
