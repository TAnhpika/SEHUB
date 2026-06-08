import { useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";

const LOGIN_PATH = "/login";

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const { showCountdownToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingRef = useRef(false);
  const isCommunityRoute = location.pathname.startsWith("/community");
  /** Cộng đồng luôn coi như khách — cần toast + chuyển login khi tương tác. */
  const needsLoginPrompt = !isAuthenticated || isCommunityRoute;

  const requireAuth = useCallback(
    (message = "Vui lòng đăng nhập để tiếp tục.", redirectTo) => {
      if (!needsLoginPrompt) return true;
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
    [needsLoginPrompt, showCountdownToast, navigate, location.pathname, location.search],
  );

  return { isAuthenticated, needsLoginPrompt, requireAuth };
}
