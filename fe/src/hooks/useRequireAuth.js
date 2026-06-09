import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { isSubjectContentPath } from "@/utils/subjectPaths";

const LOGIN_PATH = "/login";

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const { showCountdownToast, hideToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingRef = useRef(false);
  const isCommunityRoute = location.pathname.startsWith("/community");
  const isSubjectArea = isSubjectContentPath(location.pathname);
  /** Cộng đồng luôn coi như khách — cần toast + chuyển login khi tương tác feed/bài viết. */
  const needsLoginPrompt = !isAuthenticated || isCommunityRoute;

  useEffect(() => {
    pendingRef.current = false;
    hideToast();
  }, [location.pathname, location.search, hideToast]);

  const requireAuth = useCallback(
    (message = "Vui lòng đăng nhập để tiếp tục.", redirectOrOptions) => {
      const options =
        typeof redirectOrOptions === "string"
          ? { redirectTo: redirectOrOptions }
          : redirectOrOptions ?? {};
      const { guestOnly = false, redirectTo } = options;
      const shouldPrompt = guestOnly || isSubjectArea
        ? !isAuthenticated
        : needsLoginPrompt;

      if (!shouldPrompt) return true;
      if (pendingRef.current) return false;

      pendingRef.current = true;
      const returnPath = redirectTo ?? `${location.pathname}${location.search}`;

      showCountdownToast(
        message,
        () => {
          pendingRef.current = false;
          navigate(LOGIN_PATH, {
            state: { from: returnPath },
          });
        },
        () => {
          pendingRef.current = false;
        },
      );

      return false;
    },
    [
      isAuthenticated,
      isSubjectArea,
      needsLoginPrompt,
      showCountdownToast,
      navigate,
      location.pathname,
      location.search,
    ],
  );

  return { isAuthenticated, needsLoginPrompt, requireAuth };
}
