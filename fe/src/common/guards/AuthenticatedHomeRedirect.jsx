import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";
import AuthBootstrapFallback from "@/common/loading/AuthBootstrapFallback";
import { mapCommunityPathToHome } from "@/utils/subjectPaths";
import { resolveAuthenticatedLandingPath } from "@/utils/roleHelpers";

function AuthenticatedHomeRedirect() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <AuthBootstrapFallback />;
  }

  if (isAuthenticated && location.pathname !== "/") {
    const homePath = mapCommunityPathToHome(location.pathname);

    if (homePath) {
      const destination = resolveAuthenticatedLandingPath(user, homePath);
      return <Navigate to={`${destination}${location.search}`} replace />;
    }
  }

  return <Outlet />;
}

export default AuthenticatedHomeRedirect;
