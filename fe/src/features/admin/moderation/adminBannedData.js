/** Mock store — tài liệu bị khóa (Mod tạm / Admin vĩnh viễn) */

import * as adminApi from "@/api/adminApi";
import { mapAdminBannedUser } from "@/api/adminMapper";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const BAN_TYPE_LABELS = {
  temporary: "Khóa tạm thời",
  permanent: "Khóa vĩnh viễn",
};

/** @type {Array<{
 *   id: string;
 *   username: string;
 *   displayName: string;
 *   email: string;
 *   reason: string;
 *   bannedBy: string;
 *   bannedAt: string;
 *   until: string | null;
 *   type: "temporary" | "permanent";
 *   days?: number;
 *   relatedReportId?: string;
 *   relatedPostId?: string;
 * }>} */
let bannedStore = [
  {
    id: "ban1",
    username: "spam_bot_01",
    displayName: "Spam Bot",
    email: "spam@fake.mail",
    reason: "Spam hàng loạt — quảng cáo link rút gọn",
    bannedBy: "Admin SEHub",
    bannedAt: "2026-06-04 10:00",
    until: "2026-06-11",
    type: "temporary",
    days: 7,
    relatedReportId: "r1",
    relatedPostId: "1042",
  },
  {
    id: "ban2",
    username: "toxic_user_99",
    displayName: "User Toxic",
    email: "toxic99@student.fpt.edu.vn",
    reason: "Quấy rối / xúc phạm trên bài viết cộng đồng",
    bannedBy: "Admin SEHub",
    bannedAt: "2026-06-04 08:00",
    until: "2026-06-11",
    type: "temporary",
    days: 7,
    relatedReportId: "r4",
    relatedPostId: "1011",
  },
  {
    id: "ban3",
    username: "seller_01",
    displayName: "Seller Premium",
    email: "seller01@gmail.com",
    reason: "Bán tài khoản Premium trái phép",
    bannedBy: "Nguyễn Kiểm Duyệt",
    bannedAt: "2026-06-02 17:00",
    until: "2026-06-09",
    type: "temporary",
    days: 7,
    relatedReportId: "r5",
    relatedPostId: "1055",
  },
  {
    id: "ban4",
    username: "news_fake",
    displayName: "Tin Giả",
    email: "fake.news@mail.com",
    reason: "Đăng thông tin sai lệch về lịch thi",
    bannedBy: "Admin SEHub",
    bannedAt: "2026-05-15 09:30",
    until: null,
    type: "permanent",
    relatedReportId: "r3",
    relatedPostId: "870",
  },
  {
    id: "ban5",
    username: "banned_temp_01",
    displayName: "Nguyễn Văn A",
    email: "banned_temp_01@fpt.edu.vn",
    reason: "Vi phạm nội quy cộng đồng — lần 2",
    bannedBy: "Nguyễn Kiểm Duyệt",
    bannedAt: "2026-05-28 14:20",
    until: "2026-06-04",
    type: "temporary",
    days: 7,
  },
  {
    id: "ban6",
    username: "promo_acc",
    displayName: "Promo Acc",
    email: "promo@spam.vn",
    reason: "Spam khóa học ngoài FPT — khóa 30 ngày",
    bannedBy: "Nguyễn Kiểm Duyệt",
    bannedAt: "2026-05-20 11:00",
    until: "2026-06-19",
    type: "temporary",
    days: 30,
    relatedReportId: "r6",
    relatedPostId: "1038",
  },
];

export function getAdminBannedUsers() {
  return [...bannedStore].sort((a, b) => b.bannedAt.localeCompare(a.bannedAt));
}

export function getAdminBannedUserById(id) {
  return bannedStore.find((b) => b.id === id) ?? null;
}

export function unbanUser(id) {
  const item = bannedStore.find((b) => b.id === id);
  if (!item) return null;
  bannedStore = bannedStore.filter((b) => b.id !== id);
  return item;
}

export function removeBannedByUsername(username) {
  const normalized = username?.trim().toLowerCase() ?? "";
  if (!normalized) return 0;
  const before = bannedStore.length;
  bannedStore = bannedStore.filter((b) => b.username.toLowerCase() !== normalized);
  return before - bannedStore.length;
}

export function registerPermanentBan({
  username,
  displayName,
  email,
  reason,
  bannedBy = "Admin SEHub",
  relatedReportId,
  relatedPostId,
}) {
  removeBannedByUsername(username);
  const entry = {
    id: `ban-${Date.now()}`,
    username,
    displayName: displayName ?? username,
    email: email ?? `${username}@unknown`,
    reason,
    bannedBy,
    bannedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    until: null,
    type: "permanent",
    relatedReportId,
    relatedPostId,
  };
  bannedStore = [entry, ...bannedStore];
  return entry;
}

export function addBannedUserFromReport(username, durationLabel, reportMeta) {
  const days = durationLabel.includes("vĩnh") ? null : 7;
  removeBannedByUsername(username);
  const entry = {
    id: `ban-${Date.now()}`,
    username,
    displayName: reportMeta?.displayName ?? username,
    email: reportMeta?.email ?? `${username}@unknown`,
    reason: reportMeta?.reason ?? "Vi phạm từ báo cáo cộng đồng",
    bannedBy: "Admin SEHub",
    bannedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    until: days
      ? new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
      : null,
    type: days ? "temporary" : "permanent",
    days: days ?? undefined,
    relatedReportId: reportMeta?.reportId,
    relatedPostId: reportMeta?.postId,
  };
  bannedStore = [entry, ...bannedStore];
  return entry;
}

export async function loadAdminBannedUsers() {
  if (USE_MOCK) {
    return getAdminBannedUsers();
  }

  const items = await adminApi.listBannedUsers();
  const apiBanned = (items ?? []).map(mapAdminBannedUser);
  bannedStore = apiBanned.map((row) => ({ ...row }));
  return apiBanned;
}
