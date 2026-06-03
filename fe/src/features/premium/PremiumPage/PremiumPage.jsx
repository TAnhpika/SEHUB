import PricingContent from "@/features/premium/PricingContent/PricingContent";
import styles from "./PremiumPage.module.css";

function PremiumPage() {
  return (
    <div className={styles.page}>
      <PricingContent />
    </div>
  );
}

export default PremiumPage;
