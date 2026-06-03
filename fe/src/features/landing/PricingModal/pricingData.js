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
