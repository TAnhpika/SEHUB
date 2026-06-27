import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context";
import AuthBootstrapFallback from "@/common/loading/AuthBootstrapFallback";

function GuestRoute() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <AuthBootstrapFallback />;
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
