/**
 * @fileoverview Hook chặn thao tác cần Premium và điều hướng người dùng sang trang nâng cấp.
 *
 * @module hooks/useRequirePremium
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";

/**
 * @typedef {Object} UseRequirePremiumResult
 * @property {boolean} isAuthenticated - Trạng thái đăng nhập hiện tại.
 * @property {boolean} isPremium - Quyền Premium hiện tại của người dùng.
 * @property {(message?: string) => boolean} requirePremium - Guard callback trả `true` khi được phép tiếp tục.
 */

/**
 * Hook tạo guard mềm cho các thao tác Premium trong UI.
 *
 * Dùng khi không muốn chặn bằng route-level guard mà chỉ cần báo toast và redirect khi user bấm hành động.
 *
 * @returns {UseRequirePremiumResult} Cờ auth/premium và hàm `requirePremium`.
 *
 * @example
 * const { requirePremium } = useRequirePremium();
 * if (!requirePremium("Nâng cấp Premium để dùng AI.")) return;
 */
export function useRequirePremium() {
  const { isPremium, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const requirePremium = useCallback(
    /**
     * Kiểm tra người dùng có đủ điều kiện dùng tính năng Premium hay không.
     *
     * @param {string} [message="Nâng cấp Premium để làm bài trắc nghiệm trực tuyến."] - Toast hiển thị khi user chưa có Premium.
     * @returns {boolean} `true` nếu được phép tiếp tục; `false` nếu đã toast/redirect.
     */
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
