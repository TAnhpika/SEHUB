import {
  faClipboardCheck,
  faFileCirclePlus,
  faFlag,
  faStar,
  faUserSlash,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

/** Sau đăng nhập (mock) — màn nhập câu hỏi đề cuối kỳ */
export const MODERATOR_HOME_PATH = "/moderator/final-exams/add/questions";

export const MODERATOR_NAV_ITEMS = [
  {
    id: "reports",
    label: "Xử lý báo cáo",
    to: "/moderator/reports",
    icon: faFlag,
  },
  {
    id: "content",
    label: "Duyệt nội dung",
    to: "/moderator/content",
    icon: faClipboardCheck,
  },
  {
    id: "featured",
    label: "Bài viết nổi bật",
    to: "/moderator/featured",
    icon: faStar,
  },
  {
    id: "violations",
    label: "Tài khoản vi phạm",
    to: "/moderator/violations",
    icon: faUserSlash,
  },
  {
    id: "final-exam",
    label: "Thêm đề cuối kỳ",
    to: "/moderator/final-exams/add",
    icon: faFileCirclePlus,
  },
  {
    id: "practice-exam",
    label: "Thêm đề thực hành",
    to: "/moderator/practice-exams/add",
    icon: faClipboardList,
  },
];
