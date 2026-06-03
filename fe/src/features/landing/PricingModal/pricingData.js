export const PRICING_PLANS = [
  {
    id: "trial",
    name: "Trải nghiệm",
    duration: "1 tháng",
    price: "49.000 đ/tháng",
    savings: null,
    popular: false,
    features: [
      "Xem full đáp án đề thi",
      "1.000 token AI/ngày",
      "Tải tài liệu học tập",
      "Luyện thi trực tuyến",
    ],
    cta: "Chọn gói này",
    ctaLook: "outline",
    checkout: {
      packageTitle: "Gói Trải nghiệm (1 tháng)",
      tagline: "Học tập không giới hạn trong 30 ngày",
      days: 30,
      originalPrice: 49000,
      monthlyPrice: 49000,
      months: 1,
      totalPrice: 49000,
      savingsLabel: null,
    },
  },
  {
    id: "semester",
    name: "1 Học kỳ",
    duration: "8 tháng",
    price: "35.000 đ/tháng",
    savings: "Tiết kiệm 28%",
    popular: true,
    features: [
      "Tất cả tính năng gói 1 tháng",
      "AI token không giới hạn",
      "+20% voucher",
    ],
    cta: "Bắt đầu ngay",
    ctaLook: "solid",
    checkout: {
      packageTitle: "Gói 1 Học kỳ (8 tháng)",
      tagline: "Học tập không giới hạn trong 240 ngày",
      days: 240,
      originalPrice: 395000,
      monthlyPrice: 35000,
      months: 8,
      totalPrice: 280000,
      savingsLabel: "Tiết kiệm 28%",
    },
  },
  {
    id: "full",
    name: "Toàn khóa học",
    duration: "4 năm",
    price: "20.000 đ/tháng",
    savings: "Tiết kiệm 58%",
    popular: false,
    features: [
      "Tất cả tính năng trọn đời",
      "Ưu tiên hỗ trợ 24/7",
      "+100% voucher",
    ],
    cta: "Chọn gói này",
    ctaLook: "outline",
    checkout: {
      packageTitle: "Gói Toàn khóa học (4 năm)",
      tagline: "Học tập không giới hạn trong 1.460 ngày",
      days: 1460,
      originalPrice: 2280000,
      monthlyPrice: 20000,
      months: 48,
      totalPrice: 960000,
      savingsLabel: "Tiết kiệm 58%",
    },
  },
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
