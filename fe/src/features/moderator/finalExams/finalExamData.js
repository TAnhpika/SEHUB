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

export function getWizardSteps(basePath = "/moderator/final-exams/add") {
  return [
    { ...WIZARD_STEPS[0], path: basePath },
    { ...WIZARD_STEPS[1], path: `${basePath}/questions` },
    { ...WIZARD_STEPS[2], path: `${basePath}/review` },
  ];
}

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

export const MARKDOWN_IMPORT_PLACEHOLDER = `## Câu 1
Nội dung câu hỏi?

A. Phương án A
B. Phương án B
C. Phương án C
D. Phương án D

**Đáp án: B**

---

## Câu 2
Câu hỏi tiếp theo...`;

export function mapImportedExamQuestions(apiQuestions = []) {
  return apiQuestions.map((question, index) => {
    const options = question.options ?? [];
    const answers = { A: "", B: "", C: "", D: "" };
    let correctAnswer = "A";

    for (const option of options) {
      const label = String(option.label ?? option.Label ?? "")
        .trim()
        .toUpperCase();
      if (ANSWER_KEYS.includes(label)) {
        answers[label] = option.text ?? option.Text ?? "";
      }
    }

    const correctOptionId = question.correctOptionId ?? question.CorrectOptionId;
    if (correctOptionId) {
      const correctOption = options.find(
        (option) => (option.id ?? option.Id) === correctOptionId,
      );
      const label = String(correctOption?.label ?? correctOption?.Label ?? "")
        .trim()
        .toUpperCase();
      if (ANSWER_KEYS.includes(label)) {
        correctAnswer = label;
      }
    }

    return {
      id: `q-${index + 1}`,
      content: question.content ?? question.Content ?? "",
      answers,
      correctAnswer,
      explanation: "",
      showExplanation: false,
    };
  });
}
