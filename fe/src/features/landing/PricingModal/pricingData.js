import * as premiumApi from "@/api/premiumApi";
import {
  mapApiPlansToFePlans,
  mapPaymentOrderDto,
  mapSubscriptionStatusDto,
  resolvePlanCodeFromFeId,
} from "@/api/premiumMapper";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/** Giá gốc tham chiếu — gói Trải nghiệm 1 tháng (SEHUB §3.8: 1m / 8m / 4y) */
export const BASE_MONTHLY_PRICE = 48000;

function buildCheckout({ months, days, totalPrice, packageTitle, tagline }) {
  const monthlyPrice = Math.round(totalPrice / months);
  const originalPrice = BASE_MONTHLY_PRICE * months;
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

function createPlan({
  id,
  name,
  duration,
  totalPrice,
  months,
  days,
  packageTitle,
  tagline,
  popular,
  features,
  cta,
  ctaLook,
}) {
  const checkout = buildCheckout({
    months,
    days,
    totalPrice,
    packageTitle,
    tagline,
  });

  const monthlyPrice = checkout.monthlyPrice;

  return {
    id,
    name,
    duration,
    price: `${monthlyPrice.toLocaleString("vi-VN")} đ/tháng`,
    savings: checkout.savingsLabel,
    popular,
    features,
    cta,
    ctaLook,
    checkout,
  };
}

export const PRICING_PLANS = [
  createPlan({
    id: "trial",
    name: "Trải nghiệm",
    duration: "1 tháng",
    totalPrice: 48000,
    months: 1,
    days: 30,
    packageTitle: "Gói Trải nghiệm (1 tháng)",
    tagline: "Học tập không giới hạn trong 30 ngày",
    popular: false,
    features: [
      "Xem full đáp án đề thi",
      "1.000 token AI/ngày",
      "Tải tài liệu học tập",
      "Luyện thi trực tuyến",
    ],
    cta: "Chọn gói này",
    ctaLook: "outline",
  }),
  createPlan({
    id: "semester",
    name: "2 Học kỳ",
    duration: "8 tháng",
    totalPrice: 200000,
    months: 8,
    days: 240,
    packageTitle: "Gói 2 Học kỳ (8 tháng)",
    tagline: "Học tập không giới hạn trong 240 ngày",
    popular: true,
    features: [
      "Tất cả tính năng gói 1 tháng",
      "AI token không giới hạn",
      "Voucher FTES 20%",
    ],
    cta: "Bắt đầu ngay",
    ctaLook: "solid",
  }),
  createPlan({
    id: "full",
    name: "Toàn khóa học",
    duration: "4 năm",
    totalPrice: 650000,
    months: 48,
    days: 1460,
    packageTitle: "Gói Toàn khóa học (4 năm)",
    tagline: "Học tập không giới hạn trong 1.460 ngày (48 tháng)",
    popular: false,
    features: [
      "Tất cả tính năng Premium trong 4 năm",
      "Ưu tiên hỗ trợ 24/7",
      "Voucher FTES 100%",
    ],
    cta: "Chọn gói này",
    ctaLook: "outline",
  }),
];

export const FEATURE_COMPARISON = [
  {
    feature: "Xem câu hỏi đề thi",
    free: { type: "check" },
    premium: { type: "check" },
  },
  {
    feature: "Xem đáp án & giải thích chi tiết",
    free: { type: "cross" },
    premium: { type: "check" },
  },
  {
    feature: "Kho tài liệu học tập (Slide, Giáo trình)",
    free: { type: "cross" },
    premium: { type: "check" },
  },
  {
    feature: "AI Assistant hỗ trợ 24/7",
    free: { type: "label", text: "Giới hạn" },
    premium: { type: "label", text: "Không giới hạn", highlight: true },
  },
  {
    feature: "Luyện thi trực tuyến & Chấm điểm",
    free: { type: "cross" },
    premium: { type: "check" },
  },
  {
    feature: "Tích hợp nộp bài qua GitHub",
    free: { type: "cross" },
    premium: { type: "check" },
  },
  {
    feature: "Ưu tiên hỗ trợ học vụ",
    free: { type: "cross" },
    premium: { type: "check" },
  },
  {
    feature: "Voucher Free & Quà tặng",
    free: { type: "cross" },
    premium: { type: "check" },
  },
];

export const PAYMENT_INFO = {
  bank: "MB Bank (Quân Đội)",
  accountNumber: "123456789",
  accountName: "SEHUB PLATFORM",
  transferPrefix: "SEHUB",
};

export function formatVnd(amount) {
  return `${amount.toLocaleString("vi-VN")} đ`;
}

export function getPlanById(planId) {
  return PRICING_PLANS.find((plan) => plan.id === planId) ?? PRICING_PLANS[1];
}

export function buildTransferContent(planId) {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `${PAYMENT_INFO.transferPrefix}_${planId.toUpperCase()}_${stamp}`;
}

export function buildTransactionId() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `SEH_${stamp}_CONFIRMED`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function resolvePlanCode(planId) {
  return resolvePlanCodeFromFeId(planId);
}

export async function loadPricingPlans() {
  if (USE_MOCK) {
    return PRICING_PLANS;
  }

  try {
    const apiPlans = await premiumApi.getPlans();
    if ((apiPlans ?? []).length > 0) {
      return mapApiPlansToFePlans(apiPlans, PRICING_PLANS);
    }
  } catch {
    /* fallback below */
  }

  return PRICING_PLANS;
}

export async function loadPlanById(planId) {
  const plans = await loadPricingPlans();
  return plans.find((plan) => plan.id === planId) ?? getPlanById(planId);
}

export async function createCheckoutOrder(planId) {
  if (USE_MOCK) {
    return null;
  }

  const planCode = resolvePlanCode(planId);
  if (!planCode) {
    return null;
  }

  const dto = await premiumApi.createOrder({ planCode });
  return mapPaymentOrderDto(dto);
}

export async function getCheckoutOrder(orderId) {
  if (USE_MOCK || !orderId) {
    return null;
  }

  const dto = await premiumApi.getOrder(orderId);
  return mapPaymentOrderDto(dto);
}

export async function loadSubscriptionStatus() {
  if (USE_MOCK) {
    return {
      isActive: false,
      expiresAt: null,
      planName: null,
      latestPaidOrderCode: null,
      lastPaidAt: null,
      canRequestRefund: false,
      hasPendingRefundRequest: false,
    };
  }

  try {
    const dto = await premiumApi.getSubscription();
    return mapSubscriptionStatusDto(dto);
  } catch {
    return {
      isActive: false,
      expiresAt: null,
      planName: null,
      latestPaidOrderCode: null,
      lastPaidAt: null,
      canRequestRefund: false,
      hasPendingRefundRequest: false,
    };
  }
}

export async function requestPremiumRefund({ orderCode, reason }) {
  if (USE_MOCK) {
    await sleep(400);
    return {
      orderCode,
      status: "RefundRequested",
      isPremium: true,
      aiDailyTokenLimit: 1000,
      message: "Mock: Yêu cầu hoàn tiền đã được gửi, chờ admin duyệt.",
    };
  }

  const dto = await premiumApi.requestRefund({ orderCode, reason });
  return {
    orderCode: dto.orderCode ?? orderCode,
    status: dto.status ?? "RefundRequested",
    isPremium: Boolean(dto.isPremium),
    aiDailyTokenLimit: Number(dto.aiDailyTokenLimit ?? 10),
    message:
      dto.message ??
      "Yêu cầu hoàn tiền đã được gửi. Admin sẽ duyệt trong thời gian sớm nhất.",
  };
}

export async function pollPremiumActivation(orderId, { maxAttempts = 40, intervalMs = 3000 } = {}) {
  if (USE_MOCK) {
    return false;
  }

  if (!orderId) {
    return false;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const order = await getCheckoutOrder(orderId);
      if (order?.status === "Paid") {
        return true;
      }
    } catch {
      /* continue polling */
    }

    if (attempt < maxAttempts - 1) {
      await sleep(intervalMs);
    }
  }

  return false;
}
