import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";
import AuthBootstrapFallback from "@/common/loading/AuthBootstrapFallback";
import { mapCommunityPathToHome } from "@/utils/subjectPaths";
import { getRoleHomePath, resolveAuthenticatedLandingPath } from "@/utils/roleHelpers";

function AuthenticatedHomeRedirect() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <AuthBootstrapFallback />;
  }

  if (isAuthenticated) {
    if (user?.emailConfirmed === false) {
      return (
        <Navigate
          to="/verify-email"
          state={{ from: location.pathname, email: user.email }}
          replace
        />
      );
    }

    if (location.pathname === "/") {
      return <Navigate to={getRoleHomePath(user)} replace />;
    }

    const homePath = mapCommunityPathToHome(location.pathname);

    if (homePath) {
      const destination = resolveAuthenticatedLandingPath(user, homePath);
      return <Navigate to={`${destination}${location.search}`} replace />;
    }
  }

  return <Outlet />;
}

export default AuthenticatedHomeRedirect;
