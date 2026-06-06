/** Metadata màn Admin — dùng breadcrumb & mô tả nghiệp vụ */

export const ADMIN_SCREENS = [
  {
    id: "dashboard",
    path: "/admin",
    title: "Dashboard",
    subtitle: "Thống kê người dùng, đề thi, tài liệu, báo cáo và doanh thu.",
    group: "Tổng quan",
  },
  {
    id: "activity",
    path: "/admin/activity",
    title: "Nhật ký hoạt động",
    subtitle: "Toàn bộ sự kiện hệ thống gần đây.",
    group: "Tổng quan",
  },
  {
    id: "users",
    path: "/admin/users",
    title: "Quản lý tài khoản",
    subtitle: "Tìm kiếm, khóa/mở khóa vĩnh viễn, reset mật khẩu, gán Premium thủ công.",
    group: "Người dùng",
  },
  {
    id: "user-detail",
    path: "/admin/users/:id",
    title: "Chi tiết tài khoản",
    subtitle: "Xem hồ sơ và thao tác quản trị trên một người dùng.",
    group: "Người dùng",
  },
  {
    id: "exams",
    path: "/admin/exams",
    title: "Quản lý đề thi",
    subtitle: "CRUD đề cuối kỳ & thực hành, OCR và kiểm tra trùng SHA-256.",
    group: "Nội dung",
  },
  {
    id: "exam-form",
    path: "/admin/exams/new",
    title: "Thêm đề thi",
    subtitle: "Tạo đề mới hoặc import từ file PDF/ảnh.",
    group: "Nội dung",
  },
  {
    id: "exam-pending",
    path: "/admin/exams/pending",
    title: "Duyệt đề từ Moderator",
    subtitle: "Phê duyệt hoặc từ chối đề Mod gửi trước khi public.",
    group: "Nội dung",
  },
  {
    id: "documents",
    path: "/admin/documents",
    title: "Quản lý tài liệu",
    subtitle: "Upload, phân loại môn học, gán quyền Free (3 trang) / Premium.",
    group: "Nội dung",
  },
  {
    id: "moderation",
    path: "/admin/moderation",
    title: "Hàng chờ báo cáo",
    subtitle: "Xử lý báo cáo bài viết từ cộng đồng.",
    group: "Nội dung",
  },
  {
    id: "report-detail",
    path: "/admin/moderation/:id",
    title: "Chi tiết báo cáo",
    subtitle: "Xem bài bị báo cáo và quyết định xử lý.",
    group: "Nội dung",
  },
  {
    id: "banned",
    path: "/admin/users",
    title: "Tài khoản bị khóa",
    subtitle: "Lọc trạng thái Đã khóa trong Quản lý tài khoản.",
    group: "Người dùng",
  },
  {
    id: "payments",
    path: "/admin/payments",
    title: "Thanh toán & PayOS",
    subtitle: "Giao dịch, xác nhận thanh toán, cộng token — audit trail.",
    group: "Hệ thống",
  },
  {
    id: "gamification",
    path: "/admin/gamification",
    title: "Gamification config",
    subtitle: "CRUD cấp hạng, danh hiệu & quy tắc cộng điểm — engine event-driven §3.6.",
    group: "Hệ thống",
  },
  {
    id: "permissions",
    path: "/admin/permissions",
    title: "Phân quyền Mod",
    subtitle: "Gán hoặc thu hồi quyền kiểm duyệt viên.",
    group: "Người dùng",
  },
];

/** Giai đoạn 2 (chưa làm UI): Chatbot KB, Xuất/backup dữ liệu */
