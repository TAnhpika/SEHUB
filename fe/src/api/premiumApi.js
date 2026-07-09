/**
 * @fileoverview Tầng API Premium phía FE: bảng giá, checkout, subscription và hoàn tiền.
 *
 * Các hàm trong module này chỉ đóng vai trò đóng gói endpoint và payload, không map DTO.
 *
 * @module api/premiumApi
 */

import { apiRequest, apiFormRequest } from "./httpClient";

/**
 * @typedef {Object} CreatePremiumOrderInput
 * @property {string} planCode - Mã gói Premium backend (`1m`, `8m`, `4y`...).
 * @property {boolean} [applyRankDiscount=true] - Có áp dụng ưu đãi theo rank nếu đủ điều kiện hay không.
 */

/**
 * @typedef {Object} RankVoucherPreviewInput
 * @property {string} [planCode] - Mã gói để backend tính preview giảm giá tương ứng.
 */

/**
 * @typedef {Object} PremiumOrderQueryOptions
 * @property {boolean} [markWaitingConfirmation=false] - Gắn cờ backend đánh dấu đơn đang chờ xác nhận thanh toán.
 */

/**
 * @typedef {Object} RefundRequestInput
 * @property {string} orderCode - Mã đơn hàng cần yêu cầu hoàn tiền.
 * @property {string} reason - Lý do hoàn tiền do học viên nhập.
 */

/**
 * @typedef {Object} RefundBankDetailsInput
 * @property {string} orderCode - Mã đơn hàng refund.
 * @property {string} username - Username người gửi form.
 * @property {string} bankName - Tên ngân hàng nhận hoàn tiền.
 * @property {string} accountNumber - Số tài khoản nhận tiền.
 * @property {string} accountName - Chủ tài khoản.
 * @property {string} [note] - Ghi chú thêm cho yêu cầu hoàn tiền.
 * @property {File[]} [files=[]] - Ảnh/chứng từ đính kèm trong form-data.
 */

/**
 * Lấy bảng giá Premium công khai.
 *
 * Endpoint này không yêu cầu đăng nhập để landing/premium page đều dùng được.
 *
 * @returns {Promise<any>} Danh sách plan thô từ backend.
 *
 * @throws {Error} Khi request thất bại.
 *
 * @example
 * const plans = await getPlans();
 */
export function getPlans() {
  return apiRequest("/api/v1/premium/plans", { auth: false });
}

/**
 * Tạo đơn hàng thanh toán Premium.
 *
 * @param {CreatePremiumOrderInput} input - Dữ liệu chọn gói và áp dụng ưu đãi.
 * @returns {Promise<any>} DTO đơn hàng/checkout session từ backend.
 *
 * @throws {Error} Khi backend từ chối tạo order.
 *
 * @example
 * const order = await createOrder({ planCode: "8m" });
 */
export function createOrder({ planCode, applyRankDiscount = true }) {
  return apiRequest("/api/v1/premium/orders", {
    method: "POST",
    body: { planCode, applyRankDiscount },
  });
}

/**
 * Xem trước ưu đãi rank cho gói Premium đang chọn.
 *
 * @param {RankVoucherPreviewInput} [input={}] - Tùy chọn plan cần preview.
 * @returns {Promise<any>} DTO preview giảm giá theo hạng thành viên.
 *
 * @throws {Error} Khi request preview thất bại.
 */
export function getRankVoucherPreview({ planCode } = {}) {
  const query = planCode ? `?planCode=${encodeURIComponent(planCode)}` : "";
  return apiRequest(`/api/v1/premium/rank-voucher${query}`);
}

/**
 * Lấy thông tin một đơn hàng Premium theo ID.
 *
 * @param {string | number} orderId - ID đơn hàng nội bộ.
 * @param {PremiumOrderQueryOptions} [options={}] - Tùy chọn truy vấn trạng thái.
 * @returns {Promise<any>} DTO đơn hàng từ backend.
 *
 * @throws {Error} Khi không tìm thấy order hoặc request thất bại.
 *
 * @example
 * const order = await getOrder(orderId, { markWaitingConfirmation: true });
 */
export function getOrder(orderId, { markWaitingConfirmation = false } = {}) {
  const query = markWaitingConfirmation ? "?markWaitingConfirmation=true" : "";
  return apiRequest(`/api/v1/premium/orders/${orderId}${query}`);
}

/**
 * Lấy trạng thái subscription Premium hiện tại của người dùng đăng nhập.
 *
 * @returns {Promise<any>} DTO subscription status.
 *
 * @throws {Error} Khi request thất bại hoặc phiên đăng nhập hết hạn.
 */
export function getSubscription() {
  return apiRequest("/api/v1/premium/subscription");
}

/**
 * Gửi yêu cầu hoàn tiền cho một đơn Premium.
 *
 * @param {RefundRequestInput} input - Mã đơn và lý do hoàn tiền.
 * @returns {Promise<any>} Kết quả ghi nhận yêu cầu hoàn tiền.
 *
 * @throws {Error} Khi backend từ chối yêu cầu.
 */
export function requestRefund({ orderCode, reason }) {
  return apiRequest("/api/v1/premium/refund", {
    method: "POST",
    body: { orderCode, reason },
  });
}

/**
 * Lấy dữ liệu khởi tạo form hoàn tiền theo mã đơn hàng.
 *
 * @param {string} orderCode - Mã đơn cần mở form refund.
 * @returns {Promise<any>} Dữ liệu prefill/kiểm tra điều kiện từ backend.
 *
 * @throws {Error} Khi đơn không đủ điều kiện hoặc request thất bại.
 */
export function getRefundForm(orderCode) {
  const params = new URLSearchParams({ orderCode });
  return apiRequest(`/api/v1/premium/refund/form?${params.toString()}`);
}

/**
 * Gửi thông tin ngân hàng hoàn tiền kèm tệp đính kèm dưới dạng `multipart/form-data`.
 *
 * @param {RefundBankDetailsInput} input - Dữ liệu form hoàn tiền.
 * @returns {Promise<any>} Kết quả submit form ngân hàng.
 *
 * @throws {Error} Khi upload file hoặc request thất bại.
 *
 * @example
 * await submitRefundBankDetails({
 *   orderCode: "ORD-123",
 *   username: "anhpika",
 *   bankName: "Vietcombank",
 *   accountNumber: "0123456789",
 *   accountName: "NGUYEN VAN A",
 *   files: [],
 * });
 */
export function submitRefundBankDetails({
  orderCode,
  username,
  bankName,
  accountNumber,
  accountName,
  note,
  files = [],
}) {
  const formData = new FormData();
  formData.append("orderCode", orderCode);
  formData.append("username", username);
  formData.append("bankName", bankName);
  formData.append("accountNumber", accountNumber);
  formData.append("accountName", accountName);
  if (note) {
    formData.append("note", note);
  }

  for (const file of files) {
    formData.append("files", file);
  }

  return apiFormRequest("/api/v1/premium/refund/bank-details", {
    method: "POST",
    formData,
  });
}

/**
 * Development only — giả lập webhook PayOS sau mock checkout để test luồng success.
 *
 * @param {string | number} orderId - ID đơn hàng cần force confirm trong môi trường dev.
 * @returns {Promise<any>} Kết quả xác nhận thanh toán giả lập.
 *
 * @throws {Error} Khi endpoint dev không khả dụng hoặc request thất bại.
 */
export function confirmDevPayment(orderId) {
  return apiRequest(`/api/v1/premium/orders/${orderId}/dev/confirm`, {
    method: "POST",
  });
}
