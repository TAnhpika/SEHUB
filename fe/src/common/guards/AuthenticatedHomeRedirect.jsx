import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";
import { mapCommunityPathToHome } from "@/utils/subjectPaths";

function AuthenticatedHomeRedirect() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return null;
  }

  if (isAuthenticated) {
    const homePath =
      location.pathname === "/" ? "/home" : mapCommunityPathToHome(location.pathname);

    if (homePath) {
      return <Navigate to={`${homePath}${location.search}`} replace />;
    }
  }

  return <Outlet />;
}

export default AuthenticatedHomeRedirect;
