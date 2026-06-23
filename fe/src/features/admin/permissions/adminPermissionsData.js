import {
  findAdminUserByUsername,
  loadAdminUsers,
  patchAdminUserViaApi,
  patchUserRole,
} from "@/features/admin/users/adminUserStore";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/** Mock store phân quyền Moderator — Admin gán/thu hồi */

export const MOD_PERMISSIONS = [
  { id: "reports", label: "Xử lý báo cáo", desc: "Hàng chờ báo cáo cộng đồng" },
  { id: "content", label: "Duyệt bài viết", desc: "Post-moderation trước khi public" },
  { id: "exams", label: "Gửi đề thi", desc: "Đề thực hành chờ Admin duyệt" },
  { id: "submissions", label: "Chấm bài TH", desc: "Bài nộp GitHub sinh viên" },
  { id: "featured", label: "Gắn nổi bật", desc: "Đề / bài viết nổi bật feed" },
];

/** @type {Array<{ username: string, email: string, displayName: string, initial: string, grantedAt: string, grantedBy: string, reportsHandled: number, postsReviewed: number }>} */
let moderatorsStore = [
  {
    username: "mod_sehub",
    email: "moderator@sehubs.local",
    displayName: "Nguyễn Kiểm Duyệt",
    initial: "N",
    grantedAt: "2026-03-15",
    grantedBy: "admin_sehub",
    reportsHandled: 47,
    postsReviewed: 128,
  },
];

/** @type {Array<{ username: string, email: string, displayName: string, initial: string, rank: string, points: number, trustScore: number, note?: string }>} */
let candidatesStore = [
  {
    username: "anhcoding12345",
    email: "tngo28299@gmail.com",
    displayName: "Anhpika",
    initial: "A",
    rank: "Silver",
    points: 240,
    trustScore: 92,
    note: "Tích cực đóng góp bài viết PRF192",
  },
  {
    username: "minhanh_dev",
    email: "minhanh@fpt.edu.vn",
    displayName: "Trần Minh Anh",
    initial: "T",
    rank: "Gold",
    points: 920,
    trustScore: 88,
    note: "Đã nộp 4 bài TH, không vi phạm",
  },
  {
    username: "lee_dev_99",
    email: "lee@fpt.edu.vn",
    displayName: "Lê Hoàng",
    initial: "L",
    rank: "Bronze",
    points: 120,
    trustScore: 76,
  },
];

/** @type {Array<{ id: string, at: string, action: "grant" | "revoke", username: string, admin: string, detail: string }>} */
let auditStore = [
  {
    id: "perm-aud-001",
    at: "2026-03-15T10:00:00",
    action: "grant",
    username: "mod_sehub",
    admin: "admin_sehub",
    detail: "Gán quyền Moderator — đề xuất từ Admin",
  },
];

export function getModerators() {
  return [...moderatorsStore];
}

export function getModeratorCandidates() {
  const modUsernames = new Set(moderatorsStore.map((m) => m.username));
  return candidatesStore.filter((c) => !modUsernames.has(c.username));
}

export function getPermissionsStats() {
  return {
    activeMods: moderatorsStore.length,
    candidates: getModeratorCandidates().length,
    permissionCount: MOD_PERMISSIONS.length,
    totalHandled: moderatorsStore.reduce((s, m) => s + m.reportsHandled, 0),
  };
}

export function getPermissionsAudit() {
  return [...auditStore].sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function addModeratorDirect(
  { username, email, displayName },
  adminUsername = "admin_sehub",
  detail = "Gán trực tiếp từ chi tiết tài khoản",
) {
  if (moderatorsStore.some((m) => m.username === username)) {
    return { ok: false, message: "Tài khoản đã có quyền Mod." };
  }

  const initial = displayName?.charAt(0)?.toUpperCase() ?? username.charAt(0).toUpperCase();
  const entry = {
    username,
    email,
    displayName,
    initial,
    grantedAt: new Date().toISOString().slice(0, 10),
    grantedBy: adminUsername,
    reportsHandled: 0,
    postsReviewed: 0,
  };
  moderatorsStore = [...moderatorsStore, entry];
  candidatesStore = candidatesStore.filter((c) => c.username !== username);

  auditStore = [
    {
      id: `perm-aud-${Date.now()}`,
      at: new Date().toISOString(),
      action: "grant",
      username,
      admin: adminUsername,
      detail,
    },
    ...auditStore,
  ];

  patchUserRole(username, "moderator");

  return { ok: true, moderator: entry, message: `Đã gán Mod cho @${username}.` };
}

export function grantModerator(username, adminUsername = "admin_sehub") {
  const candidate = candidatesStore.find((c) => c.username === username);
  if (!candidate) {
    return { ok: false, message: "Không tìm thấy ứng viên." };
  }
  if (moderatorsStore.some((m) => m.username === username)) {
    return { ok: false, message: "Tài khoản đã có quyền Mod." };
  }

  const entry = {
    username: candidate.username,
    email: candidate.email,
    displayName: candidate.displayName,
    initial: candidate.initial,
    grantedAt: new Date().toISOString().slice(0, 10),
    grantedBy: adminUsername,
    reportsHandled: 0,
    postsReviewed: 0,
  };
  moderatorsStore = [...moderatorsStore, entry];
  candidatesStore = candidatesStore.filter((c) => c.username !== username);

  const audit = {
    id: `perm-aud-${Date.now()}`,
    at: new Date().toISOString(),
    action: "grant",
    username,
    admin: adminUsername,
    detail: `Gán quyền Moderator cho @${username}`,
  };
  auditStore = [audit, ...auditStore];

  patchUserRole(username, "moderator");

  return { ok: true, moderator: entry, message: `Đã gán Mod cho @${username}.` };
}

export function revokeModerator(username, adminUsername = "admin_sehub") {
  const mod = moderatorsStore.find((m) => m.username === username);
  if (!mod) return { ok: false, message: "Không tìm thấy Moderator." };

  moderatorsStore = moderatorsStore.filter((m) => m.username !== username);
  candidatesStore = [
    {
      username: mod.username,
      email: mod.email,
      displayName: mod.displayName,
      initial: mod.initial,
      rank: "Silver",
      points: 200,
      trustScore: 70,
      note: "Đã từng là Mod — có thể gán lại",
    },
    ...candidatesStore,
  ];

  const audit = {
    id: `perm-aud-${Date.now()}`,
    at: new Date().toISOString(),
    action: "revoke",
    username,
    admin: adminUsername,
    detail: `Thu hồi quyền Moderator @${username}`,
  };
  auditStore = [audit, ...auditStore];

  patchUserRole(username, "student");

  return { ok: true, message: `Đã thu hồi quyền Mod của @${username}.` };
}

function mapUserToModerator(user) {
  return {
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    initial: user.displayName?.charAt(0)?.toUpperCase() ?? user.username.charAt(0).toUpperCase(),
    grantedAt: user.joinedAt ?? "—",
    grantedBy: "Admin",
    reportsHandled: 0,
    postsReviewed: 0,
  };
}

function mapUserToCandidate(user) {
  return {
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    initial: user.displayName?.charAt(0)?.toUpperCase() ?? user.username.charAt(0).toUpperCase(),
    rank: user.levelName ?? "Bronze",
    points: user.points ?? 0,
    trustScore: 70,
    note: user.plan === "Premium" ? "Tài khoản Premium" : undefined,
  };
}

function pushPermissionAudit(entry) {
  auditStore = [{ ...entry, id: `perm-aud-${Date.now()}` }, ...auditStore];
}

export async function loadPermissionsData() {
  if (USE_MOCK) {
    return {
      moderators: getModerators(),
      candidates: getModeratorCandidates(),
      stats: getPermissionsStats(),
      audit: getPermissionsAudit(),
    };
  }

  const users = await loadAdminUsers();
  const moderators = users.filter((user) => user.role === "moderator").map(mapUserToModerator);
  const modUsernames = new Set(moderators.map((mod) => mod.username));
  const candidates = users
    .filter((user) => user.role === "student" && user.status === "active")
    .filter((user) => !modUsernames.has(user.username))
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 50)
    .map(mapUserToCandidate);

  return {
    moderators,
    candidates,
    stats: {
      activeMods: moderators.length,
      candidates: candidates.length,
      permissionCount: MOD_PERMISSIONS.length,
      totalHandled: 0,
    },
    audit: getPermissionsAudit(),
  };
}

export async function grantModeratorViaApi(username, adminUsername = "admin_sehub") {
  if (USE_MOCK) {
    return grantModerator(username, adminUsername);
  }

  const user = findAdminUserByUsername(username);
  if (!user) return { ok: false, message: "Không tìm thấy tài khoản." };
  if (user.role !== "student") {
    return { ok: false, message: "Chỉ gán Mod từ tài khoản Sinh viên." };
  }

  await patchAdminUserViaApi(user.id, { role: "Moderator" });
  patchUserRole(username, "moderator");
  pushPermissionAudit({
    at: new Date().toISOString(),
    action: "grant",
    username,
    admin: adminUsername,
    detail: `Gán quyền Moderator cho @${username}`,
  });

  return { ok: true, message: `Đã gán Mod cho @${username}.` };
}

export async function revokeModeratorViaApi(username, adminUsername = "admin_sehub") {
  if (USE_MOCK) {
    return revokeModerator(username, adminUsername);
  }

  const user = findAdminUserByUsername(username);
  if (!user) return { ok: false, message: "Không tìm thấy tài khoản." };
  if (user.role !== "moderator") {
    return { ok: false, message: "Tài khoản không phải Moderator." };
  }

  await patchAdminUserViaApi(user.id, { role: "Student" });
  patchUserRole(username, "student");
  pushPermissionAudit({
    at: new Date().toISOString(),
    action: "revoke",
    username,
    admin: adminUsername,
    detail: `Thu hồi quyền Moderator @${username}`,
  });

  return { ok: true, message: `Đã thu hồi quyền Mod của @${username}.` };
}
