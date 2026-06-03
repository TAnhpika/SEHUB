/**
 * Dữ liệu giả lập để test khu vực Moderator (dev / demo).
 * Đăng nhập bằng username hoặc email + mật khẩu bên dưới.
 */

export const MODERATOR_TEST_ACCOUNTS = [
  {
    username: "mod_sehub",
    email: "moderator@sehubs.local",
    password: "mod123",
    displayName: "Nguyễn Kiểm Duyệt",
    initial: "N",
    role: "moderator",
    roleLabel: "Kiểm duyệt viên",
    unreadNotifications: 3,
  },
  {
    username: "admin_sehub",
    email: "admin@sehubs.local",
    password: "admin123",
    displayName: "Admin User",
    initial: "A",
    role: "admin",
    roleLabel: "Quản trị viên",
    unreadNotifications: 7,
  },
];

export const PRACTICE_EXAM_DRAFT_MOCK = {
  subject: "PRF192",
  semester: "Học kỳ 5",
  title: "Đề thi giữa kỳ môn Lập trình Web",
  description:
    "Sinh viên nộp bài qua GitHub (public repo).\n\nYêu cầu:\n- Frontend: React hoặc Vue\n- Backend: Node.js hoặc .NET\n- Có README mô tả cách chạy dự án\n- Deadline: 23:59 Chủ nhật tuần 12",
  allowDiscussion: true,
  pinExam: false,
  attachments: [
    {
      id: "pdf-1",
      name: "De_thi_Web_CuoiKy_2023.pdf",
      sizeLabel: "2.4 MB",
      type: "pdf",
      status: "done",
      progress: 100,
    },
    {
      id: "zip-1",
      name: "Source_Code_Mau.zip",
      sizeLabel: "15.2 MB",
      type: "zip",
      status: "uploading",
      progress: 45,
    },
  ],
};

export const PRACTICE_EXAM_SUBMISSIONS_MOCK = [
  {
    id: "sub-1",
    studentName: "Trần Minh Anh",
    studentId: "SE171234",
    githubUrl: "https://github.com/minhanh/prf192-midterm",
    submittedAt: "2026-05-28T14:32:00",
    status: "pending",
    statusLabel: "Chờ duyệt",
  },
  {
    id: "sub-2",
    studentName: "Lê Hoàng Nam",
    studentId: "SE172891",
    githubUrl: "https://github.com/hoangnam/web-midterm-prf192",
    submittedAt: "2026-05-29T09:15:00",
    status: "reviewed",
    statusLabel: "Đã xem",
  },
  {
    id: "sub-3",
    studentName: "Phạm Thu Hà",
    studentId: "SE173045",
    githubUrl: "https://github.com/thuha/prf192-assignment",
    submittedAt: "2026-06-01T21:08:00",
    status: "passed",
    statusLabel: "Đạt",
  },
];

export function findModeratorTestAccount(identifier, password) {
  const key = identifier?.trim().toLowerCase();
  if (!key) return null;

  return (
    MODERATOR_TEST_ACCOUNTS.find(
      (account) =>
        (account.username.toLowerCase() === key ||
          account.email.toLowerCase() === key) &&
        account.password === password,
    ) ?? null
  );
}

export function toAuthUser(account) {
  const { password: _password, ...user } = account;
  return {
    ...user,
    level: "Gold",
    points: 1280,
    streak: 12,
    levelProgress: 82,
    pointsToNext: 120,
    isPremium: false,
  };
}
