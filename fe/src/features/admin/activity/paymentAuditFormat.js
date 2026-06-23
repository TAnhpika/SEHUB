const PAYMENT_AUDIT_ACTION_LABEL = {
  order_created: "Tạo đơn thanh toán Premium",
  webhook_paid: "PayOS xác nhận thanh toán",
  webhook_duplicate_ignored: "Webhook PayOS trùng lặp — bỏ qua",
  waiting_confirmation: "Chờ admin xác nhận thanh toán",
  payment_expired: "Đơn thanh toán hết hạn",
  manualverification: "Admin xác nhận thanh toán thủ công",
  admin_confirm: "Admin xác nhận thanh toán",
  n8n_activate: "Kích hoạt Premium qua n8n",
  refund_request: "Yêu cầu hoàn tiền",
  refund_approved: "Admin duyệt hoàn tiền",
  refund_bank_details: "Gửi thông tin nhận hoàn tiền",
};

function normalizeAction(action) {
  return String(action ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isRawActionToken(value) {
  return typeof value === "string" && /^[A-Z][A-Z0-9_]*$/.test(value.trim());
}

function formatVnd(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
  return `${Math.round(value).toLocaleString("vi-VN")}đ`;
}

function readField(obj, ...keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
}

function parsePayload(payloadJson) {
  if (!payloadJson || typeof payloadJson !== "string") return null;
  try {
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

function formatOrderCreated(payload) {
  const planCode = readField(payload, "PlanCode", "planCode");
  const finalAmount = readField(payload, "FinalAmount", "finalAmount");
  const originalAmount = readField(payload, "OriginalAmount", "originalAmount");
  const discountPercent = readField(payload, "DiscountPercent", "discountPercent");
  const planLabel = planCode ? `gói ${planCode}` : "đơn Premium";
  const finalText = formatVnd(finalAmount);

  if (!finalText) return `Tạo ${planLabel}`;

  const discount = Number(discountPercent);
  const originalText = formatVnd(originalAmount);
  if (discount > 0 && originalText && originalText !== finalText) {
    return `Tạo ${planLabel} — ${finalText} (giảm ${discount}% từ ${originalText})`;
  }

  return `Tạo ${planLabel} — ${finalText}`;
}

function formatWebhookPaid(payload) {
  const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;
  const amount = formatVnd(readField(data, "Amount", "amount"));
  const orderCode = readField(data, "OrderCode", "orderCode");
  const description = readField(data, "Description", "description");
  const reference = readField(data, "Reference", "reference");

  const parts = [];
  if (amount) parts.push(amount);
  if (orderCode) parts.push(`mã đơn ${orderCode}`);
  if (description) parts.push(String(description));
  if (reference) parts.push(`mã tham chiếu ${reference}`);

  return parts.length > 0
    ? `Thanh toán thành công — ${parts.join(", ")}`
    : "Thanh toán thành công qua PayOS";
}

function formatFromPayload(action, payload) {
  const normalized = normalizeAction(action);

  switch (normalized) {
    case "order_created":
      return formatOrderCreated(payload);
    case "webhook_paid":
      return formatWebhookPaid(payload);
    case "webhook_duplicate_ignored":
      return `Webhook PayOS trùng lặp — bỏ qua (${formatWebhookPaid(payload).replace("Thanh toán thành công — ", "")})`;
    case "waiting_confirmation":
      return "Sinh viên báo đã chuyển khoản — chờ admin xác nhận";
    case "payment_expired":
      return "Đơn hết hạn xác nhận — chờ quá 24 giờ";
    case "manualverification":
    case "admin_confirm": {
      const note = readField(payload, "Note", "note");
      const prefix = PAYMENT_AUDIT_ACTION_LABEL[normalized] ?? "Admin xác nhận thanh toán";
      return note ? `${prefix} — ${note}` : prefix;
    }
    case "n8n_activate": {
      const parts = [];
      const username = readField(payload, "Username", "username");
      const packageName = readField(payload, "PackageName", "packageName");
      const amount = formatVnd(readField(payload, "Amount", "amount"));
      const orderCode = readField(payload, "OrderCode", "orderCode");
      if (username) parts.push(`@${username}`);
      if (packageName) parts.push(String(packageName));
      if (amount) parts.push(amount);
      if (orderCode) parts.push(`mã đơn ${orderCode}`);
      return parts.length > 0
        ? `Kích hoạt Premium qua n8n — ${parts.join(", ")}`
        : PAYMENT_AUDIT_ACTION_LABEL.n8n_activate;
    }
    case "refund_request": {
      const reason = readField(payload, "Reason", "reason");
      const orderCode = readField(payload, "OrderCode", "orderCode");
      if (reason && orderCode) return `Yêu cầu hoàn tiền đơn ${orderCode} — lý do: ${reason}`;
      if (reason) return `Yêu cầu hoàn tiền — lý do: ${reason}`;
      return PAYMENT_AUDIT_ACTION_LABEL.refund_request;
    }
    case "refund_approved": {
      const orderCode = readField(payload, "OrderCode", "orderCode");
      const note = readField(payload, "AdminNote", "adminNote");
      const days = readField(payload, "DurationDaysRevoked", "durationDaysRevoked");
      const parts = [];
      if (orderCode) parts.push(`đơn ${orderCode}`);
      if (Number(days) > 0) parts.push(`trừ ${days} ngày Premium`);
      if (note) parts.push(`ghi chú: ${note}`);
      return parts.length > 0
        ? `Admin duyệt hoàn tiền — ${parts.join(", ")}`
        : PAYMENT_AUDIT_ACTION_LABEL.refund_approved;
    }
    case "refund_bank_details": {
      const bankName = readField(payload, "BankName", "bankName");
      const accountNumber = readField(payload, "AccountNumber", "accountNumber");
      const accountName = readField(payload, "AccountName", "accountName");
      const orderCode = readField(payload, "OrderCode", "orderCode");
      const parts = [];
      if (bankName) parts.push(String(bankName));
      if (accountNumber) parts.push(`STK ${accountNumber}`);
      if (accountName) parts.push(String(accountName));
      const bankInfo = parts.join(" · ");
      if (orderCode && bankInfo) return `Gửi thông tin nhận hoàn tiền đơn ${orderCode} — ${bankInfo}`;
      return bankInfo || PAYMENT_AUDIT_ACTION_LABEL.refund_bank_details;
    }
    default:
      return null;
  }
}

export function formatPaymentAuditText(action, detail, payloadJson) {
  if (detail && detail !== "—" && !isRawActionToken(detail)) {
    return detail;
  }

  const payload = parsePayload(payloadJson);
  if (payload) {
    const formatted = formatFromPayload(action, payload);
    if (formatted) return formatted;
  }

  const normalized = normalizeAction(action);
  return PAYMENT_AUDIT_ACTION_LABEL[normalized] ?? String(action ?? "Thanh toán").replaceAll("_", " ");
}
