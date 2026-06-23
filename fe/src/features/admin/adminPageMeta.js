/**
 * Metadata màn Admin — Roadmap Giai đoạn 1 + Chatbot (Phase 3).
 */

export const ADMIN_SCREENS = [
  {
    id: "dashboard",
    path: "/admin",
    title: "Dashboard",
    subtitle: "Thống kê người dùng, đề thi, tài liệu, báo cáo chờ và doanh thu Premium.",
    group: "Tổng quan",
    phase: "GĐ1",
  },
  {
    id: "activity",
    path: "/admin/activity",
    title: "Nhật ký hoạt động",
    subtitle: "Timeline sự kiện hệ thống — đề thi, báo cáo, thanh toán và thao tác tài khoản.",
    group: "Tổng quan",
    phase: "GĐ1",
  },
  {
    id: "users",
    path: "/admin/users",
    title: "Quản lý tài khoản",
    subtitle: "Tìm kiếm, xem hồ sơ, khóa/mở khóa vĩnh viễn, reset mật khẩu.",
    group: "Người dùng",
    phase: "GĐ1",
  },
  {
    id: "user-detail",
    path: "/admin/users/:id",
    title: "Chi tiết tài khoản",
    subtitle: "Xem hồ sơ SV/Mod — khóa vĩnh viễn, mở khóa, gửi email reset MK.",
    group: "Người dùng",
    phase: "GĐ1",
  },
  {
    id: "permissions",
    path: "/admin/permissions",
    title: "Phân quyền Mod",
    subtitle: "Gán hoặc thu hồi quyền Kiểm duyệt viên. Chỉ Admin — audit mọi thay đổi.",
    group: "Người dùng",
    phase: "GĐ1",
  },
  {
    id: "banned",
    path: "/admin/moderation/banned",
    title: "Tài khoản bị khóa",
    subtitle: "Theo dõi khóa tạm (Mod/Admin) và khóa vĩnh viễn. Mở khóa khi đủ điều kiện.",
    group: "Người dùng",
    phase: "GĐ1",
  },
  {
    id: "exams",
    path: "/admin/exams",
    title: "Quản lý đề thi",
    subtitle: "Kho đề Admin. Bản nháp chưa lên hệ thống cho sinh viên — chỉ thấy khi lọc hoặc sau Lưu nháp.",
    group: "Nội dung",
    phase: "GĐ1",
  },
  {
    id: "exam-form",
    path: "/admin/exams/new",
    title: "Thêm đề thi",
    subtitle: "Upload PDF/ảnh, chạy OCR, kiểm tra SHA-256 và xác nhận đáp án trước khi publish.",
    group: "Nội dung",
    phase: "GĐ1",
  },
  {
    id: "exam-pending",
    path: "/admin/exams/pending",
    title: "Duyệt đề từ Moderator",
    subtitle: "Xem trước nội dung, duyệt xuất bản hoặc từ chối kèm lý do để Mod chỉnh sửa.",
    group: "Nội dung",
    phase: "GĐ1",
  },
  {
    id: "practice-submissions",
    path: "/admin/exams/submissions",
    title: "Bài nộp thực hành",
    subtitle: "Xem & chấm bài nộp GitHub (Đã xem / Đạt / Chưa đạt).",
    group: "Nội dung",
    phase: "GĐ1",
  },
  {
    id: "documents",
    path: "/admin/documents",
    title: "Quản lý tài liệu",
    subtitle: "Bài giảng, sách giáo khoa và tài liệu tham khảo — chọn kỳ và môn để upload hoặc quản lý file.",
    group: "Nội dung",
    phase: "GĐ1",
  },
  {
    id: "document-subject",
    path: "/admin/documents/:courseCode",
    title: "Tài liệu theo môn",
    subtitle: "Upload PDF/DOCX/PPTX, phân quyền Free (3 trang) hoặc Premium (full + tải).",
    group: "Nội dung",
    phase: "GĐ1",
  },
  {
    id: "moderation",
    path: "/admin/moderation",
    title: "Hàng chờ báo cáo",
    subtitle: "Xem bài bị báo cáo, quyết định xóa nội dung, giữ nguyên hoặc khóa tài khoản vi phạm.",
    group: "Nội dung",
    phase: "GĐ1",
  },
  {
    id: "report-detail",
    path: "/admin/moderation/:id",
    title: "Chi tiết báo cáo",
    subtitle: "Deep link vào workspace báo cáo đã chọn.",
    group: "Nội dung",
    phase: "GĐ1",
  },
  {
    id: "payments",
    path: "/admin/payments",
    title: "Thanh toán PayOS",
    subtitle: "Luồng PayOS 5 bước — Admin xác nhận kích hoạt Premium; cộng token thủ công có giới hạn và audit bất biến.",
    group: "Hệ thống",
    phase: "GĐ1",
  },
  {
    id: "payment-detail",
    path: "/admin/payments/:id",
    title: "Chi tiết giao dịch",
    subtitle: "Mã PayOS, gói, trạng thái — xác nhận kích hoạt hoặc hoàn tiền.",
    group: "Hệ thống",
    phase: "GĐ1",
  },
  {
    id: "gamification",
    path: "/admin/gamification",
    title: "Gamification",
    subtitle: "CRUD cấp hạng, danh hiệu và quy tắc cộng điểm — engine quét event khi SV có hành động.",
    group: "Hệ thống",
    phase: "GĐ1",
  },
  {
    id: "chatbot",
    path: "/admin/settings/chatbot",
    title: "Chatbot tư vấn",
    subtitle: "Cấu hình prompt, welcome message, knowledge base và xem hội thoại Premium.",
    group: "Hệ thống",
    phase: "P3",
  },
  {
    id: "vouchers",
    path: "/admin/vouchers",
    title: "Quản lý voucher",
    subtitle: "Cấp voucher thủ công, theo dõi mã đã gắn tài khoản SV — không cần gửi email riêng.",
    group: "Hệ thống",
    phase: "GĐ1",
  },
];

const DYNAMIC_PATH_RULES = [
  { pattern: /^\/admin\/users\/[^/]+$/, id: "user-detail" },
  { pattern: /^\/admin\/payments\/[^/]+$/, id: "payment-detail" },
  { pattern: /^\/admin\/exams\/[^/]+\/edit$/, id: "exam-form" },
  { pattern: /^\/admin\/exams\/[^/]+$/, id: "exams" },
  { pattern: /^\/admin\/documents\/[^/]+$/, id: "document-subject" },
  { pattern: /^\/admin\/moderation\/[^/]+$/, id: "report-detail" },
];

/** Tra metadata theo pathname — dùng fallback subtitle khi page không truyền. */
export function resolveAdminScreenMeta(pathname) {
  const exact = ADMIN_SCREENS.find((screen) => screen.path === pathname);
  if (exact) return exact;

  const rule = DYNAMIC_PATH_RULES.find((entry) => entry.pattern.test(pathname));
  if (!rule) return null;

  return ADMIN_SCREENS.find((screen) => screen.id === rule.id) ?? null;
}
