/**
 * @fileoverview Hook tải bảng giá Premium — merge API live với template UI tĩnh.
 *
 * @module features/premium/usePricingPlans
 */

import { useEffect, useState } from "react";
import * as premiumApi from "@/api/premiumApi";
import { PRICING_PLANS } from "@/features/landing/PricingModal/pricingData";
import { mergeApiPlansWithStatic } from "@/features/premium/mergePricingPlans";

/**
 * @typedef {Object} UsePricingPlansResult
 * @property {Array} plans - Danh sách gói đã merge (hoặc fallback static).
 * @property {boolean} loading - `true` trong lần fetch đầu tiên.
 * @property {string|null} error - Thông báo lỗi nếu API thất bại; `null` khi OK.
 */

/**
 * Hook tải và cache bảng giá Premium từ API.
 *
 * Khi API lỗi, fallback về `PRICING_PLANS` tĩnh và set `error`.
 *
 * @returns {UsePricingPlansResult} State bảng giá.
 *
 * @example
 * const { plans, loading, error } = usePricingPlans();
 */
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
