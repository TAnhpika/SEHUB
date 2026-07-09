import PricingContent from "@/features/premium/PricingContent/PricingContent";
import styles from "./PremiumPage.module.css";

/**
 * @fileoverview Trang Premium chính — wrapper cho `PricingContent` trong layout authenticated.
 *
 * @module features/premium/PremiumPage
 */

/**
 * Trang bảng giá Premium trong khu vực đã đăng nhập (`/home/premium`).
 *
 * @returns {import('react').ReactElement} Layout trang với `PricingContent`.
 *
 * @example
 * <Route path="/home/premium" element={<PremiumPage />} />
 */
function PremiumPage() {
  return (
    <div className={styles.page}>
      <PricingContent />
    </div>
  );
}

export default PremiumPage;
