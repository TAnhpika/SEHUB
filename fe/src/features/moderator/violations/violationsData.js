/**
 * @fileoverview Tầng dữ liệu và nghiệp vụ tài khoản vi phạm cho Moderator.
 *
 * Cung cấp hằng số UI (thời hạn khóa, trạng thái, hạng), tiện ích tính lock info,
 * lọc/phân trang danh sách và API warn/ban/unban.
 *
 * @module features/moderator/violations/violationsData
 * @see {@link module:features/moderator/violations/ViolatingAccountsPage}
 */

import * as adminApi from "@/api/adminApi";
import { mapViolatingUser, mapViolatingUserDetail } from "@/api/adminMapper";

/**
 * Số tài khoản vi phạm mỗi trang trên bảng Moderator.
 *
 * @constant {number}
 * @readonly
 * @default 10
 */
export const VIOLATIONS_PAGE_SIZE = 10;

/**
 * Tùy chọn thời hạn khóa tạm Moderator: 1 / 7 / 30 ngày với mức nghiêm trọng tăng dần (§2.4).
 *
 * @constant {ReadonlyArray<{ value: number, label: string, severity: string, severityLabel: string, description: string }>}
 * @readonly
 */
export const LOCK_DURATION_OPTIONS = [
  {
    value: 1,
    label: "1 ngày",
    severity: "mild",
    severityLabel: "Mức nhẹ",
    description: "Vi phạm lần đầu hoặc mức thấp",
  },
  {
    value: 7,
    label: "7 ngày",
    severity: "moderate",
    severityLabel: "Mức vừa",
    description: "Tái phạm hoặc vi phạm rõ ràng",
  },
  {
    value: 30,
    label: "30 ngày",
    severity: "severe",
    severityLabel: "Nghiêm trọng",
    description: "Vi phạm nặng, cần tách khỏi cộng đồng",
  },
];

/**
 * Tra cứu metadata mức nghiêm trọng khóa theo số ngày.
 *
 * @param {number} days - Số ngày khóa (1, 7, hoặc 30).
 * @returns {Object} Phần tử từ `LOCK_DURATION_OPTIONS`; mặc định mức 1 ngày nếu không khớp.
 */
export function getLockSeverityMeta(days) {
  return LOCK_DURATION_OPTIONS.find((option) => option.value === days) ?? LOCK_DURATION_OPTIONS[0];
}

/**
 * Map mức khóa (`mild` / `moderate` / `severe`) → tone `ModeratorBadge`.
 *
 * @param {string} severity - Khóa mức độ từ `LOCK_DURATION_OPTIONS`.
 * @returns {string} Tone badge: `warning`, `bronze`, hoặc `danger`.
 */
export function getLockSeverityTone(severity) {
  const tones = {
    mild: "warning",
    moderate: "bronze",
    severe: "danger",
  };
  return tones[severity] ?? "warning";
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDays(fromDate, days) {
  return new Date(fromDate.getTime() + days * MS_PER_DAY).toISOString();
}

function formatRemainingDuration(remainingMs) {
  if (remainingMs <= 0) return "0 giờ";

  const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (totalHours < 24) {
    return `${totalHours} giờ`;
  }

  const days = Math.ceil(totalHours / 24);
  return `${days} ngày`;
}

/**
 * @typedef {Object} AccountLockInfo
 * @property {boolean} isActive - Đang bị khóa tạm và chưa hết hạn.
 * @property {boolean} [expired] - Khóa đã hết hạn nhưng status vẫn `locked`.
 * @property {string|null} statusLabel - Nhãn badge trạng thái khóa.
 * @property {string|null} detailLabel - Dòng mô tả chi tiết (thời gian còn lại).
 * @property {number} [remainingMs] - Milliseconds còn lại đến `lockedUntil`.
 * @property {number} [lockDurationDays] - Số ngày khóa ban đầu.
 * @property {string} [severity] - Khóa mức độ: `mild`, `moderate`, `severe`.
 * @property {string} [severityLabel] - Nhãn tiếng Việt mức nghiêm trọng.
 */

/**
 * Tính thông tin khóa tạm hiện tại của tài khoản (active / expired / không khóa).
 *
 * @param {Object} account - Tài khoản vi phạm (`status`, `lockedUntil`, `lockDurationDays`).
 * @param {number} [now=Date.now()] - Timestamp tham chiếu (dùng cho test).
 * @returns {AccountLockInfo} Thông tin render badge và chi tiết khóa.
 *
 * @example
 * getAccountLockInfo({ status: 'locked', lockedUntil: '2026-07-15', lockDurationDays: 7 });
 */
export function getAccountLockInfo(account, now = Date.now()) {
  if (account.status !== "locked" || !account.lockedUntil) {
    return { isActive: false, statusLabel: null, detailLabel: null };
  }

  const untilMs = new Date(account.lockedUntil).getTime();
  const remainingMs = untilMs - now;

  if (remainingMs <= 0) {
    return {
      isActive: false,
      expired: true,
      statusLabel: "Hết hạn khóa",
      detailLabel: account.lockDurationDays
        ? `Đã hết thời hạn khóa ${account.lockDurationDays} ngày`
        : "Đã hết thời hạn khóa",
    };
  }

  const durationLabel = account.lockDurationDays
    ? `${account.lockDurationDays} ngày`
    : "tạm thời";
  const severity = getLockSeverityMeta(account.lockDurationDays);

  return {
    isActive: true,
    statusLabel: `Bị khóa · ${durationLabel}`,
    detailLabel: `Còn ${formatRemainingDuration(remainingMs)} (đến ${new Date(untilMs).toLocaleString("vi-VN")}) · ${severity.severityLabel}`,
    remainingMs,
    lockDurationDays: account.lockDurationDays,
    severity: severity.severity,
    severityLabel: severity.severityLabel,
  };
}

/**
 * Tạo object cập nhật state sau khi khóa tạm tài khoản.
 *
 * @param {number} days - Số ngày khóa (1, 7, hoặc 30).
 * @param {Date} [fromDate=new Date()] - Thời điểm bắt đầu khóa.
 * @returns {Object} Patch: `status: 'locked'`, `lockDurationDays`, `lockedUntil`, `lastAction`.
 */
export function buildLockUpdate(days, fromDate = new Date()) {
  return {
    status: "locked",
    lockDurationDays: days,
    lockedUntil: addDays(fromDate, days),
    lastAction: "lock",
    lastActionAt: fromDate.toISOString(),
  };
}

/**
 * Tạo object cập nhật state sau khi cảnh báo (warn) tài khoản.
 *
 * @param {Date} [fromDate=new Date()] - Thời điểm cảnh báo.
 * @returns {Object} Patch: `status: 'warning'`, xóa lock fields, `lastAction: 'warning'`.
 */
export function buildWarningUpdate(fromDate = new Date()) {
  return {
    status: "warning",
    lockDurationDays: null,
    lockedUntil: null,
    lastAction: "warning",
    lastActionAt: fromDate.toISOString(),
  };
}

/**
 * Tùy chọn lọc trạng thái tài khoản trên bảng vi phạm.
 *
 * @constant {ReadonlyArray<{ value: string, label: string }>}
 * @readonly
 */
export const STATUS_OPTIONS = [
  { value: "all", label: "Trạng thái (Tất cả)" },
  { value: "locked", label: "Bị khóa" },
  { value: "warning", label: "Cảnh báo" },
  { value: "normal", label: "Bình thường" },
];

/**
 * Tùy chọn lọc hạng gamification trên bảng vi phạm.
 *
 * @constant {ReadonlyArray<{ value: string, label: string }>}
 * @readonly
 */
export const RANK_OPTIONS = [
  { value: "all", label: "Hạng (Tất cả)" },
  { value: "bronze", label: "Hạng Đồng" },
  { value: "silver", label: "Hạng Bạc" },
  { value: "gold", label: "Hạng Vàng" },
  { value: "platinum", label: "Hạng Bạch kim" },
];

/**
 * Tùy chọn sắp xếp danh sách tài khoản vi phạm.
 *
 * @constant {ReadonlyArray<{ value: string, label: string }>}
 * @readonly
 */
export const SORT_OPTIONS = [
  { value: "violations-desc", label: "Sắp xếp: Số lần vi phạm ↓" },
  { value: "violations-asc", label: "Sắp xếp: Số lần vi phạm ↑" },
  { value: "name-asc", label: "Sắp xếp: Tên A-Z" },
];

/**
 * Metadata nhãn và tone badge theo trạng thái tài khoản.
 *
 * @constant {Readonly<Record<string, { label: string, tone: string }>>}
 * @readonly
 */
export const STATUS_META = {
  locked: { label: "Bị khóa", tone: "danger" },
  warning: { label: "Cảnh báo", tone: "warning" },
  normal: { label: "Bình thường", tone: "success" },
};

/**
 * Metadata nhãn và tone huy hiệu hạng thành viên.
 *
 * @constant {Readonly<Record<string, { label: string, tone: string }>>}
 * @readonly
 */
export const RANK_META = {
  bronze: { label: "Hạng Đồng", tone: "bronze" },
  silver: { label: "Hạng Bạc", tone: "silver" },
  gold: { label: "Hạng Vàng", tone: "gold" },
  platinum: { label: "Hạng Bạch kim", tone: "gold" },
};

/**
 * Lý do khóa mặc định khi Moderator không nhập lý do tùy chỉnh.
 *
 * @constant {string}
 * @readonly
 */
export const DEFAULT_BAN_REASON = "Vi phạm quy định cộng đồng SEHUB.";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const DEPARTMENTS = ["Khoa CNTT", "Khoa QTKD", "Khoa Ngôn ngữ", "Khoa Thiết kế"];
const STATUSES = ["locked", "warning", "normal"];
const RANKS = ["bronze", "silver", "gold"];

const SEED_ACCOUNTS = [
  {
    id: "u-1",
    username: "nguyen.van.a",
    studentId: "SE160001",
    displayName: "Nguyễn Văn A",
    email: "nguyen.van.a@fpt.edu.vn",
    department: "Khoa CNTT",
    rank: "silver",
    violations: 4,
    status: "locked",
    lockDurationDays: 7,
    lockedUntil: addDays(new Date(), 5),
    lastAction: "lock",
    initial: "A",
  },
  {
    id: "u-2",
    username: "tran.thi.b",
    studentId: "SE160045",
    displayName: "Trần Thị B",
    email: "tran.thi.b@fpt.edu.vn",
    department: "Khoa CNTT",
    rank: "gold",
    violations: 2,
    status: "warning",
    lastAction: "warning",
    initial: "B",
  },
  {
    id: "u-3",
    username: "le.van.c",
    studentId: "SE170112",
    displayName: "Lê Văn C",
    email: "le.van.c@fpt.edu.vn",
    department: "Khoa QTKD",
    rank: "bronze",
    violations: 1,
    status: "normal",
    initial: "C",
  },
];

function buildMockAccounts() {
  const list = [...SEED_ACCOUNTS];

  for (let index = 4; index <= 45; index += 1) {
    const status = STATUSES[index % STATUSES.length];
    const rank = RANKS[index % RANKS.length];
    const lockDurationDays =
      status === "locked" ? LOCK_DURATION_OPTIONS[index % LOCK_DURATION_OPTIONS.length].value : null;
    list.push({
      id: `u-${index}`,
      username: `user.${index}`,
      studentId: `SE${160000 + index}`,
      displayName: `Sinh viên ${index}`,
      email: `user.${index}@fpt.edu.vn`,
      department: DEPARTMENTS[index % DEPARTMENTS.length],
      rank,
      violations: Math.max(0, 5 - (index % 6)),
      status,
      lockDurationDays,
      lockedUntil:
        status === "locked" && lockDurationDays
          ? addDays(new Date(), lockDurationDays - (index % lockDurationDays))
          : null,
      lastAction: status === "locked" ? "lock" : status === "warning" ? "warning" : null,
      initial: String.fromCharCode(65 + (index % 26)),
    });
  }

  return list;
}

/**
 * Danh sách mock tài khoản vi phạm (~45 bản ghi) khi `VITE_USE_MOCK=true`.
 *
 * @constant {ReadonlyArray<Object>}
 * @readonly
 */
export const VIOLATING_ACCOUNTS_MOCK = buildMockAccounts();

/**
 * @typedef {Object} FilterViolatingAccountsOptions
 * @property {string} query - Từ khóa tìm kiếm (tên, username, email, mã SV).
 * @property {string} status - Lọc trạng thái; `all` để bỏ lọc.
 * @property {string} rank - Lọc hạng; `all` để bỏ lọc.
 * @property {string} sort - Khóa sắp xếp từ `SORT_OPTIONS`.
 */

/**
 * Lọc và sắp xếp danh sách tài khoản vi phạm theo bộ lọc UI.
 *
 * @param {Array} accounts - Danh sách tài khoản gốc.
 * @param {FilterViolatingAccountsOptions} options - Bộ lọc hiện tại.
 * @returns {Array} Tài khoản đã lọc và sắp xếp.
 */
export function filterViolatingAccounts(accounts, { query, status, rank, sort }) {
  const keyword = query.trim().toLowerCase();

  let result = accounts.filter((account) => {
    if (status !== "all" && account.status !== status) return false;
    if (rank !== "all" && account.rank !== rank) return false;
    if (!keyword) return true;

    return (
      account.displayName.toLowerCase().includes(keyword) ||
      account.username.toLowerCase().includes(keyword) ||
      account.email.toLowerCase().includes(keyword) ||
      account.studentId.toLowerCase().includes(keyword)
    );
  });

  result = [...result].sort((a, b) => {
    if (sort === "violations-asc") return a.violations - b.violations;
    if (sort === "name-asc") return a.displayName.localeCompare(b.displayName, "vi");
    return b.violations - a.violations;
  });

  return result;
}

/**
 * @typedef {Object} LoadViolatingAccountsOptions
 * @property {number} [page=1] - Trang (1-based).
 * @property {number} [pageSize=VIOLATIONS_PAGE_SIZE] - Kích thước trang.
 * @property {string} [search] - Từ khóa tìm kiếm.
 * @property {string} [status='all'] - Lọc trạng thái.
 * @property {string} [rank='all'] - Lọc hạng.
 * @property {string} [sort='violations-desc'] - Khóa sắp xếp.
 */

/**
 * @typedef {Object} LoadViolatingAccountsResult
 * @property {Array} items - Tài khoản trên trang hiện tại.
 * @property {number} page - Trang hiện tại.
 * @property {number} pageSize - Kích thước trang.
 * @property {number} totalCount - Tổng số tài khoản.
 * @property {number} totalPages - Tổng số trang.
 * @property {boolean} hasNextPage - Còn trang sau.
 * @property {boolean} hasPreviousPage - Có trang trước.
 */

/**
 * Tải danh sách tài khoản vi phạm có phân trang (API hoặc mock).
 *
 * @param {LoadViolatingAccountsOptions} [options] - Tùy chọn phân trang và lọc.
 * @returns {Promise<LoadViolatingAccountsResult>} Kết quả phân trang.
 */
export async function loadViolatingAccounts({
  page = 1,
  pageSize = VIOLATIONS_PAGE_SIZE,
  search = "",
  status = "all",
  rank = "all",
  sort = "violations-desc",
} = {}) {
  if (USE_MOCK) {
    const filtered = filterViolatingAccounts(VIOLATING_ACCOUNTS_MOCK, {
      query: search,
      status,
      rank,
      sort,
    });
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;

    return {
      items: filtered.slice(start, start + pageSize),
      page: safePage,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    };
  }

  const result = await adminApi.listViolatingUsers({
    page,
    pageSize,
    search: search.trim() || undefined,
    status,
    rank,
    sort,
  });

  const totalCount = result?.totalCount ?? 0;
  const resolvedPageSize = result?.pageSize ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / resolvedPageSize) || 1);

  return {
    items: (result?.items ?? []).map(mapViolatingUser),
    page: result?.page ?? page,
    pageSize: resolvedPageSize,
    totalCount,
    totalPages,
    hasNextPage: result?.hasNextPage ?? page < totalPages,
    hasPreviousPage: result?.hasPreviousPage ?? page > 1,
  };
}

/**
 * Tải chi tiết một tài khoản vi phạm (thông tin mở rộng + lịch sử xử lý).
 *
 * @param {string} userId - ID tài khoản.
 * @returns {Promise<Object>} Chi tiết tài khoản đã map.
 * @throws {Error} Khi không tìm thấy (mock) hoặc API lỗi.
 */
export async function loadViolatingAccountDetail(userId) {
  if (USE_MOCK) {
    const account = VIOLATING_ACCOUNTS_MOCK.find((item) => item.id === userId);
    if (!account) {
      throw new Error("Không tìm thấy tài khoản vi phạm.");
    }
    return {
      ...account,
      tempBanCount: account.status === "locked" ? 1 : 0,
      history: [],
    };
  }

  const detail = await adminApi.getViolatingUser(userId);
  return mapViolatingUserDetail(detail);
}

/**
 * Gửi cảnh báo (warn) tới tài khoản vi phạm — không khóa tài khoản.
 *
 * @param {string} userId - ID tài khoản.
 * @param {string} [reason=''] - Lý do cảnh báo.
 * @returns {Promise<Object>} Tài khoản đã cập nhật (hoặc patch mock).
 */
export async function submitViolatingAccountWarning(userId, reason = "") {
  if (USE_MOCK) {
    return { ...buildWarningUpdate(), reason };
  }

  const updated = await adminApi.warnViolatingUser(userId, { reason });
  return mapViolatingUser(updated);
}

/**
 * Khóa tạm tài khoản vi phạm theo thời hạn 1 / 7 / 30 ngày.
 *
 * @param {string} userId - ID tài khoản.
 * @param {number} durationDays - Số ngày khóa.
 * @param {string} [reason=DEFAULT_BAN_REASON] - Lý do khóa.
 * @returns {Promise<Object>} Tài khoản đã cập nhật (hoặc patch mock).
 */
export async function submitViolatingAccountBan(userId, durationDays, reason = DEFAULT_BAN_REASON) {
  if (USE_MOCK) {
    return buildLockUpdate(durationDays);
  }

  const updated = await adminApi.banViolatingUser(userId, {
    durationDays,
    reason: reason.trim() || DEFAULT_BAN_REASON,
  });
  return mapViolatingUser(updated);
}

/**
 * Gỡ khóa tạm tài khoản vi phạm (chỉ Moderator — khóa vĩnh viễn do Admin).
 *
 * @param {string} userId - ID tài khoản.
 * @param {string} [note=''] - Ghi chú khi gỡ khóa.
 * @returns {Promise<Object>} Tài khoản đã cập nhật (hoặc patch mock).
 */
export async function submitViolatingAccountUnban(userId, note = "") {
  if (USE_MOCK) {
    return buildWarningUpdate();
  }

  const updated = await adminApi.unbanViolatingUser(userId, { note });
  return mapViolatingUser(updated);
}
