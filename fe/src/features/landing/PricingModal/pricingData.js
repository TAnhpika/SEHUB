import * as premiumApi from "@/api/premiumApi";
import {
  mapApiPlansToFePlans,
  mapPaymentOrderDto,
  mapRankVoucherPreviewDto,
  mapSubscriptionStatusDto,
  resolvePlanCodeFromFeId,
} from "@/api/premiumMapper";

/**
 * @fileoverview Dữ liệu bảng giá Premium và helper tích hợp checkout/subscription cho landing page.
 *
 * Module này vừa cung cấp mock/static pricing cho FE, vừa bọc các lời gọi API Premium
 * để UI có thể fallback an toàn khi backend chưa sẵn sàng hoặc đang bật mock mode.
 *
 * @module features/landing/PricingModal/pricingData
 */

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/** Giá gốc tham chiếu — gói Trải nghiệm 1 tháng (SEHUB §3.8: 1m / 8m / 4y) */
export const BASE_MONTHLY_PRICE = 48000;

/**
 * @typedef {Object} PricingCheckoutMeta
 * @property {string} packageTitle - Tên gói hiển thị ở trang checkout.
 * @property {string} tagline - Mô tả ngắn cho gói.
 * @property {number} days - Số ngày hiệu lực.
 * @property {number} originalPrice - Giá gốc trước ưu đãi.
 * @property {number} monthlyPrice - Giá quy đổi theo tháng.
 * @property {number} months - Số tháng quy đổi.
 * @property {number} totalPrice - Tổng tiền thanh toán.
 * @property {number} savingsAmount - Số tiền tiết kiệm so với giá gốc.
 * @property {string|null} savingsLabel - Nhãn tiết kiệm phần trăm nếu có.
 */

/**
 * @typedef {Object} PricingPlan
 * @property {string} id - ID gói FE (`trial`, `semester`, `full`).
 * @property {string} name - Tên hiển thị của gói.
 * @property {string} duration - Chuỗi mô tả thời lượng.
 * @property {string} price - Giá đã format để render UI.
 * @property {string|null} savings - Nhãn tiết kiệm để highlight.
 * @property {boolean} popular - Đánh dấu gói nổi bật.
 * @property {string[]} features - Danh sách quyền lợi chính.
 * @property {string} cta - Nội dung nút CTA.
 * @property {string} ctaLook - Biến thể style cho CTA button.
 * @property {PricingCheckoutMeta} checkout - Metadata phục vụ trang checkout.
 */

/**
 * @typedef {Object} FeatureComparisonCell
 * @property {'check'|'cross'|'label'} type - Kiểu hiển thị của ô so sánh.
 * @property {string} [text] - Nội dung text khi `type === 'label'`.
 * @property {boolean} [highlight] - Có nhấn mạnh ô Premium hay không.
 */

/**
 * @typedef {Object} FeatureComparisonRow
 * @property {string} feature - Tính năng đem ra so sánh.
 * @property {FeatureComparisonCell} free - Giá trị cột Free.
 * @property {FeatureComparisonCell} premium - Giá trị cột Premium.
 */

/**
 * Tính metadata checkout cho một gói Premium từ tổng giá và thời lượng.
 *
 * @param {Object} params - Dữ liệu đầu vào của gói.
 * @param {number} params.months - Số tháng quy đổi.
 * @param {number} params.days - Số ngày hiệu lực.
 * @param {number} params.totalPrice - Tổng giá thanh toán.
 * @param {string} params.packageTitle - Tên gói ở checkout.
 * @param {string} params.tagline - Tagline ngắn hiển thị cho người dùng.
 * @returns {PricingCheckoutMeta} Dữ liệu checkout đã tính giá/tháng và tiết kiệm.
 */
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

/**
 * Chuẩn hóa dữ liệu cấu hình gói sang shape frontend dùng chung.
 *
 * @param {Object} params - Cấu hình gói đầu vào.
 * @param {string} params.id - ID gói FE.
 * @param {string} params.name - Tên hiển thị gói.
 * @param {string} params.duration - Mô tả thời lượng.
 * @param {number} params.totalPrice - Tổng tiền thanh toán.
 * @param {number} params.months - Số tháng quy đổi.
 * @param {number} params.days - Số ngày hiệu lực.
 * @param {string} params.packageTitle - Tên gói ở checkout.
 * @param {string} params.tagline - Mô tả ngắn cho checkout.
 * @param {boolean} params.popular - Đánh dấu gói phổ biến.
 * @param {string[]} params.features - Danh sách tính năng.
 * @param {string} params.cta - Nội dung nút CTA.
 * @param {string} params.ctaLook - Kiểu nút CTA.
 * @returns {PricingPlan} Gói FE hoàn chỉnh để render tại UI.
 */
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

/** @type {PricingPlan[]} Danh sách gói Premium mặc định cho landing/checkout. */
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

/** @type {FeatureComparisonRow[]} Ma trận so sánh quyền lợi Free và Premium. */
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

/**
 * Thông tin chuyển khoản tĩnh dùng cho luồng thanh toán thủ công/fallback.
 *
 * @type {{bank: string, accountNumber: string, accountName: string, transferPrefix: string}}
 */
export const PAYMENT_INFO = {
  bank: "MB Bank",
  accountNumber: "0001137880784",
  accountName: "MAC TU HAU",
  transferPrefix: "SEHUB",
};

/**
 * Format số tiền sang VND theo locale Việt Nam.
 *
 * @param {number} amount - Số tiền gốc.
 * @returns {string} Chuỗi tiền tệ dạng `48.000 đ`.
 *
 * @example
 * formatVnd(200000); // => '200.000 đ'
 */
export function formatVnd(amount) {
  return `${amount.toLocaleString("vi-VN")} đ`;
}

/**
 * Lấy gói Premium theo ID FE, fallback về gói học kỳ nếu không khớp.
 *
 * Đây là fallback business-friendly vì gói `semester` đang là lựa chọn mặc định/phổ biến nhất.
 *
 * @param {string} planId - ID gói cần tìm.
 * @returns {PricingPlan} Gói tương ứng hoặc gói fallback.
 */
export function getPlanById(planId) {
  return PRICING_PLANS.find((plan) => plan.id === planId) ?? PRICING_PLANS[1];
}

/**
 * Tạo nội dung chuyển khoản theo chuẩn prefix của SEHUB.
 *
 * @param {string} planId - ID gói FE để nhúng vào mã chuyển khoản.
 * @returns {string} Nội dung chuyển khoản dạng `SEHUB_{PLAN}_{YYYYMMDD}`.
 */
export function buildTransferContent(planId) {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `${PAYMENT_INFO.transferPrefix}_${planId.toUpperCase()}_${stamp}`;
}

/**
 * Tạo transaction ID giả lập cho luồng xác nhận thanh toán trên FE/mock.
 *
 * @returns {string} Mã transaction có dấu ngày theo định dạng nội bộ.
 */
export function buildTransactionId() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `SEH_${stamp}_CONFIRMED`;
}

/**
 * Tạm dừng bất đồng bộ trong mock/polling flows.
 *
 * @param {number} ms - Thời gian chờ tính bằng mili giây.
 * @returns {Promise<void>} Promise hoàn thành sau khi hết thời gian chờ.
 */
function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Chuyển FE plan ID sang backend plan code.
 *
 * @param {string} planId - ID gói frontend.
 * @returns {string|null} Mã gói backend hoặc `null` nếu không ánh xạ được.
 */
export function resolvePlanCode(planId) {
  return resolvePlanCodeFromFeId(planId);
}

/**
 * Nạp danh sách gói Premium cho UI.
 *
 * Thứ tự ưu tiên: mock mode -> API live -> fallback cấu hình tĩnh.
 *
 * @returns {Promise<PricingPlan[]>} Danh sách gói đã sẵn sàng cho frontend.
 */
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

/**
 * Nạp một gói cụ thể theo ID, có fallback về dữ liệu tĩnh.
 *
 * @param {string} planId - ID gói cần truy vấn.
 * @returns {Promise<PricingPlan>} Gói Premium tương ứng.
 */
export async function loadPlanById(planId) {
  const plans = await loadPricingPlans();
  return plans.find((plan) => plan.id === planId) ?? getPlanById(planId);
}

/**
 * Tải thông tin xem trước voucher theo rank cho một gói Premium.
 *
 * @param {string} planId - ID gói FE.
 * @returns {Promise<Object|null>} DTO đã map sang FE hoặc `null` nếu không có dữ liệu.
 */
export async function loadRankVoucherPreview(planId) {
  if (USE_MOCK) {
    return null;
  }

  const planCode = resolvePlanCode(planId);
  if (!planCode) {
    return null;
  }

  try {
    const dto = await premiumApi.getRankVoucherPreview({ planCode });
    return mapRankVoucherPreviewDto(dto);
  } catch {
    return null;
  }
}

/**
 * Tạo đơn checkout mới trên backend cho gói đã chọn.
 *
 * @param {string} planId - ID gói FE.
 * @returns {Promise<Object|null>} Đơn hàng đã map cho FE, hoặc `null` ở mock/plan không hợp lệ.
 *
 * @throws {Error} Ném lỗi từ tầng API nếu backend trả lỗi tạo đơn.
 */
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

/**
 * Lấy trạng thái đơn checkout hiện tại.
 *
 * @param {string|number|null} orderId - ID đơn hàng backend/PayOS.
 * @param {{markWaitingConfirmation?: boolean}} [options={}] - Tùy chọn đánh dấu đơn đang chờ xác nhận.
 * @returns {Promise<Object|null>} Đơn hàng đã map cho FE hoặc `null` nếu không thể tải.
 *
 * @throws {Error} Ném lỗi từ tầng API nếu request thất bại.
 */
export async function getCheckoutOrder(orderId, { markWaitingConfirmation = false } = {}) {
  if (USE_MOCK || !orderId) {
    return null;
  }

  const dto = await premiumApi.getOrder(orderId, { markWaitingConfirmation });
  return mapPaymentOrderDto(dto);
}

/**
 * Lấy trạng thái subscription Premium hiện tại của user.
 *
 * @returns {Promise<Object>} Trạng thái gói Premium dùng cho banner/quyền hoàn tiền.
 */
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

/**
 * Gửi yêu cầu hoàn tiền cho giao dịch Premium đã thanh toán.
 *
 * @param {{orderCode: string, reason: string}} params - Thông tin yêu cầu hoàn tiền.
 * @param {string} params.orderCode - Mã đơn hàng đã thanh toán.
 * @param {string} params.reason - Lý do người dùng cung cấp.
 * @returns {Promise<Object>} Kết quả FE-friendly phục vụ toast/banner sau khi gửi.
 *
 * @throws {Error} Ném lỗi từ tầng API nếu backend từ chối yêu cầu.
 */
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

/**
 * Poll trạng thái kích hoạt Premium sau thanh toán cho tới khi thành công hoặc hết số lần thử.
 *
 * Phục vụ luồng checkout cần chờ webhook/backend cập nhật đơn sang `Paid`.
 *
 * @param {string|number|null} orderId - ID đơn hàng cần theo dõi.
 * @param {{maxAttempts?: number, intervalMs?: number, markWaitingConfirmation?: boolean}} [options={}] - Tùy chọn polling.
 * @returns {Promise<boolean>} `true` nếu đơn đã `Paid`, ngược lại `false`.
 */
export async function pollPremiumActivation(
  orderId,
  { maxAttempts = 40, intervalMs = 3000, markWaitingConfirmation = false } = {},
) {
  if (USE_MOCK) {
    return false;
  }

  if (!orderId) {
    return false;
  }

  let markedWaiting = false;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const shouldMark = markWaitingConfirmation && !markedWaiting;
      const order = await getCheckoutOrder(orderId, { markWaitingConfirmation: shouldMark });
      if (order?.status === "Paid") {
        return true;
      }
      if (shouldMark && order?.status === "WaitingConfirmation") {
        markedWaiting = true;
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
