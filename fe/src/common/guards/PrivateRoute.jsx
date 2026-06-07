import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";

function PrivateRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;
