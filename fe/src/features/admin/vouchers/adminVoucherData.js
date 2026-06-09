import {
  findAdminUserByUsername,
  getAdminUsers,
} from "@/features/admin/users/adminUserStore";
import {
  buildVoucherCode,
  getVoucherTemplate,
} from "@/features/admin/vouchers/adminVoucherPolicy";

/** @typedef {'active' | 'used' | 'expired' | 'revoked'} VoucherGrantStatus */
/** @typedef {'manual' | 'payment' | 'rank'} VoucherGrantSource */

/**
 * @type {Array<{
 *   id: string;
 *   userId: string;
 *   username: string;
 *   templateId: string;
 *   code: string;
 *   status: VoucherGrantStatus;
 *   source: VoucherGrantSource;
 *   grantedBy: string;
 *   reason: string;
 *   grantedAt: string;
 *   expiresAt: string;
 *   usedAt?: string;
 * }>}
 */
let grantsStore = [
  {
    id: "vg1",
    userId: "u2",
    username: "minhanh_dev",
    templateId: "ftes_20",
    code: "FTES-20-A8K2M9",
    status: "active",
    source: "payment",
    grantedBy: "Hệ thống PayOS",
    reason: "Tự động sau kích hoạt gói Premium 2 học kỳ",
    grantedAt: "2026-06-01 14:22",
    expiresAt: "2026-08-30",
  },
  {
    id: "vg2",
    userId: "u6",
    username: "tran_van_a",
    templateId: "premium_10",
    code: "PREMIUM-10-B3F7Q1",
    status: "used",
    source: "rank",
    grantedBy: "Gamification engine",
    reason: "Đạt rank Gold — voucher giảm 10%",
    grantedAt: "2026-05-18 09:00",
    expiresAt: "2026-06-17",
    usedAt: "2026-05-20 11:05",
  },
  {
    id: "vg3",
    userId: "u14",
    username: "coding_ninja",
    templateId: "promo_event",
    code: "PROMO-EVENT-X9Z4P2",
    status: "active",
    source: "manual",
    grantedBy: "admin_sehub",
    reason: "Bù lỗi sự kiện SEHub Launch — tháng 5/2026",
    grantedAt: "2026-05-25 16:40",
    expiresAt: "2026-06-08",
  },
  {
    id: "vg4",
    userId: "u9",
    username: "fpt_student_22",
    templateId: "ftes_100",
    code: "FTES-100-H2N8V5",
    status: "active",
    source: "payment",
    grantedBy: "Hệ thống PayOS",
    reason: "Tự động sau kích hoạt gói Premium 4 năm",
    grantedAt: "2026-05-10 08:15",
    expiresAt: "2027-05-10",
  },
];

export function getAdminVoucherGrants() {
  return [...grantsStore].sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
}

export function getStudentsForVoucherGrant() {
  return getAdminUsers().filter((user) => user.role === "student").map((user) => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    plan: user.plan,
    status: user.status,
    activeVouchers: grantsStore.filter(
      (grant) => grant.username === user.username && grant.status === "active",
    ).length,
  }));
}

const PLAN_VOUCHER_TEMPLATE = {
  semester: "ftes_20",
  full: "ftes_100",
};

/**
 * Tự động cấp voucher đối tác sau Admin xác nhận PayOS (gói 2 HK / 4 năm).
 * @param {{ username: string, planId: string, payosOrderId?: string }} payload
 */
export function grantVoucherFromPayment({ username, planId, payosOrderId }) {
  const templateId = PLAN_VOUCHER_TEMPLATE[planId];
  if (!templateId) {
    return { ok: false, skipped: true, message: "Gói này không kèm voucher FTES." };
  }

  const user = findAdminUserByUsername(username);
  if (!user) {
    return { ok: false, message: "Không tìm thấy tài khoản sinh viên." };
  }

  const template = getVoucherTemplate(templateId);
  if (!template) {
    return { ok: false, message: "Loại voucher không hợp lệ." };
  }

  const hasDuplicate = grantsStore.some(
    (grant) =>
      grant.username === user.username &&
      grant.templateId === template.id &&
      grant.status === "active",
  );
  if (hasDuplicate) {
    return {
      ok: false,
      message: `@${user.username} đã có voucher "${template.label}" đang hiệu lực.`,
    };
  }

  const grantedAt = new Date();
  const expiresAt = new Date(grantedAt);
  expiresAt.setDate(expiresAt.getDate() + template.validityDays);

  const entry = {
    id: `vg-${Date.now()}`,
    userId: user.id,
    username: user.username,
    templateId: template.id,
    code: buildVoucherCode(template.id),
    status: "active",
    source: "payment",
    grantedBy: "Hệ thống PayOS",
    reason: `Tự động sau xác nhận PayOS ${payosOrderId ?? ""} — ${template.label}`.trim(),
    grantedAt: grantedAt.toISOString().slice(0, 16).replace("T", " "),
    expiresAt: expiresAt.toISOString().slice(0, 10),
  };

  grantsStore = [entry, ...grantsStore];
  return { ok: true, grant: entry, message: `Đã cấp ${template.label} cho @${user.username}.` };
}

export function getVoucherStats() {
  const grants = getAdminVoucherGrants();
  return {
    total: grants.length,
    active: grants.filter((g) => g.status === "active").length,
    used: grants.filter((g) => g.status === "used").length,
    expired: grants.filter((g) => g.status === "expired").length,
    revoked: grants.filter((g) => g.status === "revoked").length,
    manual: grants.filter((g) => g.source === "manual").length,
  };
}

/**
 * @param {{ username: string, templateId: string, reason: string, grantedBy: string }} payload
 */
export function grantVoucherToUser(payload) {
  const user = findAdminUserByUsername(payload.username);
  if (!user) {
    return { ok: false, message: "Không tìm thấy tài khoản sinh viên." };
  }
  if (user.role !== "student") {
    return { ok: false, message: "Chỉ cấp voucher cho tài khoản Sinh viên." };
  }
  if (user.status === "banned") {
    return { ok: false, message: "Tài khoản đang bị khóa — không thể cấp voucher." };
  }

  const template = getVoucherTemplate(payload.templateId);
  if (!template) {
    return { ok: false, message: "Loại voucher không hợp lệ." };
  }

  const reason = payload.reason?.trim() ?? "";
  if (reason.length < 10) {
    return { ok: false, message: "Lý do cấp voucher phải có ít nhất 10 ký tự." };
  }

  const hasDuplicate = grantsStore.some(
    (grant) =>
      grant.username === user.username &&
      grant.templateId === template.id &&
      grant.status === "active",
  );
  if (hasDuplicate) {
    return {
      ok: false,
      message: `SV @${user.username} đã có voucher "${template.label}" đang hiệu lực.`,
    };
  }

  const grantedAt = new Date();
  const expiresAt = new Date(grantedAt);
  expiresAt.setDate(expiresAt.getDate() + template.validityDays);

  const entry = {
    id: `vg-${Date.now()}`,
    userId: user.id,
    username: user.username,
    templateId: template.id,
    code: buildVoucherCode(template.id),
    status: "active",
    source: "manual",
    grantedBy: payload.grantedBy || "admin",
    reason,
    grantedAt: grantedAt.toISOString().slice(0, 16).replace("T", " "),
    expiresAt: expiresAt.toISOString().slice(0, 10),
  };

  grantsStore = [entry, ...grantsStore];
  return { ok: true, grant: entry };
}

export function revokeVoucherGrant(id, revokedBy = "admin") {
  const index = grantsStore.findIndex((grant) => grant.id === id);
  if (index === -1) {
    return { ok: false, message: "Không tìm thấy voucher." };
  }
  if (grantsStore[index].status !== "active") {
    return { ok: false, message: "Chỉ thu hồi voucher đang hiệu lực." };
  }

  grantsStore = grantsStore.map((grant, grantIndex) =>
    grantIndex === index
      ? {
          ...grant,
          status: "revoked",
          reason: `${grant.reason} · Thu hồi bởi ${revokedBy}`,
        }
      : grant,
  );

  return { ok: true };
}
