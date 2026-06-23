import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context";

function GuestRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
