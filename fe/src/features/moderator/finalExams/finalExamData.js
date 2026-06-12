export const ANSWER_KEYS = ["A", "B", "C", "D"];

export const WIZARD_STEPS = [
  {
    id: 1,
    path: "/moderator/final-exams/add",
    title: "Bước 1: Thông tin đề thi",
    hint: "Mã môn, học kỳ, thời gian...",
  },
  {
    id: 2,
    path: "/moderator/final-exams/add/questions",
    title: "Bước 2: Nhập câu hỏi",
    hint: "Nội dung, đáp án, giải thích",
  },
  {
    id: 3,
    path: "/moderator/final-exams/add/review",
    title: "Bước 3: Xem lại",
    hint: "Kiểm tra & xuất bản",
  },
];

export const EMPTY_FINAL_EXAM_INFO = {
  subjectCode: "",
  subjectName: "",
  semesterLabel: "",
  examCode: "",
  durationMinutes: 60,
  totalQuestions: 50,
};

export function createEmptyQuestion(id) {
  return {
    id,
    content: "",
    answers: { A: "", B: "", C: "", D: "" },
    correctAnswer: "A",
    explanation: "",
    showExplanation: false,
  };
}

export function parseTotalQuestions(value) {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

export function buildEmptyQuestions(count) {
  const total = parseTotalQuestions(count) ?? 1;
  return Array.from({ length: total }, (_, index) => createEmptyQuestion(`q-${index + 1}`));
}
