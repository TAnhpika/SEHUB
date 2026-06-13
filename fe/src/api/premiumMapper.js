export const PLAN_CODE_BY_FE_ID = {
  trial: "1m",
  semester: "8m",
  full: "4y",
};

export const FE_ID_BY_PLAN_CODE = {
  "1m": "trial",
  "8m": "semester",
  "4y": "full",
};

export function resolvePlanCodeFromFeId(fePlanId) {
  return PLAN_CODE_BY_FE_ID[fePlanId] ?? fePlanId;
}

export function resolveFePlanIdFromCode(planCode) {
  return FE_ID_BY_PLAN_CODE[String(planCode ?? "").toLowerCase()] ?? planCode;
}

function buildCheckoutFromApi({ months, days, monthlyPrice, totalPrice, packageTitle, tagline }) {
  const originalPrice = 48000 * months;
  const savingsAmount = Math.max(originalPrice - totalPrice, 0);
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

export function mapApiPlanToFePlan(dto, templates) {
  const feId = resolveFePlanIdFromCode(dto.code);
  const template = templates.find((plan) => plan.id === feId) ?? templates[1];
  const months = Math.max(1, Math.round((dto.durationDays ?? 30) / 30));
  const totalPrice = Number(dto.priceVnd ?? 0);
  const monthlyPrice = Math.max(1, Math.round(totalPrice / months));

  const checkout = buildCheckoutFromApi({
    months,
    days: dto.durationDays ?? months * 30,
    monthlyPrice,
    totalPrice,
    packageTitle: template.checkout.packageTitle,
    tagline: template.checkout.tagline,
  });

  return {
    ...template,
    id: feId,
    planCode: dto.code,
    name: template.name,
    duration: template.duration,
    price: `${monthlyPrice.toLocaleString("vi-VN")} đ/tháng`,
    savings: checkout.savingsLabel,
    checkout,
  };
}

export function mapApiPlansToFePlans(apiPlans, templates) {
  return (apiPlans ?? []).map((dto) => mapApiPlanToFePlan(dto, templates));
}

export function mapPaymentOrderDto(dto) {
  return {
    orderId: dto.orderId,
    payOsOrderCode: dto.payOsOrderCode,
    amount: Number(dto.amount ?? 0),
    status: dto.status,
    qrUrl: dto.qrUrl ?? null,
    checkoutUrl: dto.checkoutUrl ?? null,
    expiredAt: dto.expiredAt ?? null,
  };
}

export function mapSubscriptionStatusDto(dto) {
  return {
    isActive: Boolean(dto.isActive),
    expiresAt: dto.expiresAt ?? null,
    planName: dto.planName ?? null,
    latestPaidOrderCode: dto.latestPaidOrderCode ?? null,
    lastPaidAt: dto.lastPaidAt ?? null,
    canRequestRefund: Boolean(dto.canRequestRefund),
    hasPendingRefundRequest: Boolean(dto.hasPendingRefundRequest),
  };
}
