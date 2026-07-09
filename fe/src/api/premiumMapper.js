/**
 * @fileoverview Mapper chuyển DTO Premium/payment/subscription từ API sang model dùng ở UI.
 *
 * @module api/premiumMapper
 */

/**
 * Map FE plan id sang plan code backend.
 *
 * @constant {Record<string, string>}
 * @readonly
 */
export const PLAN_CODE_BY_FE_ID = {
  trial: "1m",
  semester: "8m",
  full: "4y",
};

/**
 * Map plan code backend sang FE plan id.
 *
 * @constant {Record<string, string>}
 * @readonly
 */
export const FE_ID_BY_PLAN_CODE = {
  "1m": "trial",
  "8m": "semester",
  "4y": "full",
};

/**
 * @typedef {Object} PremiumPlanTemplate
 * @property {string} id - Định danh plan phía FE (`trial`, `semester`, `full`...).
 * @property {string} name - Tên plan hiển thị.
 * @property {string} duration - Mô tả thời lượng hiển thị trên card giá.
 * @property {Object} checkout - Metadata trang checkout tĩnh.
 * @property {string} checkout.packageTitle - Tên gói trên trang thanh toán.
 * @property {string} checkout.tagline - Dòng mô tả ngắn dùng ở checkout.
 */

/**
 * @typedef {Object} PremiumPlanDto
 * @property {string} code - Mã plan backend (`1m`, `8m`, `4y`...).
 * @property {number} [durationDays] - Thời lượng gói tính theo ngày.
 * @property {number} [priceVnd] - Giá gói cuối cùng tính theo VND.
 */

/**
 * @typedef {Object} PremiumCheckoutInfo
 * @property {string} packageTitle - Tên gói hiển thị tại màn checkout.
 * @property {string} tagline - Mô tả ngắn của gói.
 * @property {number} days - Thời lượng quy đổi theo ngày.
 * @property {number} originalPrice - Giá gốc ước tính trước ưu đãi.
 * @property {number} monthlyPrice - Giá trung bình mỗi tháng.
 * @property {number} months - Số tháng quy đổi từ `days`.
 * @property {number} totalPrice - Tổng tiền thanh toán.
 * @property {number} savingsAmount - Số tiền tiết kiệm so với giá gốc.
 * @property {string | null} savingsLabel - Nhãn tiết kiệm dạng `Tiết kiệm X%`.
 */

/**
 * @typedef {Object} PaymentOrderViewModel
 * @property {string | number | undefined} orderId - ID đơn hàng nội bộ.
 * @property {string | number | null} payOsOrderCode - Mã đơn PayOS.
 * @property {number} amount - Số tiền thực trả.
 * @property {number} originalAmount - Số tiền gốc trước giảm giá.
 * @property {number | null} discountPercent - Phần trăm giảm giá nếu có.
 * @property {string | null} discountSource - Nguồn giảm giá (voucher/rank...).
 * @property {string | undefined} status - Trạng thái đơn hàng.
 * @property {string | null} qrUrl - Link QR thanh toán.
 * @property {string | null} checkoutUrl - Link redirect thanh toán ngoài.
 * @property {string | null} expiredAt - Thời điểm hết hạn thanh toán.
 * @property {string | null} planCode - Mã plan đã mua.
 * @property {string | null} paidAt - Thời điểm thanh toán thành công.
 * @property {string | null} verifiedAt - Thời điểm hệ thống xác minh thanh toán.
 * @property {string | null} verificationMethod - Cơ chế xác minh thanh toán.
 * @property {string | null} message - Thông điệp nghiệp vụ từ backend.
 */

/**
 * @typedef {Object} RankVoucherPreview
 * @property {string | null} levelName - Tên hạng thành viên hiện tại.
 * @property {number} points - Điểm tích lũy hiện có.
 * @property {number | null} discountPercent - Phần trăm ưu đãi theo hạng.
 * @property {boolean} eligible - Có đủ điều kiện áp dụng hay không.
 * @property {string} message - Thông điệp mô tả điều kiện/ưu đãi.
 */

/**
 * @typedef {Object} SubscriptionStatus
 * @property {boolean} isActive - Trạng thái Premium còn hiệu lực.
 * @property {string | null} expiresAt - Hạn dùng Premium.
 * @property {string | null} planName - Tên gói đã kích hoạt.
 * @property {string | null} latestPaidOrderCode - Mã đơn thanh toán gần nhất.
 * @property {string | null} lastPaidAt - Thời điểm thanh toán gần nhất.
 * @property {boolean} canRequestRefund - Có thể gửi yêu cầu hoàn tiền hay không.
 * @property {boolean} hasPendingRefundRequest - Đang có yêu cầu hoàn tiền chờ xử lý hay không.
 */

/**
 * Chuẩn hóa FE plan id sang mã plan backend để gọi API.
 *
 * @param {string} fePlanId - Plan id đang dùng ở router/UI.
 * @returns {string} Plan code backend tương ứng; fallback về input nếu không map được.
 *
 * @example
 * resolvePlanCodeFromFeId("trial"); // '1m'
 */
export function resolvePlanCodeFromFeId(fePlanId) {
  return PLAN_CODE_BY_FE_ID[fePlanId] ?? fePlanId;
}

/**
 * Chuẩn hóa plan code backend về plan id dùng trong giao diện FE.
 *
 * @param {string | number | null | undefined} planCode - Mã plan backend.
 * @returns {string | number | null | undefined} FE plan id nếu có mapping; ngược lại trả nguyên giá trị.
 *
 * @example
 * resolveFePlanIdFromCode("8m"); // 'semester'
 */
export function resolveFePlanIdFromCode(planCode) {
  return FE_ID_BY_PLAN_CODE[String(planCode ?? "").toLowerCase()] ?? planCode;
}

/**
 * Dựng metadata checkout từ payload API sau khi đã suy ra thời lượng/giá trung bình.
 *
 * @param {Object} params - Thành phần giá gói sau normalize.
 * @param {number} params.months - Số tháng quy đổi.
 * @param {number} params.days - Số ngày sử dụng.
 * @param {number} params.monthlyPrice - Giá trung bình theo tháng.
 * @param {number} params.totalPrice - Tổng tiền thanh toán.
 * @param {string} params.packageTitle - Tên gói dùng ở checkout.
 * @param {string} params.tagline - Mô tả ngắn cho checkout.
 * @returns {PremiumCheckoutInfo} Dữ liệu checkout hoàn chỉnh cho card/trang thanh toán.
 */
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

/**
 * Map một DTO gói Premium từ backend sang model card giá FE.
 *
 * Kết hợp dữ liệu động từ API và template tĩnh để giữ nguyên text/visual hiện có.
 *
 * @param {PremiumPlanDto} dto - Gói từ API backend.
 * @param {PremiumPlanTemplate[]} templates - Danh sách template plan tĩnh phía FE.
 * @returns {PremiumPlanTemplate & { planCode: string, price: string, savings: string | null, checkout: PremiumCheckoutInfo }} Plan dùng cho UI.
 *
 * @example
 * const plan = mapApiPlanToFePlan(apiPlan, PRICING_PLANS);
 */
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

/**
 * Map toàn bộ danh sách plan API sang model FE.
 *
 * @param {PremiumPlanDto[] | null | undefined} apiPlans - Danh sách gói từ backend.
 * @param {PremiumPlanTemplate[]} templates - Template plan tĩnh.
 * @returns {Array<ReturnType<typeof mapApiPlanToFePlan>>} Danh sách plan đã map.
 */
export function mapApiPlansToFePlans(apiPlans, templates) {
  return (apiPlans ?? []).map((dto) => mapApiPlanToFePlan(dto, templates));
}

/**
 * Map DTO đơn hàng thanh toán Premium sang model FE ổn định cho checkout/return page.
 *
 * @param {Record<string, any>} dto - Dữ liệu đơn hàng từ backend/PayOS bridge.
 * @returns {PaymentOrderViewModel} Thông tin đơn hàng đã normalize.
 */
export function mapPaymentOrderDto(dto) {
  const originalAmount = Number(dto.originalAmount ?? dto.amount ?? 0);
  const finalAmount = Number(dto.amount ?? 0);

  return {
    orderId: dto.orderId,
    payOsOrderCode: dto.payOsOrderCode,
    amount: finalAmount,
    originalAmount,
    discountPercent: dto.discountPercent ?? null,
    discountSource: dto.discountSource ?? null,
    status: dto.status,
    qrUrl: dto.qrUrl ?? null,
    checkoutUrl: dto.checkoutUrl ?? null,
    expiredAt: dto.expiredAt ?? null,
    planCode: dto.planCode ?? null,
    paidAt: dto.paidAt ?? null,
    verifiedAt: dto.verifiedAt ?? null,
    verificationMethod: dto.verificationMethod ?? null,
    message: dto.message ?? null,
  };
}

/**
 * Map preview voucher theo rank thành model UI.
 *
 * @param {Record<string, any>} dto - DTO preview do backend trả về.
 * @returns {RankVoucherPreview} Dữ liệu ưu đãi theo hạng cho màn checkout.
 */
export function mapRankVoucherPreviewDto(dto) {
  return {
    levelName: dto.levelName ?? null,
    points: dto.points ?? 0,
    discountPercent: dto.discountPercent ?? null,
    eligible: Boolean(dto.eligible),
    message: dto.message ?? "",
  };
}

/**
 * Map trạng thái subscription Premium từ backend sang model auth/UI.
 *
 * @param {Record<string, any>} dto - DTO subscription status.
 * @returns {SubscriptionStatus} Trạng thái Premium đã chuẩn hóa.
 */
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
