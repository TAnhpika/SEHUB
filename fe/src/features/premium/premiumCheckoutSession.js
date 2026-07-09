/**
 * @fileoverview Quản lý session checkout Premium trong `sessionStorage`.
 *
 * Lưu `planId`, `orderId`, mã PayOS và URL checkout để khôi phục luồng thanh toán
 * sau redirect PayOS hoặc refresh trang success.
 *
 * @module features/premium/premiumCheckoutSession
 */

const STORAGE_KEY = "sehubs_premium_checkout";

/**
 * @typedef {Object} CheckoutSessionPayload
 * @property {string} planId - ID gói Premium (route param).
 * @property {string} orderId - ID đơn hàng hệ thống.
 * @property {string|null} [payOsOrderCode] - Mã đơn PayOS / nội dung chuyển khoản.
 * @property {string|null} [checkoutUrl] - URL trang thanh toán PayOS.
 */

/**
 * Lưu thông tin phiên checkout vào `sessionStorage`.
 *
 * Bỏ qua im lặng nếu thiếu `planId`/`orderId` hoặc quota/private mode.
 *
 * @param {CheckoutSessionPayload} session - Dữ liệu phiên checkout.
 * @returns {void}
 *
 * @example
 * saveCheckoutSession({ planId: 'semester', orderId: 'ord-123', payOsOrderCode: 'SEHUB-001' });
 */
export function saveCheckoutSession({ planId, orderId, payOsOrderCode, checkoutUrl }) {
  if (!planId || !orderId) return;

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        planId,
        orderId,
        payOsOrderCode: payOsOrderCode ?? null,
        checkoutUrl: checkoutUrl ?? null,
        savedAt: Date.now(),
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Đọc phiên checkout từ `sessionStorage`.
 *
 * @param {string} [planId] - Nếu truyền, chỉ trả về session khớp `planId`.
 * @returns {Object|null} Object đã parse, hoặc `null` nếu không có / không khớp.
 */
export function readCheckoutSession(planId) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (planId && parsed?.planId !== planId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Xóa phiên checkout khỏi `sessionStorage`.
 *
 * @returns {void}
 */
export function clearCheckoutSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Suy ra `orderId` theo thứ tự ưu tiên: state → query → session.
 *
 * @param {string} planId - ID gói để đối chiếu session.
 * @param {Object} [sources] - Nguồn orderId.
 * @param {string} [sources.stateOrderId] - Từ `location.state`.
 * @param {string} [sources.queryOrderId] - Từ query string.
 * @returns {string|null} Order ID hoặc `null`.
 */
export function resolveCheckoutOrderId(planId, { stateOrderId, queryOrderId } = {}) {
  if (stateOrderId) return stateOrderId;
  if (queryOrderId) return queryOrderId;

  const session = readCheckoutSession(planId);
  return session?.orderId ?? null;
}

/**
 * Suy ra mã giao dịch PayOS theo thứ tự: state → order DTO → session.
 *
 * @param {string} planId - ID gói (dùng khi đọc session).
 * @param {Object} sources - Nguồn transaction ID.
 * @param {string} [sources.stateTransactionId] - Từ navigation state.
 * @param {Object} [sources.session] - Session đã đọc sẵn.
 * @param {Object} [sources.order] - Đơn hàng từ API.
 * @returns {string|null} Mã giao dịch hoặc `null`.
 */
export function resolveCheckoutTransactionId(planId, { stateTransactionId, session, order }) {
  if (stateTransactionId) return stateTransactionId;
  if (order?.payOsOrderCode) return order.payOsOrderCode;
  if (session?.payOsOrderCode) return session.payOsOrderCode;
  return null;
}
