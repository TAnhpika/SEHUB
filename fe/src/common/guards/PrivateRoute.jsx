import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasStoredSession } from "@/context/AuthProvider";
import { useAuth } from "@/context";
import { mapHomeSubjectPathToCommunity } from "@/utils/subjectPaths";

function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const authed = isAuthenticated || hasStoredSession();

  if (!authed) {
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

  return <Outlet />;
}

export default PrivateRoute;
