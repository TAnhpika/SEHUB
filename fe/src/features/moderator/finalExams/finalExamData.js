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

export function createEmptyFinalExamInfo() {
  return {
    subjectCode: "",
    subjectName: "",
    semesterLabel: "",
    examCode: "",
    durationMinutes: 60,
    totalQuestions: 50,
  };
}

export function clampQuestionTotal(value, fallback = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(1, Math.round(parsed)));
}
