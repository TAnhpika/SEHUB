import { apiRequest } from "./httpClient";

export function getPlans() {
  return apiRequest("/api/v1/premium/plans", { auth: false });
}

export function createOrder(body) {
  return apiRequest("/api/v1/premium/orders", {
    method: "POST",
    body,
  });
}

export function getOrder(orderId) {
  return apiRequest(`/api/v1/premium/orders/${orderId}`);
}

export function getSubscription() {
  return apiRequest("/api/v1/premium/subscription");
}
