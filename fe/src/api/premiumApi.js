import { apiRequest, apiFormRequest } from "./httpClient";

export function getPlans() {
  return apiRequest("/api/v1/premium/plans", { auth: false });
}

export function createOrder({ planCode, applyRankDiscount = true }) {
  return apiRequest("/api/v1/premium/orders", {
    method: "POST",
    body: { planCode, applyRankDiscount },
  });
}

export function getRankVoucherPreview({ planCode } = {}) {
  const query = planCode ? `?planCode=${encodeURIComponent(planCode)}` : "";
  return apiRequest(`/api/v1/premium/rank-voucher${query}`);
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

export function getRefundForm(orderCode) {
  const params = new URLSearchParams({ orderCode });
  return apiRequest(`/api/v1/premium/refund/form?${params.toString()}`);
}

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

/** Development only — simulates PayOS webhook after mock checkout. */
export function confirmDevPayment(orderId) {
  return apiRequest(`/api/v1/premium/orders/${orderId}/dev/confirm`, {
    method: "POST",
  });
}
