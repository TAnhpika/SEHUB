import * as adminApi from "@/api/adminApi";
import { mapAdminUserActivityItem, mapAdminUserDetail } from "@/api/adminMapper";
import { getUserBonusTokens } from "@/features/admin/payments/adminPaymentData";
import {
  FREE_DAILY_TOKEN_QUOTA,
  PREMIUM_DAILY_TOKEN_QUOTA,
} from "@/features/admin/payments/adminPaymentPolicy";
import { getAdminUserById, loadAdminUserById } from "@/features/admin/users/adminUserStore";
import { getUserGamification } from "@/features/admin/users/adminUserGamification";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const ADMIN_USER_ACTIVITY_PAGE_SIZE = 5;

export const USER_ROLE_LABEL = {
  student: "Sinh viên",
  moderator: "Moderator",
  admin: "Admin",
};

/**
 * @param {string | undefined} id
 */
export function getAdminUserDetail(id) {
  const user = getAdminUserById(id);
  if (!user) return null;

  return buildAdminUserDetailView(user);
}

function buildAdminUserDetailView(user) {
  const n = parseInt(String(user.id).replace(/\D/g, ""), 10) || 1;
  const gamification = getUserGamification(user);

  if (!USE_MOCK) {
    return {
      ...user,
      gamification,
      roleLabel: USER_ROLE_LABEL[user.role] ?? user.role,
      dailyTokenQuota:
        user.role === "student"
          ? user.plan === "Premium"
            ? PREMIUM_DAILY_TOKEN_QUOTA
            : FREE_DAILY_TOKEN_QUOTA
          : null,
      bonusTokens: user.role === "student" ? getUserBonusTokens(user.username) : null,
      aiTokens: user.role === "student" ? getUserBonusTokens(user.username) : null,
      emailVerified: true,
    };
  }

  return {
    ...user,
    gamification,
    roleLabel: USER_ROLE_LABEL[user.role] ?? user.role,
    phone: `09${String(80000000 + n * 137431).slice(0, 8)}`,
    lastLogin: "2026-06-04 10:32",
    lastLoginIp: "14.161.xxx.xx · HCM",
    major: "Công nghệ thông tin",
    campus: n % 2 === 0 ? "FPT Hà Nội" : "FPT HCM",
    semester: `Kỳ ${Math.min(8, (n % 8) + 1)} · 2026`,
    dailyTokenQuota:
      user.role === "student"
        ? user.plan === "Premium"
          ? PREMIUM_DAILY_TOKEN_QUOTA
          : FREE_DAILY_TOKEN_QUOTA
        : null,
    bonusTokens: user.role === "student" ? getUserBonusTokens(user.username) : null,
    aiTokens: user.role === "student" ? getUserBonusTokens(user.username) : null,
    postsCount: 4 + n * 3,
    examsCompleted: 2 + n * 2,
    documentsCount: 8 + n * 5,
    reportsFiled: n % 4,
    reportsAgainst: user.status === "banned" ? 2 + (n % 3) : n % 3 === 0 ? 1 : 0,
    premiumExpiresAt: user.plan === "Premium" ? "2026-08-15" : null,
    premiumSince: user.plan === "Premium" ? "2025-11-03" : null,
    banReason:
      user.status === "banned"
        ? user.username.includes("spam") || user.username.includes("scam")
          ? "Spam / tài khoản giả — khóa vĩnh viễn"
          : "Vi phạm điều khoản cộng đồng"
        : null,
    bannedAt: user.status === "banned" ? "2026-05-21 09:00" : null,
    oauthProvider: "Google",
    emailVerified: true,
    modSubjects: user.role === "moderator" ? "PRF192, SWP391, DBI202" : null,
  };
}

export async function loadAdminUserDetail(id) {
  const apiUser = await loadAdminUserById(id);
  const user = apiUser ?? getAdminUserById(id);
  if (!user) return null;

  if (!USE_MOCK && user.apiId) {
    try {
      const dto = await adminApi.getUser(user.apiId);
      const mapped = mapAdminUserDetail(dto);
      return {
        ...buildAdminUserDetailView({ ...user, ...mapped }),
        ...mapped,
        gamification: getUserGamification({ ...user, ...mapped }),
        roleLabel: USER_ROLE_LABEL[mapped.role] ?? mapped.role,
      };
    } catch {
      // fall through to store data
    }
  }

  const detail = buildAdminUserDetailView(user);

  return {
    ...detail,
    ...user,
    gamification: getUserGamification(user),
    roleLabel: USER_ROLE_LABEL[user.role] ?? user.role,
    premiumExpiresAt: user.premiumExpiresAt ?? detail.premiumExpiresAt,
    premiumSince: user.premiumSince ?? detail.premiumSince,
    banReason: user.banReason ?? detail.banReason,
    bannedAt: user.bannedAt ?? detail.bannedAt,
  };
}

/**
 * @param {string | undefined} userId
 */
export function getAdminUserActivities(userId) {
  if (!USE_MOCK) return [];

  const user = getAdminUserById(userId);
  if (!user) return [];

  const name = user.displayName;
  const u = user.username;

  return [
    { id: `${userId}-1`, time: "10:32", text: `Đăng nhập thành công · ${u}`, type: "user" },
    { id: `${userId}-2`, time: "09:50", text: `${name} nộp bài PRF192 — quiz tuần 6`, type: "exam" },
    { id: `${userId}-3`, time: "Hôm qua", text: `Tải tài liệu OOP_Java.pdf`, type: "exam" },
    { id: `${userId}-4`, time: "Hôm qua", text: user.plan === "Premium" ? "Gia hạn Premium — PayOS #8821" : "Xem đề thi MAE101", type: "payment" },
    { id: `${userId}-5`, time: "2 ngày trước", text: `Đăng bài viết #${1040 + parseInt(userId.replace(/\D/g, ""), 10)}`, type: "user" },
    { id: `${userId}-6`, time: "3 ngày trước", text: `Báo cáo bài viết #1038 — đã gửi`, type: "report" },
    { id: `${userId}-7`, time: "4 ngày trước", text: `Hoàn thành đề thi thử SWP391`, type: "exam" },
    { id: `${userId}-8`, time: "5 ngày trước", text: `Đổi mật khẩu qua email`, type: "user" },
    { id: `${userId}-9`, time: "6 ngày trước", text: `Nhận 500 token AI (khuyến mãi)`, type: "payment" },
    { id: `${userId}-10`, time: "1 tuần trước", text: `Đăng ký tài khoản · ${user.email}`, type: "user" },
  ];
}

export async function loadAdminUserActivities(userId) {
  if (USE_MOCK) {
    return getAdminUserActivities(userId);
  }

  const user = getAdminUserById(userId) ?? (await loadAdminUserById(userId));
  const apiId = user?.apiId ?? userId;
  if (!apiId) return [];

  try {
    const items = await adminApi.getUserActivity(apiId, { limit: 20 });
    return (items ?? []).map(mapAdminUserActivityItem);
  } catch {
    return [];
  }
}
