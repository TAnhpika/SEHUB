import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";
import AuthBootstrapFallback from "@/common/loading/AuthBootstrapFallback";
import { getRoleHomePath } from "@/utils/roleHelpers";

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
