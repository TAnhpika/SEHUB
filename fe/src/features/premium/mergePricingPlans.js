import { PRICING_PLANS } from "@/features/landing/PricingModal/pricingData";
import { getBePlanCode } from "@/features/premium/premiumPlanMap";

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

function resolveMonths(fePlanId, durationDays) {
  if (fePlanId === "trial") return 1;
  if (fePlanId === "semester") return 8;
  if (fePlanId === "full") return 48;
  return Math.max(1, Math.round(durationDays / 30));
}

/**
 * Merges static UI metadata with live prices from GET /api/v1/premium/plans.
 * Falls back to static PRICING_PLANS when API data is missing.
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
