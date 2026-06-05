export const VIOLATIONS_PAGE_SIZE = 10;

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
