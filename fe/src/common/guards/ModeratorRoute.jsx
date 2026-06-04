import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";

function ModeratorRoute() {
  const { isAuthenticated, isModerator } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isModerator) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export default ModeratorRoute;
