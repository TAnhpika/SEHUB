import * as adminApi from "@/api/adminApi";
import { mapPaymentAuditLogItem } from "@/api/adminMapper";
import { formatPaymentAuditText } from "@/features/admin/activity/paymentAuditFormat";
import { getMergedActivityLog } from "@/features/admin/adminMockData";
import { getPermissionsAudit } from "@/features/admin/permissions/adminPermissionsData";
import { getPaymentAuditLog } from "@/features/admin/payments/adminPaymentData";
import { getUserActionAudit } from "@/features/admin/users/adminUserStore";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const USER_AUDIT_ACTION_LABEL = {
  ban_permanent: "Khóa vĩnh viễn",
  unban: "Mở khóa",
  reset_password: "Reset mật khẩu",
  payos_premium: "Kích hoạt Premium PayOS",
  manual_premium: "Cấp Premium thủ công",
  manual_token: "Cộng token",
  grant_moderator: "Gán Moderator",
};

const PAYMENT_AUDIT_ACTION_LABEL = {
  order_created: "Tạo đơn thanh toán",
  webhook_paid: "PayOS xác nhận thanh toán",
  webhook_duplicate_ignored: "Webhook PayOS trùng",
  waiting_confirmation: "Chờ xác nhận thanh toán",
  payment_expired: "Đơn hết hạn",
  manualverification: "Admin xác nhận thủ công",
  admin_confirm: "Admin xác nhận thanh toán",
  n8n_activate: "Kích hoạt Premium (n8n)",
  refund_request: "Yêu cầu hoàn tiền",
  refund_approved: "Duyệt hoàn tiền",
  refund_bank_details: "Gửi thông tin hoàn tiền",
  payos_confirm: "Xác nhận PayOS",
  manual_token: "Cộng token thưởng",
  manual_premium: "Cấp Premium thủ công",
  payos_refund: "Hoàn tiền PayOS",
};

const PERM_AUDIT_ACTION_LABEL = {
  grant: "Gán Moderator",
  revoke: "Thu hồi Moderator",
};

function formatActivityTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16).replace("T", " ");
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapLocalUserAudit(row) {
  return {
    id: row.id,
    time: formatActivityTime(row.at),
    text: `${USER_AUDIT_ACTION_LABEL[row.action] ?? row.action} — @${row.username}: ${row.detail}`,
    type: "user",
    sortKey: row.at,
  };
}

function mapLocalPaymentAudit(row) {
  return {
    id: row.id,
    time: formatActivityTime(row.at),
    text: `${PAYMENT_AUDIT_ACTION_LABEL[row.action] ?? row.action} — @${row.username}: ${row.detail}`,
    type: "payment",
    sortKey: row.at,
  };
}

function mapApiPaymentAudit(row) {
  return {
    id: row.id,
    time: formatActivityTime(row.at),
    text: formatPaymentAuditText(row.action, row.detail, row.payloadJson),
    type: "payment",
    sortKey: row.at,
  };
}

function mapPermAudit(row) {
  return {
    id: row.id,
    time: formatActivityTime(row.at),
    text: `${PERM_AUDIT_ACTION_LABEL[row.action] ?? row.action} — @${row.username}: ${row.detail}`,
    type: "user",
    sortKey: row.at,
  };
}

export async function loadAdminActivityLog() {
  if (USE_MOCK) {
    return getMergedActivityLog();
  }

  const page = await adminApi.listPaymentAudit({ pageSize: 50 });
  const paymentEvents = (page.items ?? [])
    .map(mapPaymentAuditLogItem)
    .map(mapApiPaymentAudit);
  const userEvents = getUserActionAudit().map(mapLocalUserAudit);
  const permEvents = getPermissionsAudit().map(mapPermAudit);
  const localPaymentEvents = getPaymentAuditLog().map(mapLocalPaymentAudit);

  return [...userEvents, ...permEvents, ...paymentEvents, ...localPaymentEvents].sort((a, b) =>
    String(b.sortKey).localeCompare(String(a.sortKey)),
  );
}

export async function loadAdminActivityPreview(limit = 4) {
  const items = await loadAdminActivityLog();
  return items.slice(0, limit).map(({ id, time, text, type }) => ({ id, time, text, type }));
}
