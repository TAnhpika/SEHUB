import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context";

function GuestRoute() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (isAuthenticated) {
    if (user?.emailConfirmed === false) {
      return <Navigate to="/verify-email" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
