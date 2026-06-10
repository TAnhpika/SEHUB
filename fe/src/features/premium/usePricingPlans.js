import { useEffect, useState } from "react";
import * as premiumApi from "@/api/premiumApi";
import { PRICING_PLANS } from "@/features/landing/PricingModal/pricingData";
import { mergeApiPlansWithStatic } from "@/features/premium/mergePricingPlans";

export function usePricingPlans() {
  const [plans, setPlans] = useState(PRICING_PLANS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setLoading(true);
      try {
        const apiPlans = await premiumApi.getPlans();
        if (!cancelled) {
          setPlans(mergeApiPlansWithStatic(apiPlans));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setPlans(PRICING_PLANS);
          setError(err?.message ?? "Không tải được bảng giá.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, loading, error };
}
