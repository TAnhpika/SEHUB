import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
export function useRequirePremium() {
  const { isPremium, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const requirePremium = useCallback(
    (message = "Nâng cấp Premium để làm bài trắc nghiệm trực tuyến.") => {
      if (!isAuthenticated) {
        showToast(
          "Đăng nhập để làm bài trực tuyến. Bạn vẫn có thể xem từng câu hỏi trên trang này.",
        );
        return false;
      }

      if (isPremium) {
        return true;
      }

      showToast(message);
      navigate("/home/premium");
      return false;
    },
    [isAuthenticated, isPremium, showToast, navigate],
  );

  return { isAuthenticated, isPremium, requirePremium };
}
