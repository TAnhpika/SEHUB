const STORAGE_KEY = "sehubs_premium_checkout";

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

export function clearCheckoutSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function resolveCheckoutOrderId(planId, { stateOrderId, queryOrderId } = {}) {
  if (stateOrderId) return stateOrderId;
  if (queryOrderId) return queryOrderId;

  const session = readCheckoutSession(planId);
  return session?.orderId ?? null;
}

export function resolveCheckoutTransactionId(planId, { stateTransactionId, session, order }) {
  if (stateTransactionId) return stateTransactionId;
  if (order?.payOsOrderCode) return order.payOsOrderCode;
  if (session?.payOsOrderCode) return session.payOsOrderCode;
  return null;
}
