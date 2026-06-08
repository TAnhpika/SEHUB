export const VIOLATIONS_PAGE_SIZE = 10;

/** Moderator: khóa tạm 1 / 7 / 30 ngày — mức nghiêm trọng tăng dần (§2.4) */
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

export function getLockSeverityMeta(days) {
  return LOCK_DURATION_OPTIONS.find((option) => option.value === days) ?? LOCK_DURATION_OPTIONS[0];
}

/** Map mức khóa → tone ModeratorBadge (đồng bộ panel) */
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

export function buildLockUpdate(days, fromDate = new Date()) {
  return {
    status: "locked",
    lockDurationDays: days,
    lockedUntil: addDays(fromDate, days),
    lastAction: "lock",
    lastActionAt: fromDate.toISOString(),
  };
}

export function buildWarningUpdate(fromDate = new Date()) {
  return {
    status: "warning",
    lockDurationDays: null,
    lockedUntil: null,
    lastAction: "warning",
    lastActionAt: fromDate.toISOString(),
  };
}

export const STATUS_OPTIONS = [
  { value: "all", label: "Trạng thái (Tất cả)" },
  { value: "locked", label: "Bị khóa" },
  { value: "warning", label: "Cảnh báo" },
  { value: "normal", label: "Bình thường" },
];

export const RANK_OPTIONS = [
  { value: "all", label: "Hạng (Tất cả)" },
  { value: "bronze", label: "Hạng Đồng" },
  { value: "silver", label: "Hạng Bạc" },
  { value: "gold", label: "Hạng Vàng" },
];

export const SORT_OPTIONS = [
  { value: "violations-desc", label: "Sắp xếp: Số lần vi phạm ↓" },
  { value: "violations-asc", label: "Sắp xếp: Số lần vi phạm ↑" },
  { value: "name-asc", label: "Sắp xếp: Tên A-Z" },
];

export const STATUS_META = {
  locked: { label: "Bị khóa", tone: "danger" },
  warning: { label: "Cảnh báo", tone: "warning" },
  normal: { label: "Bình thường", tone: "success" },
};

export const RANK_META = {
  bronze: { label: "Hạng Đồng", tone: "bronze" },
  silver: { label: "Hạng Bạc", tone: "silver" },
  gold: { label: "Hạng Vàng", tone: "gold" },
};

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

export const VIOLATING_ACCOUNTS_MOCK = buildMockAccounts();

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
