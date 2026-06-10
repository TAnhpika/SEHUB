/** Giá gốc tham chiếu — gói 1 tháng (khớp BE plan `1m`: 99.000đ) */
export const BASE_MONTHLY_PRICE = 99000;

function buildCheckout({ months, days, monthlyPrice, packageTitle, tagline }) {
  const originalPrice = BASE_MONTHLY_PRICE * months;
  const totalPrice = monthlyPrice * months;
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
  monthlyPrice,
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
    monthlyPrice,
    packageTitle,
    tagline,
  });

  return {
    id,
    planCode: id === "trial" ? "1m" : id === "semester" ? "8m" : "4y",
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
    monthlyPrice: 99000,
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
    monthlyPrice: 74875,
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
    monthlyPrice: 41646,
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
