import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export function useRequirePremium() {
  const { isPremium } = useAuth();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const requirePremium = useCallback(
    (message = "Nâng cấp Premium để làm bài trắc nghiệm trực tuyến.") => {
      if (!requireAuth("Vui lòng đăng nhập để làm bài thi.")) {
        return false;
      }

      if (isPremium) {
        return true;
      }

      showToast(message);
      navigate("/home/premium");
      return false;
    },
    [requireAuth, isPremium, showToast, navigate],
  );

  return { isAuthenticated, isPremium, requirePremium };
}
