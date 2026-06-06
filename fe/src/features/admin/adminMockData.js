import { getAdminExams, getAdminPendingExams } from "@/features/admin/exams/adminExamData";
import { getAdminBannedUsers } from "@/features/admin/moderation/adminBannedData";

export const ADMIN_DASHBOARD_STATS = [
  {
    id: "users",
    label: "Người dùng",
    value: "2.148",
    change: "+12,4%",
    changeDetail: "so với tháng trước",
    trend: "up",
    urgent: false,
  },
  {
    id: "exams",
    label: "Đề thi",
    value: "524",
    change: "+8",
    changeDetail: "đề mới tuần này",
    trend: "up",
    urgent: false,
  },
  {
    id: "documents",
    label: "Tài liệu",
    value: "312",
    change: "+6",
    changeDetail: "upload hôm nay",
    trend: "up",
    urgent: false,
  },
  {
    id: "reports",
    label: "Báo cáo chờ",
    value: "7",
    change: "3 khẩn",
    changeDetail: "cần xử lý gấp",
    trend: "down",
    urgent: true,
  },
  {
    id: "revenue",
    label: "Doanh thu tháng",
    value: "48,2 tr",
    change: "+18,2%",
    changeDetail: "PayOS · VNĐ",
    trend: "up",
    urgent: false,
  },
  {
    id: "premium",
    label: "Student Premium",
    value: "8,7%",
    change: "+0,6 pp",
    changeDetail: "186 tài khoản · tỉ lệ gói",
    trend: "up",
    urgent: false,
  },
];

/** Phân bổ Student Basic (Free) vs Student Premium — chỉ sinh viên active */
export const ADMIN_STUDENT_PLAN_STATS = {
  totalStudents: 2148,
  period: "Sinh viên active · không tính Mod/Admin",
  basic: {
    id: "basic",
    label: "Student Basic",
    sublabel: "Gói Free",
    count: 1962,
    percent: 91.3,
    color: "#64748b",
    bg: "#f1f5f9",
  },
  premium: {
    id: "premium",
    label: "Student Premium",
    sublabel: "Gói trả phí",
    count: 186,
    percent: 8.7,
    color: "#2563eb",
    bg: "#dbeafe",
  },
  deltaPremiumPct: "+0,6 pp",
  deltaPremiumCount: "+12",
  deltaPeriod: "so với tháng trước",
  targetPremiumPct: 12,
};

/** Tỉ lệ Premium theo tháng (% trên tổng SV) — 6 tháng */
export const ADMIN_CHART_PREMIUM_RATIO = {
  labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
  values: [7.2, 7.5, 7.9, 8.1, 8.3, 8.7],
  unit: "%",
};

/** Đăng ký user mới theo tuần (7 tuần gần nhất) */
export const ADMIN_CHART_USER_GROWTH = {
  labels: ["T12", "T13", "T14", "T15", "T16", "T17", "T18"],
  values: [186, 204, 198, 241, 268, 295, 312],
  summary: { total: 2148, delta: "+12,4%", period: "8 tuần qua" },
};

/** Doanh thu Premium (triệu VNĐ) — 6 tháng */
export const ADMIN_CHART_REVENUE = {
  labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
  values: [32.1, 35.8, 38.4, 41.2, 45.6, 48.2],
  unit: "tr",
  summary: { total: "48,2 tr", delta: "+18,2%", period: "tháng 6/2026" },
};

/** Phân bổ nội dung nền tảng */
export const ADMIN_CHART_CONTENT = [
  { id: "posts", label: "Bài viết", value: 1842, color: "#0ea5e9" },
  { id: "exams", label: "Đề thi", value: 524, color: "#2563eb" },
  { id: "docs", label: "Tài liệu", value: 312, color: "#7c3aed" },
  { id: "reports", label: "Báo cáo (tháng)", value: 89, color: "#f59e0b" },
];

/** Trạng thái báo cáo vi phạm */
export const ADMIN_CHART_REPORT_STATUS = [
  { label: "Chờ xử lý", value: 7, color: "#ef4444" },
  { label: "Đang xem", value: 3, color: "#f59e0b" },
  { label: "Đã xử lý", value: 124, color: "#22c55e" },
  { label: "Bác bỏ", value: 18, color: "#94a3b8" },
];

/** Hoạt động đăng nhập / truy cập theo giờ (hôm nay) */
export const ADMIN_CHART_TRAFFIC = {
  labels: ["6h", "9h", "12h", "15h", "18h", "21h"],
  values: [120, 340, 520, 480, 610, 390],
};

export const ADMIN_DASHBOARD_PENDING = [
  { id: "p1", label: "Duyệt đề Mod", count: 2, to: "/admin/exams/pending", urgent: true },
  { id: "p2", label: "Báo cáo chờ", count: 4, to: "/admin/moderation", urgent: true },
  { id: "p3", label: "Thanh toán lỗi", count: 1, to: "/admin/payments", urgent: false },
];

export const ADMIN_QUICK_LINKS = [
  { to: "/admin/users", label: "Quản lý tài khoản", desc: "Khóa, reset MK, Premium" },
  { to: "/admin/exams/pending", label: "Duyệt đề Mod", desc: "2 đề đang chờ" },
  { to: "/admin/moderation", label: "Báo cáo", desc: "4 hàng chờ" },
  { to: "/admin/documents", label: "Quản lý tài liệu", desc: "Upload & phân quyền" },
  { to: "/admin/payments", label: "Quản lý thanh toán", desc: "PayOS & cộng token" },
  { to: "/admin/permissions", label: "Phân quyền Mod", desc: "Gán kiểm duyệt viên" },
];

export const ADMIN_RECENT_ACTIVITY = [
  { id: "1", time: "10:32", text: "Mod gửi đề PRF192 — chờ duyệt", type: "exam" },
  { id: "2", time: "09:15", text: "Báo cáo bài viết #1042 — spam", type: "report" },
  { id: "3", time: "08:40", text: "Premium kích hoạt — anhcoding12345", type: "payment" },
  { id: "4", time: "Hôm qua", text: "Khóa tạm tài khoản spam_bot_01", type: "user" },
];

/** Nhật ký đầy đủ — dashboard chỉ hiển thị 4 mục đầu */
export const ADMIN_ACTIVITY_LOG = [
  ...ADMIN_RECENT_ACTIVITY,
  { id: "5", time: "Hôm qua", text: "Upload tài liệu OOP202 — 48 trang", type: "exam" },
  { id: "6", time: "Hôm qua", text: "Thanh toán PayOS #8821 — thành công", type: "payment" },
  { id: "7", time: "2 ngày trước", text: "Báo cáo đã xử lý #1038 — xóa bài", type: "report" },
  { id: "8", time: "2 ngày trước", text: "Đăng ký mới — lee_dev_99", type: "user" },
  { id: "9", time: "3 ngày trước", text: "Mod gửi đề DBI301 — chờ duyệt", type: "exam" },
  { id: "10", time: "3 ngày trước", text: "Gia hạn Premium — minhanh_dev", type: "payment" },
  { id: "11", time: "4 ngày trước", text: "Báo cáo bài viết #1031 — quấy rối", type: "report" },
  { id: "12", time: "5 ngày trước", text: "Mở khóa tài khoản user_4421", type: "user" },
  { id: "13", time: "6 ngày trước", text: "Từ chối đề SWP391 — trùng nội dung", type: "exam" },
  { id: "14", time: "6 ngày trước", text: "Hoàn tiền PayOS #8710 — lỗi callback", type: "payment" },
  { id: "15", time: "7 ngày trước", text: "Báo cáo bài viết #1022 — sai chuyên mục", type: "report" },
  { id: "16", time: "7 ngày trước", text: "Gán Premium thủ công — tran_van_a", type: "user" },
  { id: "17", time: "8 ngày trước", text: "Phê duyệt đề PRF192 — public", type: "exam" },
  { id: "18", time: "9 ngày trước", text: "Khóa vĩnh viễn — scammer_xyz", type: "user" },
  { id: "19", time: "10 ngày trước", text: "Upload tài liệu DBI301 — 62 trang", type: "exam" },
  { id: "20", time: "11 ngày trước", text: "Báo cáo đã xử lý #1015 — cảnh cáo", type: "report" },
  { id: "21", time: "12 ngày trước", text: "Premium kích hoạt — fpt_student_22", type: "payment" },
  { id: "22", time: "13 ngày trước", text: "Mod gửi đề SWR302 — chờ duyệt", type: "exam" },
  { id: "23", time: "14 ngày trước", text: "Reset mật khẩu — helpdesk_req_88", type: "user" },
  { id: "24", time: "15 ngày trước", text: "Thanh toán PayOS #8655 — thành công", type: "payment" },
];

export const ADMIN_ACTIVITY_PAGE_SIZE = 8;

export const ADMIN_USERS = [
  {
    id: "u1",
    username: "anhcoding12345",
    email: "tngo28299@gmail.com",
    displayName: "Anhpika",
    role: "student",
    plan: "Free",
    status: "active",
    joinedAt: "2025-09-12",
  },
  {
    id: "u2",
    username: "minhanh_dev",
    email: "minhanh@fpt.edu.vn",
    displayName: "Trần Minh Anh",
    role: "student",
    plan: "Premium",
    status: "active",
    joinedAt: "2025-11-03",
  },
  {
    id: "u3",
    username: "mod_sehub",
    email: "moderator@sehubs.local",
    displayName: "Nguyễn Kiểm Duyệt",
    role: "moderator",
    plan: "—",
    status: "active",
    joinedAt: "2025-08-01",
  },
  {
    id: "u4",
    username: "spam_bot_01",
    email: "spam@fake.mail",
    displayName: "Spam Bot",
    role: "student",
    plan: "Free",
    status: "banned",
    joinedAt: "2026-05-20",
  },
  {
    id: "u5",
    username: "lee_dev_99",
    email: "lee.dev@fpt.edu.vn",
    displayName: "Lê Văn Đức",
    role: "student",
    plan: "Free",
    status: "active",
    joinedAt: "2026-01-08",
  },
  {
    id: "u6",
    username: "tran_van_a",
    email: "tranva@fpt.edu.vn",
    displayName: "Trần Văn A",
    role: "student",
    plan: "Premium",
    status: "active",
    joinedAt: "2025-12-14",
  },
  {
    id: "u7",
    username: "pham_thi_b",
    email: "phamtb@fpt.edu.vn",
    displayName: "Phạm Thị B",
    role: "student",
    plan: "Free",
    status: "active",
    joinedAt: "2026-02-22",
  },
  {
    id: "u8",
    username: "mod_phuong",
    email: "phuong.mod@sehubs.local",
    displayName: "Hoàng Phương Mod",
    role: "moderator",
    plan: "—",
    status: "active",
    joinedAt: "2025-07-19",
  },
  {
    id: "u9",
    username: "fpt_student_22",
    email: "fpt22@student.vn",
    displayName: "Nguyễn FPT 22",
    role: "student",
    plan: "Premium",
    status: "active",
    joinedAt: "2026-03-05",
  },
  {
    id: "u10",
    username: "scammer_xyz",
    email: "scam@fake.mail",
    displayName: "Scammer XYZ",
    role: "student",
    plan: "Free",
    status: "banned",
    joinedAt: "2026-04-18",
  },
  {
    id: "u11",
    username: "helpdesk_req_88",
    email: "help88@fpt.edu.vn",
    displayName: "Support Test 88",
    role: "student",
    plan: "Free",
    status: "active",
    joinedAt: "2026-05-01",
  },
  {
    id: "u12",
    username: "user_4421",
    email: "user4421@mail.com",
    displayName: "User 4421",
    role: "student",
    plan: "Free",
    status: "active",
    joinedAt: "2025-10-30",
  },
  {
    id: "u13",
    username: "admin_backup",
    email: "backup@sehubs.local",
    displayName: "Admin Backup",
    role: "admin",
    plan: "—",
    status: "active",
    joinedAt: "2025-06-01",
  },
  {
    id: "u14",
    username: "coding_ninja",
    email: "ninja@dev.vn",
    displayName: "Coding Ninja",
    role: "student",
    plan: "Premium",
    status: "active",
    joinedAt: "2025-11-28",
  },
  {
    id: "u15",
    username: "vu_minh_c",
    email: "vuminhc@fpt.edu.vn",
    displayName: "Vũ Minh C",
    role: "student",
    plan: "Free",
    status: "active",
    joinedAt: "2026-04-02",
  },
  {
    id: "u16",
    username: "banned_temp_01",
    email: "temp01@fake.mail",
    displayName: "Banned Temp",
    role: "student",
    plan: "Free",
    status: "banned",
    joinedAt: "2026-05-10",
  },
  {
    id: "u17",
    username: "hoa_nguyen_d",
    email: "hoand@fpt.edu.vn",
    displayName: "Hoa Nguyễn D",
    role: "student",
    plan: "Premium",
    status: "active",
    joinedAt: "2025-09-25",
  },
  {
    id: "u18",
    username: "mod_khanh",
    email: "khanh.mod@sehubs.local",
    displayName: "Trần Khánh Mod",
    role: "moderator",
    plan: "—",
    status: "active",
    joinedAt: "2025-10-12",
  },
  {
    id: "u19",
    username: "study_group_7",
    email: "sg7@fpt.edu.vn",
    displayName: "Study Group 7",
    role: "student",
    plan: "Free",
    status: "active",
    joinedAt: "2026-02-08",
  },
  {
    id: "u20",
    username: "premium_trial",
    email: "trial@fpt.edu.vn",
    displayName: "Premium Trial",
    role: "student",
    plan: "Premium",
    status: "active",
    joinedAt: "2026-05-25",
  },
];

export const ADMIN_USERS_PAGE_SIZE = 8;

/** Snapshot lúc load — danh sách động dùng getAdminExams() */
export const ADMIN_EXAMS = getAdminExams();
export const ADMIN_EXAM_PENDING = getAdminPendingExams();

export { getAdminDocuments as ADMIN_DOCUMENTS } from "@/features/admin/documents/adminDocumentData";

import { getAdminReports } from "@/features/admin/moderation/adminReportData";

/** Snapshot mock — dùng getAdminReports() khi cần danh sách live */
export const ADMIN_REPORTS = getAdminReports();

export const ADMIN_BANNED_USERS = getAdminBannedUsers();

export { getAdminPayments as ADMIN_PAYMENTS } from "@/features/admin/payments/adminPaymentData";

export const MODERATOR_CANDIDATES = [
  { username: "anhcoding12345", email: "tngo28299@gmail.com", displayName: "Anhpika" },
  { username: "minhanh_dev", email: "minhanh@fpt.edu.vn", displayName: "Trần Minh Anh" },
];

export function findAdminUser(id) {
  return ADMIN_USERS.find((user) => user.id === id) ?? null;
}

export { getAdminReportById as findAdminReport } from "@/features/admin/moderation/adminReportData";
