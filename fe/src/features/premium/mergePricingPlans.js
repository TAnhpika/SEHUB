/**
 * @fileoverview Gộp metadata UI tĩnh với giá live từ API `GET /api/v1/premium/plans`.
 *
 * @module features/premium/mergePricingPlans
 */

import { PRICING_PLANS } from "@/features/landing/PricingModal/pricingData";
import { getBePlanCode } from "@/features/premium/premiumPlanMap";

/**
 * @typedef {Object} CheckoutPricingBreakdown
 * @property {string} packageTitle - Tiêu đề gói hiển thị trên checkout.
 * @property {string} tagline - Mô tả ngắn gói.
 * @property {number} days - Số ngày hiệu lực từ API.
 * @property {number} originalPrice - Giá gốc (baseMonthly × months).
 * @property {number} monthlyPrice - Giá quy đổi mỗi tháng.
 * @property {number} months - Số tháng quy đổi.
 * @property {number} totalPrice - Tổng thanh toán từ API.
 * @property {number} savingsAmount - Số tiền tiết kiệm so với giá gốc.
 * @property {string|null} savingsLabel - Nhãn % tiết kiệm, hoặc `null`.
 */

/**
 * Xây dựng object `checkout` từ giá API và metadata template UI.
 *
 * @param {Object} params - Tham số tính giá.
 * @param {number} params.months - Số tháng quy đổi.
 * @param {number} params.days - Số ngày hiệu lực.
 * @param {number} params.monthlyPrice - Giá/tháng sau quy đổi.
 * @param {string} params.packageTitle - Tiêu đề gói.
 * @param {string} params.tagline - Tagline gói.
 * @param {number} params.totalPrice - Tổng từ API.
 * @param {number} params.baseMonthly - Giá tháng chuẩn (gói 1 tháng).
 * @returns {CheckoutPricingBreakdown} Breakdown giá cho checkout UI.
 */
function buildCheckoutFromApi({
  months,
  days,
  monthlyPrice,
  packageTitle,
  tagline,
  totalPrice,
  baseMonthly,
}) {
  const originalPrice = baseMonthly * months;
  const savingsAmount = originalPrice - totalPrice;
  const savingsPercent =
    savingsAmount > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;

  return {
    packageTitle,
    tagline,
    days,
    originalPrice,
    monthlyPrice,
    months,
    totalPrice,
    savingsAmount,
    savingsLabel: savingsPercent > 0 ? `Tiết kiệm ${savingsPercent}%` : null,
  };
}

/**
 * Suy ra số tháng quy đổi từ ID gói FE hoặc `durationDays` API.
 *
 * @param {string} fePlanId - ID gói frontend.
 * @param {number} durationDays - Số ngày hiệu lực từ API.
 * @returns {number} Số tháng dùng tính giá/tháng.
 */
function resolveMonths(fePlanId, durationDays) {
  if (fePlanId === "trial") return 1;
  if (fePlanId === "semester") return 8;
  if (fePlanId === "full") return 48;
  return Math.max(1, Math.round(durationDays / 30));
}

/**
 * Gộp metadata UI tĩnh (`PRICING_PLANS`) với giá live từ API premium plans.
 *
 * Fallback về `PRICING_PLANS` nguyên bản khi API rỗng hoặc thiếu mã gói.
 *
 * @param {Array<{ code: string, priceVnd: number, durationDays: number }>|null|undefined} apiPlans - Danh sách gói từ API.
 * @returns {Array} Mảng plan đã merge giá và `checkout` breakdown.
 *
 * @example
 * const plans = mergeApiPlansWithStatic(await premiumApi.getPlans());
 */
export function mergeApiPlansWithStatic(apiPlans) {
  if (!apiPlans?.length) {
    return PRICING_PLANS;
  }

  const apiByCode = Object.fromEntries(apiPlans.map((plan) => [plan.code, plan]));
  const baseMonthly =
    apiByCode["1m"]?.priceVnd ?? PRICING_PLANS[0]?.checkout?.monthlyPrice ?? 48000;

  return PRICING_PLANS.map((template) => {
    const beCode = getBePlanCode(template.id);
    const apiPlan = apiByCode[beCode];
    if (!apiPlan) {
      return template;
    }

    const months = resolveMonths(template.id, apiPlan.durationDays);
    const totalPrice = apiPlan.priceVnd;
    const monthlyPrice = Math.round(totalPrice / months);
    const checkout = buildCheckoutFromApi({
      months,
      days: apiPlan.durationDays,
      monthlyPrice,
      packageTitle: template.checkout.packageTitle,
      tagline: template.checkout.tagline,
      totalPrice,
      baseMonthly,
    });

    return {
      ...template,
      planCode: apiPlan.code,
      price: `${monthlyPrice.toLocaleString("vi-VN")} đ/tháng`,
      savings: checkout.savingsLabel,
      checkout,
    };
  });
}
