import * as adminApi from "@/api/adminApi";
import {
  mapAdminVoucherListItem,
  mapAdminVoucherStats,
} from "@/api/adminMapper";

function formatDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleDateString("vi-VN");
}

export function mapPartnerVoucherItem(dto) {
  return {
    id: dto.id ?? dto.Id,
    code: dto.code ?? dto.Code ?? "",
    typeCode: dto.typeCode ?? dto.TypeCode ?? "",
    typeLabel: dto.typeLabel ?? dto.TypeLabel ?? "",
    discountPercent: dto.discountPercent ?? dto.DiscountPercent ?? 0,
    status: String(dto.status ?? dto.Status ?? "").toLowerCase(),
    assignedUserId: dto.assignedUserId ?? dto.AssignedUserId ?? null,
    assignedUsername: dto.assignedUsername ?? dto.AssignedUsername ?? null,
    assignedDisplayName: dto.assignedDisplayName ?? dto.AssignedDisplayName ?? null,
    paymentOrderId: dto.paymentOrderId ?? dto.PaymentOrderId ?? null,
    importedAt: formatDateTime(dto.importedAt ?? dto.ImportedAt),
    assignedAt: formatDateTime(dto.assignedAt ?? dto.AssignedAt),
    expiresAt: formatDate(dto.expiresAt ?? dto.ExpiresAt),
  };
}

export function mapPartnerInventoryStats(dto = {}) {
  return {
    availableFtes20: dto.availableFtes20 ?? dto.AvailableFtes20 ?? 0,
    availableFtes100: dto.availableFtes100 ?? dto.AvailableFtes100 ?? 0,
    availableTotal: dto.availableTotal ?? dto.AvailableTotal ?? 0,
    assigned: dto.assigned ?? dto.Assigned ?? 0,
    revoked: dto.revoked ?? dto.Revoked ?? 0,
    total: dto.total ?? dto.Total ?? 0,
  };
}

export async function loadAdminVoucherGrants(params = {}) {
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

export async function loadPartnerVoucherInventory(params = {}) {
  const page = await adminApi.listPartnerVouchers({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 50,
    status: params.status,
    typeCode: params.typeCode,
    search: params.search,
  });

  return {
    items: (page.items ?? []).map(mapPartnerVoucherItem),
    stats: mapPartnerInventoryStats(page.stats ?? {}),
    totalCount: page.totalCount ?? 0,
  };
}

export async function loadPartnerVoucherTypes() {
  const rows = await adminApi.listPartnerVoucherTypes();
  return (rows ?? []).map((row) => ({
    code: row.code ?? row.Code,
    label: row.label ?? row.Label,
    discountPercent: row.discountPercent ?? row.DiscountPercent ?? 0,
    validityDays: row.validityDays ?? row.ValidityDays ?? 0,
    partnerName: row.partnerName ?? row.PartnerName ?? "FTES",
  }));
}

export async function importPartnerVoucherCodes({ typeCode, codes }) {
  try {
    const result = await adminApi.importPartnerVouchers({ typeCode, codes });
    return {
      ok: true,
      imported: result.imported ?? result.Imported ?? 0,
      duplicatesSkipped: result.duplicatesSkipped ?? result.DuplicatesSkipped ?? 0,
      invalid: result.invalid ?? result.Invalid ?? 0,
      remainingAvailable: result.remainingAvailable ?? result.RemainingAvailable ?? 0,
      typeCode: result.typeCode ?? result.TypeCode ?? typeCode,
    };
  } catch (error) {
    return { ok: false, message: error.message ?? "Không import được mã FTES." };
  }
}

export async function loadStudentsForVoucherGrant() {
  const page = await adminApi.listUsers({ pageSize: 100, search: "" });
  const students = (page.items ?? []).filter(
    (user) => String(user.role).toLowerCase() === "student",
  );

  return students.map((user) => ({
    id: user.id,
    apiId: user.id,
    username: user.username,
    displayName: user.displayName,
    plan: user.isPremium ? "Premium" : "Free",
    status: user.isBanned ? "banned" : "active",
    activeVouchers: 0,
  }));
}

/**
 * Cấp rank-discount (SEHUB Premium %) — API thật.
 */
export async function grantVoucherToUser(payload) {
  const page = await adminApi.listUsers({ search: payload.username, pageSize: 10 });
  const resolvedUser = (page.items ?? []).find(
    (item) => item.username?.toLowerCase() === payload.username.toLowerCase(),
  );
  if (!resolvedUser?.id) {
    return { ok: false, message: "Không tìm thấy tài khoản sinh viên." };
  }

  const reason = payload.reason?.trim() ?? "";
  if (reason.length < 10) {
    return { ok: false, message: "Lý do cấp voucher phải có ít nhất 10 ký tự." };
  }

  if (!payload.levelId || !payload.discountPercent || !payload.expiryDays) {
    return { ok: false, message: "Thiếu level, % giảm giá hoặc số ngày hiệu lực." };
  }

  try {
    await adminApi.grantVoucher({
      userId: resolvedUser.id,
      levelId: payload.levelId,
      discountPercent: payload.discountPercent,
      expiryDays: payload.expiryDays,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message ?? "Không thể cấp voucher." };
  }
}

/**
 * Cấp bù FTES từ kho Available.
 */
export async function assignPartnerVoucherToUser({ userId, typeCode }) {
  try {
    await adminApi.assignPartnerVoucher({ userId, typeCode });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message ?? "Không cấp được mã FTES." };
  }
}

export async function revokeVoucherGrant(id) {
  try {
    await adminApi.revokeVoucher(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message ?? "Không thể thu hồi voucher." };
  }
}

export async function revokePartnerVoucherGrant(id) {
  try {
    await adminApi.revokePartnerVoucher(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message ?? "Không thể thu hồi mã FTES." };
  }
}
