import * as adminApi from "@/api/adminApi";
import {
  mapAdminVoucherListItem,
  mapAdminVoucherStats,
} from "@/api/adminMapper";
import {
  findAdminUserByUsername,
  getAdminUsers,
} from "@/features/admin/users/adminUserStore";
import {
  buildVoucherCode,
  getVoucherTemplate,
} from "@/features/admin/vouchers/adminVoucherPolicy";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

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

export async function loadAdminVoucherGrants(params = {}) {
  if (USE_MOCK) {
    return {
      items: getAdminVoucherGrants(),
      stats: getVoucherStats(),
      totalCount: grantsStore.length,
    };
  }

  const page = await adminApi.listVouchers({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    status: params.status,
    search: params.search,
  });

  return {
    items: (page.items ?? []).map(mapAdminVoucherListItem),
    stats: mapAdminVoucherStats(page.stats ?? {}),
    totalCount: page.totalCount ?? 0,
  };
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

export async function loadStudentsForVoucherGrant() {
  if (USE_MOCK) {
    return getStudentsForVoucherGrant();
  }

  const page = await adminApi.listUsers({ pageSize: 100, search: "" });
  const students = (page.items ?? []).filter((user) => String(user.role).toLowerCase() === "student");
  const voucherPage = await adminApi.listVouchers({ pageSize: 200 });

  const activeByUser = (voucherPage.items ?? []).reduce((acc, voucher) => {
    if (String(voucher.status).toLowerCase() !== "active") return acc;
    acc[voucher.userId] = (acc[voucher.userId] ?? 0) + 1;
    return acc;
  }, {});

  return students.map((user) => ({
    id: user.id,
    apiId: user.id,
    username: user.username,
    displayName: user.displayName,
    plan: user.isPremium ? "Premium" : "Free",
    status: user.isBanned ? "banned" : "active",
    activeVouchers: activeByUser[user.id] ?? 0,
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
  if (!USE_MOCK) {
    return { ok: false, skipped: true, message: "Voucher tự động do BE xử lý khi không dùng mock." };
  }

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
 * @param {{ username: string, templateId?: string, levelId?: string, discountPercent?: number, expiryDays?: number, reason: string, grantedBy: string }} payload
 */
export async function grantVoucherToUser(payload) {
  if (USE_MOCK) {
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

  const page = await adminApi.listUsers({ search: payload.username, pageSize: 10 });
  const resolvedUser = (page.items ?? []).find(
    (item) => item.username?.toLowerCase() === payload.username.toLowerCase(),
  );
  if (!resolvedUser?.id) {
    return { ok: false, message: "Không tìm thấy tài khoản sinh viên." };
  }

  const userId = resolvedUser.id;
  const reason = payload.reason?.trim() ?? "";
  if (reason.length < 10) {
    return { ok: false, message: "Lý do cấp voucher phải có ít nhất 10 ký tự." };
  }

  if (!payload.levelId || !payload.discountPercent || !payload.expiryDays) {
    return { ok: false, message: "Thiếu level, % giảm giá hoặc số ngày hiệu lực." };
  }

  try {
    await adminApi.grantVoucher({
      userId,
      levelId: payload.levelId,
      discountPercent: payload.discountPercent,
      expiryDays: payload.expiryDays,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message ?? "Không thể cấp voucher." };
  }
}

export async function revokeVoucherGrant(id, revokedBy = "admin") {
  if (USE_MOCK) {
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

  try {
    await adminApi.revokeVoucher(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message ?? "Không thể thu hồi voucher." };
  }
}
