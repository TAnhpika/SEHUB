import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function ModeratorRoute() {
  const { isAuthenticated, isModerator, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isModerator && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export default ModeratorRoute;
