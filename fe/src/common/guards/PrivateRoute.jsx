import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context";
import { mapHomeSubjectPathToCommunity } from "@/utils/subjectPaths";

function PrivateRoute() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated) {
    const communityPath = mapHomeSubjectPathToCommunity(location.pathname);
    if (communityPath) {
      return (
        <Navigate
          to={`${communityPath}${location.search}`}
          replace
        />
      );
    }

    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user?.emailConfirmed === false) {
    return (
      <Navigate
        to="/verify-email"
        state={{ from: location.pathname, email: user.email }}
        replace
      />
    );
  }

  return <Outlet />;
}

export default PrivateRoute;
