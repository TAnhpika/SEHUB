import { addModeratorDirect } from "@/features/admin/permissions/adminPermissionsData";
import { grantManualTokens } from "@/features/admin/payments/adminPaymentData";
import { getPlanById } from "@/features/admin/payments/adminPaymentPolicy";
import {
  registerPermanentBan,
  removeBannedByUsername,
} from "@/features/admin/moderation/adminBannedData";
import { ADMIN_USERS_SEED } from "@/features/admin/users/adminUsersSeed";
import * as adminApi from "@/api/adminApi";
import { mapAdminUserDetail, mapAdminUserListItem } from "@/api/adminMapper";
import { isValidGuid } from "@/features/feed/postUtils";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/** @type {typeof ADMIN_USERS_SEED} */
let usersStore = ADMIN_USERS_SEED.map((user) => ({ ...user }));

/** @type {Array<{ id: string, at: string, admin: string, action: string, userId: string, username: string, detail: string }>} */
let userAuditStore = [
  {
    id: "ua-001",
    at: "2026-06-01T10:05:00",
    admin: "admin_sehub",
    action: "manual_premium",
    userId: "u2",
    username: "minhanh_dev",
    detail: "Kích hoạt Premium gói 2 học kỳ sau PayOS #8821",
  },
];

function pushAudit(entry) {
  userAuditStore = [{ ...entry, id: `ua-${Date.now()}` }, ...userAuditStore];
}

export function getAdminUsers() {
  return [...usersStore];
}

export function getAdminUserById(id) {
  return usersStore.find((user) => user.id === id) ?? null;
}

export async function loadAdminUsers() {
  if (USE_MOCK) {
    return getAdminUsers();
  }

  const page = await adminApi.listUsers({ pageSize: 200 });
  const apiUsers = (page.items ?? []).map(mapAdminUserListItem);
  usersStore = apiUsers.map((user) => ({ ...user }));
  return apiUsers;
}

export async function loadAdminUserById(id) {
  const mockUser = getAdminUserById(id);
  if (USE_MOCK || !isValidGuid(String(id ?? ""))) {
    return mockUser;
  }

  try {
    const dto = await adminApi.getUser(id);
    return mapAdminUserDetail(dto);
  } catch {
    return mockUser;
  }
}

export async function patchAdminUserViaApi(id, body) {
  if (USE_MOCK || !isValidGuid(String(id ?? ""))) {
    return null;
  }

  const dto = await adminApi.patchUser(id, body);
  return mapAdminUserDetail(dto);
}

export function findAdminUserByUsername(username) {
  const normalized = username?.trim().replace(/^@/, "").toLowerCase() ?? "";
  if (!normalized) return null;
  return usersStore.find((user) => user.username.toLowerCase() === normalized) ?? null;
}

export function getAdminUserDetailUrl(username) {
  const user = findAdminUserByUsername(username);
  return user ? `/admin/users/${user.id}` : null;
}

export function getUserActionAudit() {
  return [...userAuditStore].sort((a, b) => (a.at < b.at ? 1 : -1));
}

function patchUser(userId, patch) {
  const index = usersStore.findIndex((user) => user.id === userId);
  if (index === -1) return null;
  const next = { ...usersStore[index], ...patch };
  usersStore = usersStore.map((user, i) => (i === index ? next : user));
  return next;
}

export function syncUserBanStatus(username, status) {
  const user = findAdminUserByUsername(username);
  if (!user) return null;
  return patchUser(user.id, { status });
}

export function patchUserRole(username, role) {
  const user = findAdminUserByUsername(username);
  if (!user) return null;
  if (role === "moderator") {
    return patchUser(user.id, { role: "moderator", plan: "—" });
  }
  if (role === "student") {
    return patchUser(user.id, { role: "student", plan: user.plan === "—" ? "Free" : user.plan });
  }
  return patchUser(user.id, { role });
}

export function revokePremiumFromPayment(username) {
  const user = findAdminUserByUsername(username);
  if (!user || user.role !== "student") {
    return { ok: false, message: "Không tìm thấy sinh viên để thu hồi Premium." };
  }
  patchUser(user.id, { plan: "Free" });
  return { ok: true, message: `Đã thu hồi Premium @${user.username}.` };
}

export function banUserPermanently(userId, { reason, adminUsername }) {
  const user = getAdminUserById(userId);
  if (!user) return { ok: false, message: "Không tìm thấy tài khoản." };
  if (user.role === "admin") return { ok: false, message: "Không thể khóa tài khoản Admin." };
  if (user.status === "banned") return { ok: false, message: "Tài khoản đã bị khóa." };

  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 10) {
    return { ok: false, message: "Lý do khóa phải có ít nhất 10 ký tự." };
  }

  patchUser(userId, { status: "banned" });
  registerPermanentBan({
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    reason: trimmed,
    bannedBy: adminUsername,
  });
  pushAudit({
    at: new Date().toISOString(),
    admin: adminUsername,
    action: "ban_permanent",
    userId,
    username: user.username,
    detail: trimmed,
  });

  return { ok: true, message: `Đã khóa vĩnh viễn @${user.username}.` };
}

/** Mở khóa nhanh từ trang Tài khoản bị khóa (không cần modal lý do). */
export function unbanFromBannedList(username, adminUsername = "admin_sehub") {
  const user = findAdminUserByUsername(username);
  if (user?.status === "banned") {
    patchUser(user.id, { status: "active" });
    pushAudit({
      at: new Date().toISOString(),
      admin: adminUsername,
      action: "unban",
      userId: user.id,
      username: user.username,
      detail: "Mở khóa từ danh sách tài khoản bị khóa",
    });
  }
  removeBannedByUsername(username);
  return user;
}

export function unbanUserAccount(userId, { reason, adminUsername }) {
  const user = getAdminUserById(userId);
  if (!user) return { ok: false, message: "Không tìm thấy tài khoản." };
  if (user.status !== "banned") return { ok: false, message: "Tài khoản không ở trạng thái khóa." };

  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 10) {
    return { ok: false, message: "Lý do mở khóa phải có ít nhất 10 ký tự." };
  }

  patchUser(userId, { status: "active" });
  removeBannedByUsername(user.username);
  pushAudit({
    at: new Date().toISOString(),
    admin: adminUsername,
    action: "unban",
    userId,
    username: user.username,
    detail: trimmed,
  });

  return { ok: true, message: `Đã mở khóa @${user.username}.` };
}

export function requestPasswordReset(userId, { adminUsername }) {
  const user = getAdminUserById(userId);
  if (!user) return { ok: false, message: "Không tìm thấy tài khoản." };

  pushAudit({
    at: new Date().toISOString(),
    admin: adminUsername,
    action: "reset_password",
    userId,
    username: user.username,
    detail: `Gửi email reset mật khẩu tới ${user.email}`,
  });

  return { ok: true, message: `Đã gửi link reset mật khẩu tới ${user.email}.` };
}

/** Bước 5 §3.8 — kích hoạt Premium sau Admin xác nhận PayOS */
export function activatePremiumFromPayment(username, { planId, adminUsername, payosOrderId }) {
  const user = findAdminUserByUsername(username);
  if (!user) return { ok: false, message: "Không tìm thấy tài khoản sinh viên." };
  if (user.role !== "student") {
    return { ok: false, message: "Chỉ kích hoạt Premium cho Sinh viên." };
  }

  const plan = getPlanById(planId);
  if (!plan) return { ok: false, message: "Gói Premium không hợp lệ." };

  patchUser(user.id, { plan: "Premium", status: "active" });
  pushAudit({
    at: new Date().toISOString(),
    admin: adminUsername,
    action: "payos_premium",
    userId: user.id,
    username: user.username,
    detail: `PayOS ${payosOrderId} — ${plan.label} (${plan.durationLabel})`,
  });

  return { ok: true, message: `Đã kích hoạt Premium (${plan.label}) cho @${user.username}.` };
}

export function grantPremiumManual(userId, { planId, reason, adminUsername }) {
  const user = getAdminUserById(userId);
  if (!user) return { ok: false, message: "Không tìm thấy tài khoản." };
  if (user.role !== "student") {
    return { ok: false, message: "Chỉ cấp Premium cho Sinh viên." };
  }

  const plan = getPlanById(planId);
  if (!plan) return { ok: false, message: "Gói Premium không hợp lệ." };

  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 10) {
    return { ok: false, message: "Lý do cấp Premium phải có ít nhất 10 ký tự." };
  }

  patchUser(userId, { plan: "Premium", status: "active" });
  pushAudit({
    at: new Date().toISOString(),
    admin: adminUsername,
    action: "manual_premium",
    userId,
    username: user.username,
    detail: `${plan.label} — ${trimmed}`,
  });

  return { ok: true, message: `Đã cấp Premium (${plan.label}) cho @${user.username}.` };
}

export async function grantTokenManual(userId, { amount, reason, adminUsername }) {
  const user = getAdminUserById(userId);
  if (!user) return { ok: false, message: "Không tìm thấy tài khoản." };
  if (user.role !== "student") {
    return { ok: false, message: "Chỉ cộng token cho Sinh viên." };
  }

  const result = await grantManualTokens({
    username: user.username,
    amount: Number(amount),
    reason: reason?.trim() ?? "",
    adminUsername,
    userId,
  });

  if (!result.ok) return result;

  if (USE_MOCK) {
    pushAudit({
      at: new Date().toISOString(),
      admin: adminUsername,
      action: "manual_token",
      userId,
      username: user.username,
      detail: `+${amount} token — ${reason?.trim()}`,
    });
  }

  return { ok: true, message: result.message ?? `Đã cộng token cho @${user.username}.` };
}

export async function promoteToModerator(userId, { reason, adminUsername }) {
  const user = getAdminUserById(userId);
  if (!user) return { ok: false, message: "Không tìm thấy tài khoản." };
  if (user.role !== "student") {
    return { ok: false, message: "Chỉ gán Mod từ tài khoản Sinh viên." };
  }

  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 10) {
    return { ok: false, message: "Lý do gán Mod phải có ít nhất 10 ký tự." };
  }

  if (!USE_MOCK && isValidGuid(String(userId ?? ""))) {
    try {
      await patchAdminUserViaApi(userId, { role: "Moderator" });
    } catch (error) {
      return { ok: false, message: error?.message ?? "Không gán được quyền Moderator." };
    }
  }

  const modResult = addModeratorDirect(
    {
      username: user.username,
      email: user.email,
      displayName: user.displayName,
    },
    adminUsername,
    trimmed,
  );

  if (!modResult.ok) return modResult;

  patchUser(userId, { role: "moderator", plan: "—" });
  pushAudit({
    at: new Date().toISOString(),
    admin: adminUsername,
    action: "grant_moderator",
    userId,
    username: user.username,
    detail: trimmed,
  });

  return { ok: true, message: modResult.message };
}

export async function banUserPermanentlyViaApi(userId, options) {
  if (USE_MOCK || !isValidGuid(String(userId ?? ""))) {
    return banUserPermanently(userId, options);
  }

  try {
    await patchAdminUserViaApi(userId, { isBanned: true, banType: "Permanent" });
    return banUserPermanently(userId, options);
  } catch (error) {
    return { ok: false, message: error?.message ?? "Không khóa được tài khoản." };
  }
}

export async function unbanUserAccountViaApi(userId, options) {
  if (USE_MOCK || !isValidGuid(String(userId ?? ""))) {
    return unbanUserAccount(userId, options);
  }

  try {
    await patchAdminUserViaApi(userId, { isBanned: false });
    return unbanUserAccount(userId, options);
  } catch (error) {
    return { ok: false, message: error?.message ?? "Không mở khóa được tài khoản." };
  }
}

export async function requestPasswordResetViaApi(userId, options) {
  if (USE_MOCK || !isValidGuid(String(userId ?? ""))) {
    return requestPasswordReset(userId, options);
  }

  try {
    await adminApi.resetUserPassword(userId);
    return requestPasswordReset(userId, options);
  } catch (error) {
    return { ok: false, message: error?.message ?? "Không gửi được email reset mật khẩu." };
  }
}

