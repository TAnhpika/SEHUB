import { apiRequest } from "./httpClient";

export function getPlans() {
  return apiRequest("/api/v1/premium/plans", { auth: false });
}

export function createOrder({ planCode }) {
  return apiRequest("/api/v1/premium/orders", {
    method: "POST",
    body: { planCode },
  });
}

export function getOrder(orderId, { markWaitingConfirmation = false } = {}) {
  const query = markWaitingConfirmation ? "?markWaitingConfirmation=true" : "";
  return apiRequest(`/api/v1/premium/orders/${orderId}${query}`);
}

export function getSubscription() {
  return apiRequest("/api/v1/premium/subscription");
}

export function requestRefund({ orderCode, reason }) {
  return apiRequest("/api/v1/premium/refund", {
    method: "POST",
    body: { orderCode, reason },
  });
}

/** Development only — simulates PayOS webhook after mock checkout. */
export function confirmDevPayment(orderId) {
  return apiRequest(`/api/v1/premium/orders/${orderId}/dev/confirm`, {
    method: "POST",
  });
}
