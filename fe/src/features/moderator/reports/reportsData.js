export const REPORT_STATUS_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "resolved", label: "Đã xử lý" },
];

export const REASON_META = {
  spam: { label: "Spam", tone: "danger" },
  harmful: { label: "Nội dung độc hại", tone: "muted" },
  harassment: { label: "Quấy rối", tone: "danger" },
  misinformation: { label: "Thông tin sai", tone: "muted" },
};

export const REPORTS_MOCK = [
  {
    id: "rp-4921",
    code: "RP-4921",
    status: "pending",
    reason: "spam",
    reporterUsername: "@minh_student",
    reporterInitial: "MS",
    timeLabel: "10 phút trước",
    reportedAt: "14:30, 24/10/2023",
    snippet:
      "Nội dung này chứa các liên kết đáng ngờ dẫn đến trang web lừa đảo. Cần kiểm tra…",
    reportedUser: {
      username: "@spammer_acc_01",
      initial: "SP",
      joinedAt: "01/09/2023",
      trustScore: 25,
    },
    violatingContent:
      "Click ngay vào link này để nhận tài liệu ôn thi bí mật đảm bảo đậu 100% không cần học: http://bit.ly/scam-link-123. Số lượng có hạn!!",
    reporterReason:
      "Tài khoản này liên tục gửi các liên kết lạ vào nhiều luồng thảo luận khác nhau, nghi ngờ là link lừa đảo đánh cắp thông tin sinh viên.",
  },
  {
    id: "rp-4918",
    code: "RP-4918",
    status: "pending",
    reason: "harmful",
    reporterUsername: "@tuan_anh99",
    reporterInitial: "TA",
    timeLabel: "1 giờ trước",
    reportedAt: "13:15, 24/10/2023",
    snippet:
      "Ngôn từ xúc phạm nghiêm trọng trong phần bình luận của bài giảng Kỹ thuật…",
    reportedUser: {
      username: "@user_ky_thuat_02",
      initial: "KT",
      joinedAt: "15/08/2023",
      trustScore: 42,
    },
    violatingContent:
      "Thầy dạy như *expletive*, không ai hiểu gì cả. Đừng học môn này nếu không muốn trượt.",
    reporterReason:
      "Bình luận có ngôn từ thô tục, xúc phạm giảng viên và gây toxic cho cộng đồng học tập.",
  },
  {
    id: "rp-4902",
    code: "RP-4902",
    status: "pending",
    reason: "misinformation",
    reporterUsername: "@linh_data",
    reporterInitial: "LD",
    timeLabel: "3 giờ trước",
    reportedAt: "11:00, 24/10/2023",
    snippet: "Đăng thông tin sai về lịch thi FE và đáp án đề chưa được xác minh…",
    reportedUser: {
      username: "@fake_news_88",
      initial: "FN",
      joinedAt: "20/09/2023",
      trustScore: 18,
    },
    violatingContent:
      "FE tuần sau hủy, ai cần đáp án inbox mình — cam kết 100% trùng đề (chưa verify).",
    reporterReason: "Thông tin gây hoang mang, không có nguồn từ phòng đào tạo.",
  },
  {
    id: "rp-4880",
    code: "RP-4880",
    status: "resolved",
    reason: "harassment",
    reporterUsername: "@pham_e",
    reporterInitial: "PE",
    timeLabel: "1 ngày trước",
    reportedAt: "09:20, 23/10/2023",
    snippet: "Nhắn tin riêng quấy rối sau khi tranh luận trong bài viết…",
    reportedUser: {
      username: "@acc_xyz_12",
      initial: "XY",
      joinedAt: "02/07/2023",
      trustScore: 55,
    },
    violatingContent: "DM liên tục yêu cầu xóa bài và đe dọa nếu không tuân theo.",
    reporterReason: "Quấy rối qua tin nhắn cá nhân sau tranh luận công khai.",
    resolution: "ignored",
  },
];

export function filterReports(reports, statusTab) {
  if (statusTab === "all") return reports;
  return reports.filter((report) => report.status === statusTab);
}
