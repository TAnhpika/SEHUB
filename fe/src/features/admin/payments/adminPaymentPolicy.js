/**
 * Nghiệp vụ Premium & Thanh toán — SEHUB_PhanTichNghiepVu.md §3.8
 * Free: 10 token/ngày · Premium: 1.000 token/ngày (reset 00:00)
 */

export const FREE_DAILY_TOKEN_QUOTA = 10;
export const PREMIUM_DAILY_TOKEN_QUOTA = 1000;

/**
 * Tổng token thưởng tích lũy tối đa / user (cộng thủ công).
 * Không vượt 1.000 — bằng hạn mức Premium/ngày (§2.3).
 */
export const MAX_BONUS_TOKEN_BALANCE = 1000;

/** @deprecated alias — dùng MAX_BONUS_TOKEN_BALANCE */
export const MAX_MANUAL_TOKEN_TOTAL = MAX_BONUS_TOKEN_BALANCE;

export function getRemainingTokenGrant(currentBonus = 0) {
  const balance = Math.max(0, Math.min(currentBonus, MAX_BONUS_TOKEN_BALANCE));
  return Math.max(0, MAX_BONUS_TOKEN_BALANCE - balance);
}

export const PREMIUM_PLANS = [
  {
    id: "trial",
    label: "1 tháng",
    durationLabel: "30 ngày",
    days: 30,
    amount: 49000,
    voucher: null,
  },
  {
    id: "semester",
    label: "8 tháng (1 học kỳ)",
    durationLabel: "240 ngày",
    days: 240,
    amount: 280000,
    voucher: "Voucher FTES 20%",
  },
  {
    id: "full",
    label: "4 năm (toàn khóa)",
    durationLabel: "1.460 ngày",
    days: 1460,
    amount: 960000,
    voucher: "Voucher FTES 100%",
  },
];

export const PAYMENT_STATUS_META = {
  pending_payment: {
    status: "pending",
    label: "Chờ thanh toán",
    desc: "Đơn PayOS đã tạo — SV chưa chuyển khoản",
  },
  webhook_ok: {
    status: "pending",
    label: "Chờ Admin xác nhận",
    desc: "Webhook PayOS OK — cần Admin kích hoạt Premium",
  },
  activated: {
    status: "success",
    label: "Đã kích hoạt",
    desc: "Admin đã xác nhận — Premium + token quota áp dụng",
  },
  failed: {
    status: "banned",
    label: "Thất bại",
    desc: "Hết hạn / lỗi callback PayOS",
  },
  refunded: {
    status: "refunded",
    label: "Đã hoàn tiền",
    desc: "Giao dịch đã hoàn — Premium thu hồi nếu có",
  },
};

export function formatVnd(amount) {
  return `${Number(amount).toLocaleString("vi-VN")} đ`;
}

export function getPlanById(planId) {
  return PREMIUM_PLANS.find((plan) => plan.id === planId) ?? PREMIUM_PLANS[0];
}

export function validateManualTokenGrant({ amount, currentBonus = 0 }) {
  const parsed = Number(amount);
  const balance = Math.max(0, Math.min(currentBonus, MAX_BONUS_TOKEN_BALANCE));
  const remaining = getRemainingTokenGrant(balance);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return { ok: false, message: "Số token phải là số nguyên dương." };
  }
  if (remaining === 0) {
    return {
      ok: false,
      message: `User đã đủ ${MAX_BONUS_TOKEN_BALANCE} token thưởng — không cộng thêm được.`,
    };
  }
  if (parsed > remaining) {
    return {
      ok: false,
      message: `Chỉ cộng thêm tối đa ${remaining} token (tổng không vượt ${MAX_BONUS_TOKEN_BALANCE}, hiện ${balance}).`,
    };
  }
  return { ok: true, amount: Math.floor(parsed), remainingAfter: balance + Math.floor(parsed) };
}

export function getTokenQuotaLabel(plan) {
  return plan === "Premium"
    ? `${PREMIUM_DAILY_TOKEN_QUOTA} token/ngày`
    : `${FREE_DAILY_TOKEN_QUOTA} token/ngày`;
}
