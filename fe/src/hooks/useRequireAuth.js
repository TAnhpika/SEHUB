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

  const requireAuth = useCallback(
    (message = "Vui lòng đăng nhập để tiếp tục.") => {
      if (isAuthenticated) return true;
      if (pendingRef.current) return false;

      pendingRef.current = true;

      showCountdownToast(
        message,
        () => {
          pendingRef.current = false;
          navigate(LOGIN_PATH, {
            state: { from: `${location.pathname}${location.search}` },
          });
        },
        () => {
          pendingRef.current = false;
        },
      );

      return false;
    },
    [isAuthenticated, showCountdownToast, navigate, location.pathname, location.search],
  );

  return { isAuthenticated, requireAuth };
}
