import {
  faBook,
  faBug,
  faComments,
  faCreditCard,
  faRobot,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

export const SUPPORT_CATEGORIES = [
  {
    icon: faUser,
    title: "Tài khoản & đăng nhập",
    desc: "Quản lý hồ sơ, bảo mật, mật khẩu và cài đặt cá nhân.",
  },
  {
    icon: faCreditCard,
    title: "Thanh toán & nâng cấp",
    desc: "Lịch sử giao dịch, hóa đơn, phương thức thanh toán.",
  },
  {
    icon: faRobot,
    title: "AI trợ giảng",
    desc: "Hướng dẫn tương tác và tối ưu hóa trải nghiệm AI.",
  },
  {
    icon: faComments,
    title: "Cộng đồng SEHub",
    desc: "Quy tắc cộng đồng, báo cáo vi phạm, tạo bài viết.",
  },
  {
    icon: faBug,
    title: "Báo lỗi hệ thống",
    desc: "Báo cáo sự cố kỹ thuật và theo dõi tiến độ khắc phục.",
  },
  {
    icon: faBook,
    title: "Hướng dẫn sử dụng",
    desc: "Tài liệu chi tiết về các tính năng của nền tảng.",
  },
];

export const FAQ_ITEMS = [
  {
    question: "Làm sao để đổi mật khẩu?",
    answer:
      "Vào Cài đặt tài khoản → Bảo mật → Đổi mật khẩu. Nhập mật khẩu hiện tại và mật khẩu mới, sau đó xác nhận để lưu thay đổi.",
  },
  {
    question: "Cách đăng bài trong cộng đồng?",
    answer:
      "Truy cập trang Cộng đồng, nhấn nút \"Tạo bài viết\" ở đầu feed, điền tiêu đề và nội dung, chọn thẻ phù hợp rồi đăng bài.",
  },
  {
    question: "Làm sao để liên hệ với AI trợ giảng?",
    answer:
      "Mở mục AI trợ giảng trên thanh điều hướng hoặc trong bài viết/tài liệu, nhập câu hỏi vào ô chat và gửi. AI sẽ phản hồi trong vài giây.",
  },
];

export const SUPPORT_SUBJECTS = [
  "Tài khoản & đăng nhập",
  "Thanh toán & nâng cấp",
  "AI trợ giảng",
  "Cộng đồng SEHub",
  "Báo lỗi hệ thống",
  "Khác",
];
