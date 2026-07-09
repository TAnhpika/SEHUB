/**
 * @fileoverview Dữ liệu giả lập (mock) phục vụ dev/demo khu vực Moderator và đăng nhập test SEHUB.
 *
 * Module cung cấp:
 * - Tài khoản moderator/admin và sinh viên Basic/Premium để đăng nhập local.
 * - Mock đề thi thực hành, bài nộp, đề cuối kỳ và câu hỏi mẫu.
 * - Hàm tra cứu tài khoản test và chuẩn hóa object user cho auth.
 *
 * Đăng nhập bằng username hoặc email + mật khẩu trong `MODERATOR_TEST_ACCOUNTS` / `STUDENT_TEST_ACCOUNTS`.
 *
 * @module features/moderator/moderatorMockData
 */

import { resolveIsPremium } from "@/utils/studentPlan";

/**
 * @typedef {Object} ModeratorTestAccount
 * @property {string} username - Tên đăng nhập test.
 * @property {string} email - Email test.
 * @property {string} password - Mật khẩu plain-text (chỉ dùng dev/mock).
 * @property {string} displayName - Tên hiển thị trên giao diện.
 * @property {string} initial - Ký tự viết tắt cho avatar placeholder.
 * @property {'moderator' | 'admin'} role - Vai trò hệ thống.
 * @property {string} roleLabel - Nhãn vai trò tiếng Việt.
 * @property {number} unreadNotifications - Số thông báo chưa đọc (demo).
 */

/**
 * Danh sách tài khoản moderator và admin dùng cho đăng nhập mock.
 *
 * @constant {ReadonlyArray<ModeratorTestAccount>}
 * @readonly
 *
 * @example
 * // mod_sehub / mod123 hoặc moderator@sehubs.local / mod123
 * const account = findModeratorTestAccount('mod_sehub', 'mod123');
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
    displayName: "Quản trị SEHub",
    initial: "A",
    role: "admin",
    roleLabel: "Quản trị viên",
    unreadNotifications: 7,
  },
];

/**
 * @typedef {Object} PracticeExamAttachmentMock
 * @property {string} id - Định danh file đính kèm.
 * @property {string} name - Tên file hiển thị.
 * @property {string} sizeLabel - Nhãn dung lượng (ví dụ: `2.4 MB`).
 * @property {string} type - Loại file (`pdf`, `zip`, ...).
 * @property {'done' | 'uploading' | string} status - Trạng thái upload.
 * @property {number} progress - Tiến độ upload 0–100.
 */

/**
 * @typedef {Object} PracticeExamDraftMock
 * @property {string} subject - Mã môn học.
 * @property {string} semester - Nhãn học kỳ.
 * @property {string} title - Tiêu đề đề thực hành.
 * @property {string} description - Mô tả yêu cầu bài (markdown/plain).
 * @property {boolean} pinExam - Có ghim đề hay không.
 * @property {ReadonlyArray<PracticeExamAttachmentMock>} attachments - File đính kèm mẫu.
 */

/**
 * Bản nháp đề thực hành mẫu (form tạo đề) — dùng demo UI wizard.
 *
 * @constant {PracticeExamDraftMock}
 * @readonly
 */
export const PRACTICE_EXAM_DRAFT_MOCK = {
  subject: "PRF192",
  semester: "Học kỳ 5",
  title: "Đề thi giữa kỳ môn Lập trình Web",
  description:
    "Sinh viên nộp bài qua GitHub (public repo).\n\nYêu cầu:\n- Frontend: React hoặc Vue\n- Backend: Node.js hoặc .NET\n- Có README mô tả cách chạy dự án\n- Deadline: 23:59 Chủ nhật tuần 12",
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

/**
 * @typedef {Object} PracticeExamSubmissionMock
 * @property {string} id - Định danh bài nộp.
 * @property {string} studentName - Họ tên sinh viên.
 * @property {string} studentId - Mã sinh viên.
 * @property {string} githubUrl - URL repository GitHub.
 * @property {string} submittedAt - Thời điểm nộp (ISO 8601).
 * @property {string} status - Khóa trạng thái (`pending`, `reviewed`, `passed`, ...).
 * @property {string} statusLabel - Nhãn trạng thái tiếng Việt.
 */

/**
 * Danh sách bài nộp thực hành mẫu cho trang duyệt bài nộp Moderator.
 *
 * @constant {ReadonlyArray<PracticeExamSubmissionMock>}
 * @readonly
 */
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

/**
 * @typedef {Object} FinalExamInfoMock
 * @property {string} subjectCode - Mã môn.
 * @property {string} subjectName - Tên môn học.
 * @property {string} semesterLabel - Nhãn học kỳ đầy đủ.
 * @property {string} examCode - Mã đề thi hệ thống.
 * @property {number} durationMinutes - Thời lượng làm bài (phút).
 * @property {number} totalQuestions - Tổng số câu hỏi dự kiến.
 */

/**
 * Thông tin metadata đề cuối kỳ mẫu (bước info wizard).
 *
 * @constant {FinalExamInfoMock}
 * @readonly
 */
export const FINAL_EXAM_INFO_MOCK = {
  subjectCode: "IT005",
  subjectName: "Mạng máy tính",
  semesterLabel: "Học kỳ 1 2023-2024",
  examCode: "FE-IT005-SP2023",
  durationMinutes: 60,
  totalQuestions: 50,
};

/**
 * @typedef {Object} FinalExamSampleQuestion
 * @property {string} content - Nội dung câu hỏi.
 * @property {{ A: string, B: string, C: string, D: string }} answers - Bốn phương án trắc nghiệm.
 * @property {'A' | 'B' | 'C' | 'D'} correctAnswer - Đáp án đúng.
 * @property {string} explanation - Giải thích (có thể rỗng).
 * @property {boolean} showExplanation - Có hiển thị giải thích cho SV hay không.
 */

/**
 * Khung câu hỏi trống mẫu — dùng làm câu đang soạn (ví dụ câu 23/50).
 *
 * @constant {FinalExamSampleQuestion}
 * @readonly
 */
export const FINAL_EXAM_SAMPLE_QUESTION = {
  content: "",
  answers: { A: "", B: "", C: "", D: "" },
  correctAnswer: "A",
  explanation: "",
  showExplanation: false,
};

/**
 * @typedef {FinalExamSampleQuestion & { id: string }} FinalExamQuestionMock
 */

/**
 * Tạo danh sách câu hỏi đề cuối kỳ mock: 22 câu đã nhập + câu 23 đang soạn (theo Figma 23/50).
 *
 * @returns {ReadonlyArray<FinalExamQuestionMock>} Mảng 23 câu hỏi với `id` `q-1` … `q-23`.
 *
 * @example
 * const questions = buildFinalExamQuestionsMock();
 * // questions.length === 23
 * // questions[22].content === '' — câu đang soạn
 */
export function buildFinalExamQuestionsMock() {
  const filled = Array.from({ length: 22 }, (_, index) => ({
    id: `q-${index + 1}`,
    content: `Câu hỏi mẫu số ${index + 1} — nội dung đã lưu.`,
    answers: {
      A: `Đáp án A câu ${index + 1}`,
      B: `Đáp án B câu ${index + 1}`,
      C: `Đáp án C câu ${index + 1}`,
      D: `Đáp án D câu ${index + 1}`,
    },
    correctAnswer: "A",
    explanation: "",
    showExplanation: false,
  }));

  return [
    ...filled,
    {
      id: "q-23",
      ...FINAL_EXAM_SAMPLE_QUESTION,
    },
  ];
}

/**
 * @typedef {Object} StudentTestAccount
 * @property {string} username - Tên đăng nhập SV test.
 * @property {string} email - Email SV test.
 * @property {string} password - Mật khẩu plain-text (chỉ dev).
 * @property {string} displayName - Tên hiển thị.
 * @property {string} initial - Ký tự avatar.
 * @property {'student'} role - Vai trò sinh viên.
 * @property {'Basic' | 'Premium'} plan - Gói học tập (so sánh quyền tài liệu/đề TH).
 * @property {string} level - Hạng gamification.
 * @property {number} points - Điểm tích lũy.
 * @property {number} streak - Chuỗi ngày học liên tiếp.
 * @property {number} unreadNotifications - Thông báo chưa đọc.
 * @property {number} levelProgress - Tiến độ % lên hạng tiếp theo.
 * @property {number} pointsToNext - Điểm còn thiếu để lên hạng.
 */

/**
 * Tài khoản sinh viên demo — so sánh gói Basic vs Premium (tài liệu, đề thực hành, v.v.).
 *
 * @constant {ReadonlyArray<StudentTestAccount>}
 * @readonly
 */
export const STUDENT_TEST_ACCOUNTS = [
  {
    username: "student_basic",
    email: "basic@student.local",
    password: "basic123",
    displayName: "SV Basic",
    initial: "B",
    role: "student",
    plan: "Basic",
    level: "Bronze",
    points: 45,
    streak: 2,
    unreadNotifications: 1,
    levelProgress: 30,
    pointsToNext: 55,
  },
  {
    username: "student_premium",
    email: "premium@student.local",
    password: "premium123",
    displayName: "SV Premium",
    initial: "P",
    role: "student",
    plan: "Premium",
    level: "Gold",
    points: 920,
    streak: 14,
    unreadNotifications: 3,
    levelProgress: 72,
    pointsToNext: 80,
  },
];

/**
 * Tra cứu tài khoản trong danh sách theo username/email (không phân biệt hoa thường) và mật khẩu.
 *
 * @param {ReadonlyArray<{ username: string, email: string, password: string }>} accounts - Danh sách tài khoản nguồn.
 * @param {string} identifier - Username hoặc email người dùng nhập.
 * @param {string} password - Mật khẩu người dùng nhập.
 * @returns {object | null} Bản ghi tài khoản khớp, hoặc `null` nếu không tìm thấy / identifier rỗng.
 */
function matchTestAccount(accounts, identifier, password) {
  const key = identifier?.trim().toLowerCase();
  if (!key) return null;

  return (
    accounts.find(
      (account) =>
        (account.username.toLowerCase() === key ||
          account.email.toLowerCase() === key) &&
        account.password === password,
    ) ?? null
  );
}

/**
 * Tìm tài khoản moderator/admin test theo định danh đăng nhập.
 *
 * @param {string} identifier - Username hoặc email.
 * @param {string} password - Mật khẩu.
 * @returns {ModeratorTestAccount | null} Tài khoản khớp hoặc `null`.
 *
 * @example
 * findModeratorTestAccount('moderator@sehubs.local', 'mod123');
 */
export function findModeratorTestAccount(identifier, password) {
  return matchTestAccount(MODERATOR_TEST_ACCOUNTS, identifier, password);
}

/**
 * Tìm tài khoản sinh viên test theo định danh đăng nhập.
 *
 * @param {string} identifier - Username hoặc email.
 * @param {string} password - Mật khẩu.
 * @returns {StudentTestAccount | null} Tài khoản khớp hoặc `null`.
 *
 * @example
 * findStudentTestAccount('student_premium', 'premium123');
 */
export function findStudentTestAccount(identifier, password) {
  return matchTestAccount(STUDENT_TEST_ACCOUNTS, identifier, password);
}

/**
 * Tìm tài khoản test bất kỳ — ưu tiên moderator/admin trước, sau đó sinh viên.
 *
 * @param {string} identifier - Username hoặc email.
 * @param {string} password - Mật khẩu.
 * @returns {ModeratorTestAccount | StudentTestAccount | null} Tài khoản khớp hoặc `null`.
 *
 * @example
 * const user = findTestAccount('mod_sehub', 'mod123');
 * if (user) login(toAuthUser(user));
 */
export function findTestAccount(identifier, password) {
  return (
    findModeratorTestAccount(identifier, password) ??
    findStudentTestAccount(identifier, password)
  );
}

/**
 * @typedef {Omit<ModeratorTestAccount | StudentTestAccount, 'password'> & {
 *   level: string,
 *   points: number,
 *   streak: number,
 *   levelProgress: number,
 *   pointsToNext: number,
 *   plan?: string,
 *   isPremium: boolean,
 * }} AuthUser
 */

/**
 * Chuyển bản ghi tài khoản mock thành object user cho phiên đăng nhập (loại bỏ `password`).
 *
 * Bổ sung giá trị mặc định cho level/points/streak nếu thiếu và tính `isPremium` qua `resolveIsPremium`.
 *
 * @param {ModeratorTestAccount | StudentTestAccount} account - Tài khoản nguồn từ mock data.
 * @returns {AuthUser} User object an toàn cho auth state (không chứa password).
 *
 * @example
 * const raw = findStudentTestAccount('student_basic', 'basic123');
 * const sessionUser = toAuthUser(raw);
 * // sessionUser.isPremium === false
 */
export function toAuthUser(account) {
  const { password: _password, plan, ...user } = account;
  const normalized = {
    ...user,
    level: user.level ?? "Gold",
    points: user.points ?? 1280,
    streak: user.streak ?? 12,
    levelProgress: user.levelProgress ?? 82,
    pointsToNext: user.pointsToNext ?? 120,
    plan: plan ?? user.plan,
  };
  return {
    ...normalized,
    isPremium: resolveIsPremium(normalized),
  };
}
