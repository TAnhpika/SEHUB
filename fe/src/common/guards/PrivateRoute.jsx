import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasStoredSession } from "@/context/AuthProvider";
import { useAuth } from "@/context";

function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const authed = isAuthenticated || hasStoredSession();

  if (!authed) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;
