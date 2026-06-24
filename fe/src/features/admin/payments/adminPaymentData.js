import {
  formatVnd,
  getPlanById,
  MAX_BONUS_TOKEN_BALANCE,
  PREMIUM_DAILY_TOKEN_QUOTA,
  validateManualTokenGrant,
  canAdminConfirmPayment,
} from "@/features/admin/payments/adminPaymentPolicy";
import {
  activatePremiumFromPayment,
  revokePremiumFromPayment,
} from "@/features/admin/users/adminUserStore";
import { grantVoucherFromPayment } from "@/features/admin/vouchers/adminVoucherData";
import * as adminApi from "@/api/adminApi";
import { mapAdminPaymentListItem } from "@/api/adminMapper";
import { isValidGuid } from "@/features/feed/postUtils";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/** @typedef {'pending_payment' | 'webhook_ok' | 'activated' | 'failed' | 'refunded'} PaymentStatus */
/** @typedef {'payos_confirm' | 'manual_token' | 'manual_premium' | 'payos_refund'} AuditActionType */

/** @type {Array<{ id: string, payosOrderId: string, username: string, planId: string, amount: number, transferContent: string, status: PaymentStatus, webhookAt: string | null, activatedAt: string | null, refundedAt?: string | null, refundReason?: string, createdAt: string, note?: string }>} */
let paymentsStore = [
  {
    id: "pay-001",
    payosOrderId: "PAYOS-8821",
    username: "minhanh_dev",
    planId: "semester",
    amount: 200000,
    transferContent: "SEHUB_SEMESTER_20260601",
    status: "activated",
    webhookAt: "2026-06-01T09:12:00",
    activatedAt: "2026-06-01T10:05:00",
    createdAt: "2026-06-01T08:40:00",
  },
  {
    id: "pay-002",
    payosOrderId: "PAYOS-8894",
    username: "anhcoding12345",
    planId: "trial",
    amount: 48000,
    transferContent: "SEHUB_TRIAL_20260604",
    status: "webhook_ok",
    webhookAt: "2026-06-04T14:22:00",
    activatedAt: null,
    createdAt: "2026-06-04T13:10:00",
    note: "Webhook PayOS đã về — chờ Admin xác nhận bước 5",
  },
  {
    id: "pay-003",
    payosOrderId: "PAYOS-8901",
    username: "lee_dev_99",
    planId: "trial",
    amount: 48000,
    transferContent: "SEHUB_TRIAL_20260604B",
    status: "webhook_ok",
    webhookAt: "2026-06-04T17:05:00",
    activatedAt: null,
    createdAt: "2026-06-04T16:00:00",
    note: "Đã chuyển khoản đủ — webhook PayOS OK",
  },
  {
    id: "pay-004",
    payosOrderId: "PAYOS-8710",
    username: "fpt_student_22",
    planId: "full",
    amount: 650000,
    transferContent: "SEHUB_FULL_20260520",
    status: "refunded",
    webhookAt: "2026-05-20T11:00:00",
    activatedAt: "2026-05-20T11:30:00",
    refundedAt: "2026-05-21T09:45:00",
    refundReason: "Callback PayOS trùng đơn — thu hồi Premium & hoàn 650.000 đ qua ngân hàng",
    createdAt: "2026-05-20T10:15:00",
    note: "Hoàn tiền do lỗi callback trùng đơn",
  },
  {
    id: "pay-005",
    payosOrderId: "PAYOS-8655",
    username: "minhanh_dev",
    planId: "trial",
    amount: 48000,
    transferContent: "SEHUB_TRIAL_20260515",
    status: "failed",
    webhookAt: null,
    activatedAt: null,
    createdAt: "2026-05-15T20:00:00",
    note: "Hết hạn 15 phút — SV chưa chuyển khoản",
  },
];

/** @type {Record<string, number>} */
let bonusTokenByUser = {
  minhanh_dev: 120,
  anhcoding12345: 0,
  lee_dev_99: 480,
};

/** @type {Array<{ id: string, at: string, admin: string, action: AuditActionType, username: string, detail: string, meta?: Record<string, unknown> }>} */
let auditStore = [
  {
    id: "aud-001",
    at: "2026-06-01T10:05:00",
    admin: "admin_sehub",
    action: "payos_confirm",
    username: "minhanh_dev",
    detail: "Xác nhận PayOS #PAYOS-8821 — Gói 8 tháng — kích hoạt Premium 240 ngày",
    meta: { paymentId: "pay-001", planId: "semester", amount: 200000 },
  },
  {
    id: "aud-002",
    at: "2026-05-28T15:00:00",
    admin: "admin_sehub",
    action: "manual_token",
    username: "minhanh_dev",
    detail: "Cộng 120 token thưởng — Khuyến mãi sự kiện SEHub",
    meta: { amount: 120, bonusAfter: 120 },
  },
  {
    id: "aud-003",
    at: "2026-05-25T09:30:00",
    admin: "admin_sehub",
    action: "manual_token",
    username: "lee_dev_99",
    detail: "Cộng 480 token thưởng — Bồi hoàn lỗi AI ngày 24/05",
    meta: { amount: 480, bonusAfter: 480 },
  },
  {
    id: "aud-004",
    at: "2026-05-21T09:45:00",
    admin: "admin_sehub",
    action: "payos_refund",
    username: "fpt_student_22",
    detail: "Hoàn tiền PayOS #PAYOS-8710 — 650.000 đ — Callback trùng đơn",
    meta: { paymentId: "pay-004", amount: 650000 },
  },
];

export function getAdminPayments() {
  return paymentsStore.map(enrichPayment);
}

export function getRefundedPayments() {
  return paymentsStore
    .filter((p) => p.status === "refunded")
    .map(enrichPayment)
    .sort((a, b) => (a.refundedAt ?? "") < (b.refundedAt ?? "") ? 1 : -1);
}

export function getPaymentStatsFromList(list = []) {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthRevenue = list
    .filter(
      (p) =>
        (p.status === "activated" ||
          p.status === "refund_requested" ||
          p.status === "processing_refund" ||
          p.status === "refunded") &&
        String(p.createdAt ?? "").startsWith(monthPrefix),
    )
    .reduce((sum, p) => sum + p.amount, 0);
  const refundedList = list.filter((p) => p.status === "refunded");
  const refundedAmount = refundedList.reduce((sum, p) => sum + p.amount, 0);

  return {
    monthRevenue,
    monthRevenueLabel: formatVnd(monthRevenue),
    awaitingConfirm: list.filter((p) => p.status === "waiting_confirmation" || p.status === "webhook_ok").length,
    pendingPay: list.filter((p) => p.status === "pending_payment").length,
    pendingRefund: list.filter((p) => p.status === "refund_requested").length,
    refunded: refundedList.length,
    refundedAmountLabel: formatVnd(refundedAmount),
    failed: list.filter((p) => p.status === "failed").length,
    activated: list.filter((p) => p.status === "activated").length,
    totalOrders: list.length,
  };
}

export function getPaymentStats() {
  return getPaymentStatsFromList(paymentsStore.map(enrichPayment));
}

export function getRefundedPaymentsFromList(list = []) {
  return list
    .filter((p) => p.status === "refunded")
    .sort((a, b) => (a.refundedAt ?? a.createdAt ?? "") < (b.refundedAt ?? b.createdAt ?? "") ? 1 : -1);
}

export function getPendingRefundRequestsFromList(list = []) {
  return list
    .filter((p) => p.status === "refund_requested")
    .sort((a, b) => (a.refundRequestedAt ?? a.createdAt ?? "") < (b.refundRequestedAt ?? b.createdAt ?? "") ? 1 : -1);
}

function enrichPayment(payment) {
  const plan = getPlanById(payment.planId);
  return {
    ...payment,
    planLabel: payment.planName ?? plan.label,
    planDays: plan.days,
    voucher: payment.planName ? null : plan.voucher,
    amountLabel: formatVnd(payment.amount),
  };
}

export function getPaymentById(id) {
  const row = paymentsStore.find((p) => p.id === id);
  return row ? enrichPayment(row) : null;
}

export function getUserBonusTokens(username) {
  return bonusTokenByUser[username] ?? 0;
}

/** SV đã chuyển khoản đủ (webhook PayOS OK hoặc đã kích hoạt Premium) */
export function getPaidStudentsForTokenGrant() {
  const paidStatuses = new Set(["webhook_ok", "activated"]);
  /** @type {Map<string, object>} */
  const byUser = new Map();

  for (const payment of paymentsStore) {
    if (!paidStatuses.has(payment.status)) continue;
    const enriched = enrichPayment(payment);
    const existing = byUser.get(payment.username);
    if (!existing || payment.createdAt > existing.lastPaymentAt) {
      byUser.set(payment.username, {
        username: payment.username,
        bonusTokens: getUserBonusTokens(payment.username),
        lastPaymentAt: payment.createdAt,
        payosOrderId: payment.payosOrderId,
        planLabel: enriched.planLabel,
        amountLabel: enriched.amountLabel,
        paymentStatus: payment.status,
        paymentStatusLabel:
          payment.status === "activated" ? "Đã kích hoạt Premium" : "Đã CK — chờ xác nhận",
      });
    }
  }

  return [...byUser.values()].sort((a, b) =>
    a.username.localeCompare(b.username, "vi"),
  );
}

export function getPaymentAuditLog() {
  return [...auditStore].sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function confirmPayOsPayment(paymentId, adminUsername = "admin_sehub") {
  const index = paymentsStore.findIndex((p) => p.id === paymentId);
  if (index < 0) return { ok: false, message: "Không tìm thấy giao dịch." };

  const payment = paymentsStore[index];
  if (!canAdminConfirmPayment(payment.status)) {
    return {
      ok: false,
      message: "Chỉ xác nhận đơn đang chờ Admin xác nhận (WaitingConfirmation).",
    };
  }

  const plan = getPlanById(payment.planId);
  const now = new Date().toISOString();
  paymentsStore = paymentsStore.map((p, i) =>
    i === index
      ? { ...p, status: "activated", activatedAt: now }
      : p,
  );

  const entry = {
    id: `aud-${Date.now()}`,
    at: now,
    admin: adminUsername,
    action: "payos_confirm",
    username: payment.username,
    detail: `Xác nhận ${payment.payosOrderId} — ${plan.label} — Premium ${plan.days} ngày + quota ${PREMIUM_DAILY_TOKEN_QUOTA} token/ngày`,
    meta: {
      paymentId: payment.id,
      planId: payment.planId,
      amount: payment.amount,
      premiumDays: plan.days,
    },
  };
  auditStore = [entry, ...auditStore];

  const premiumResult = activatePremiumFromPayment(payment.username, {
    planId: payment.planId,
    adminUsername,
    payosOrderId: payment.payosOrderId,
  });

  const voucherResult = grantVoucherFromPayment({
    username: payment.username,
    planId: payment.planId,
    payosOrderId: payment.payosOrderId,
  });

  let message = premiumResult.ok
    ? premiumResult.message
    : `Đã xác nhận PayOS — lưu ý: ${premiumResult.message}`;
  if (voucherResult.ok) {
    message += ` · ${voucherResult.message}`;
  }

  return {
    ok: true,
    message,
    audit: entry,
  };
}

export function grantManualTokens({
  username,
  amount,
  reason,
  adminUsername = "admin_sehub",
}) {
  const trimmedUser = username?.trim();
  const trimmedReason = reason?.trim();

  if (!trimmedUser) return { ok: false, message: "Nhập username sinh viên." };
  if (!trimmedReason || trimmedReason.length < 10) {
    return { ok: false, message: "Lý do bắt buộc (tối thiểu 10 ký tự) — ghi audit." };
  }

  const currentBonus = getUserBonusTokens(trimmedUser);
  const validation = validateManualTokenGrant({ amount, currentBonus });
  if (!validation.ok) return validation;

  const grantAmount = validation.amount;
  const bonusAfter = currentBonus + grantAmount;
  bonusTokenByUser = { ...bonusTokenByUser, [trimmedUser]: bonusAfter };

  const now = new Date().toISOString();
  const entry = {
    id: `aud-${Date.now()}`,
    at: now,
    admin: adminUsername,
    action: "manual_token",
    username: trimmedUser,
    detail: `Cộng ${grantAmount} token thưởng — ${trimmedReason}`,
    meta: { amount: grantAmount, bonusBefore: currentBonus, bonusAfter },
  };
  auditStore = [entry, ...auditStore];

  return {
    ok: true,
    message: `Đã cộng ${grantAmount} token cho @${trimmedUser} (tổng thưởng: ${bonusAfter}/${MAX_BONUS_TOKEN_BALANCE}).`,
    audit: entry,
  };
}

export function processPayOsRefund({
  paymentId,
  reason,
  adminUsername = "admin_sehub",
}) {
  const trimmedReason = reason?.trim();
  if (!trimmedReason || trimmedReason.length < 10) {
    return {
      ok: false,
      message: "Lý do hoàn tiền bắt buộc (tối thiểu 10 ký tự) — ghi audit.",
    };
  }

  const index = paymentsStore.findIndex((p) => p.id === paymentId);
  if (index < 0) return { ok: false, message: "Không tìm thấy giao dịch." };

  const payment = paymentsStore[index];
  if (payment.status !== "activated") {
    return {
      ok: false,
      message: "Chỉ hoàn tiền đơn đã kích hoạt Premium (cột Thao tác → Hoàn tiền).",
    };
  }

  const plan = getPlanById(payment.planId);
  const now = new Date().toISOString();
  const refundReason = `${trimmedReason} — thu hồi Premium ${plan.label}`;

  paymentsStore = paymentsStore.map((p, i) =>
    i === index
      ? {
          ...p,
          status: "refunded",
          refundedAt: now,
          refundReason,
          note: `Hoàn ${formatVnd(payment.amount)} qua PayOS`,
        }
      : p,
  );

  const entry = {
    id: `aud-${Date.now()}`,
    at: now,
    admin: adminUsername,
    action: "payos_refund",
    username: payment.username,
    detail: `Hoàn tiền PayOS #${payment.payosOrderId} — ${formatVnd(payment.amount)} — ${trimmedReason}`,
    meta: {
      paymentId: payment.id,
      amount: payment.amount,
      planId: payment.planId,
      premiumRevoked: true,
    },
  };
  auditStore = [entry, ...auditStore];

  const revokeResult = revokePremiumFromPayment(payment.username);

  return {
    ok: true,
    message: revokeResult.ok
      ? `Đã hoàn ${formatVnd(payment.amount)} cho @${payment.username} (${payment.payosOrderId}). ${revokeResult.message}`
      : `Đã hoàn ${formatVnd(payment.amount)} cho @${payment.username} (${payment.payosOrderId}). Lưu ý: ${revokeResult.message}`,
    audit: entry,
  };
}

export async function loadAdminPayments() {
  if (USE_MOCK) {
    return getAdminPayments();
  }

  const page = await adminApi.listPayments({ page: 1, pageSize: 100 });
  return (page.items ?? []).map((item) => enrichPayment(mapAdminPaymentListItem(item)));
}

export async function approveRefundViaApi(paymentId, note = "") {
  const payment = await loadPaymentById(paymentId);
  if (!payment) {
    return { ok: false, message: "Không tìm thấy giao dịch." };
  }

  if (payment.status !== "refund_requested") {
    return { ok: false, message: "Đơn này không ở trạng thái chờ duyệt hoàn tiền." };
  }

  if (USE_MOCK || !isValidGuid(String(payment.apiId ?? payment.id ?? ""))) {
    return processPayOsRefund({
      paymentId,
      reason: payment.refundReason ?? note ?? "Admin duyệt yêu cầu hoàn tiền",
      adminUsername: "admin_sehub",
    });
  }

  try {
    const result = await adminApi.approvePaymentRefund(payment.apiId ?? payment.id, { note });
    return {
      ok: true,
      message: result.message ?? "Đã duyệt hoàn tiền.",
    };
  } catch (error) {
    return { ok: false, message: error?.message ?? "Không duyệt được hoàn tiền." };
  }
}

export async function completeRefundViaApi(paymentId, note = "") {
  const payment = await loadPaymentById(paymentId);
  if (!payment) {
    return { ok: false, message: "Không tìm thấy giao dịch." };
  }

  if (payment.status !== "processing_refund") {
    return { ok: false, message: "Đơn này không ở trạng thái đang xử lý hoàn tiền." };
  }

  if (USE_MOCK || !isValidGuid(String(payment.apiId ?? payment.id ?? ""))) {
    return processPayOsRefund({
      paymentId,
      reason: note || payment.refundReason || "Admin xác nhận đã chuyển khoản hoàn tiền",
      adminUsername: "admin_sehub",
    });
  }

  try {
    const result = await adminApi.completePaymentRefund(payment.apiId ?? payment.id, { note });
    return {
      ok: true,
      message: result.message ?? "Đã xác nhận hoàn tiền thành công.",
    };
  } catch (error) {
    return { ok: false, message: error?.message ?? "Không xác nhận được hoàn tiền." };
  }
}

export async function loadPaymentById(id) {
  const mockPayment = getPaymentById(id);
  if (USE_MOCK || !isValidGuid(String(id ?? ""))) {
    return mockPayment;
  }

  try {
    const dto = await adminApi.getPayment(id);
    return enrichPayment(mapAdminPaymentListItem(dto));
  } catch {
    return mockPayment;
  }
}

export async function confirmPayOsPaymentViaApi(paymentId, adminUsername = "admin_sehub", note = "") {
  const payment = getPaymentById(paymentId) ?? (await loadPaymentById(paymentId));
  if (!payment) {
    return { ok: false, message: "Không tìm thấy giao dịch." };
  }

  if (USE_MOCK || !isValidGuid(String(payment.apiId ?? payment.id ?? ""))) {
    return confirmPayOsPayment(paymentId, adminUsername);
  }

  try {
    await adminApi.confirmPayment(payment.apiId ?? payment.id, {
      note: note || "Admin xác nhận thủ công sau đối chiếu ngân hàng",
    });
    return {
      ok: true,
      message: `Đã xác nhận ${payment.payosOrderId} — Premium đã kích hoạt cho @${payment.username}.`,
    };
  } catch (error) {
    return { ok: false, message: error?.message ?? "Không xác nhận được thanh toán." };
  }
}
