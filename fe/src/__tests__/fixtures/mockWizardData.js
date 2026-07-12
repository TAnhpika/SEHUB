export const mockWizardExamInfo = {
  subjectCode: "PRF192",
  subjectName: "Programming Fundamentals",
  major: "SE",
  semesterLabel: "Học kỳ 3",
  examCode: "FE-PRF192-SU2026-1",
  durationMinutes: 90,
};

export const mockWizardSingleQuestion = {
  id: "q-1",
  content: "Câu hỏi single choice?",
  questionType: "single",
  optionLabels: ["A", "B", "C", "D"],
  answers: { A: "Đáp án A", B: "Đáp án B", C: "", D: "" },
  correctAnswer: "A",
  correctAnswers: [],
};

export const mockWizardMultiQuestion = {
  id: "q-2",
  content: "Chọn hai đáp án đúng",
  questionType: "multiselect",
  optionLabels: ["A", "B", "C", "D"],
  answers: { A: "Một", B: "Hai", C: "Ba", D: "Bốn" },
  correctAnswer: "A",
  correctAnswers: ["A", "C"],
  requiredSelectCount: 2,
};

export const mockWizardEmptyQuestion = {
  id: "q-empty",
  content: "",
  questionType: "single",
  answers: { A: "", B: "", C: "", D: "" },
  correctAnswer: "A",
};

export const mockPendingExamDto = {
  id: "pending-001",
  examType: "Practice",
  status: "Pending",
  subjectCode: "SWE201c",
  paperCode: "PE-SWE201c-SU2026-1",
  questionCount: 0,
  semester: 2,
  description: "Mô tả đề thực hành\n\nNộp link repository GitHub công khai.",
  createdAt: "2026-07-01T08:00:00Z",
  submittedByUsername: "demo_student",
  attachments: [
    {
      id: "att-p1",
      originalFileName: "de-thuc-hanh.zip",
      contentType: "application/zip",
      fileSize: 2048000,
      viewPath: "/api/v1/exams/pending-001/attachments/att-p1/view",
    },
  ],
};

export const mockRejectedExamDto = {
  ...mockPendingExamDto,
  id: "rejected-001",
  status: "Rejected",
  rejectionReasonCode: "duplicate",
  rejectionReasonDetail: "Trùng SHA với đề đã publish",
  rejectedAt: "2026-07-02T10:00:00Z",
  updatedAt: "2026-07-02T10:00:00Z",
};

export const mockApprovedExamDto = {
  ...mockPendingExamDto,
  id: "approved-001",
  status: "Published",
  updatedAt: "2026-07-03T12:00:00Z",
};

export const mockExamDetailForWizard = {
  id: "exam-wizard-001",
  subjectCode: "PRF192",
  paperCode: "FE-PRF192-SU2026-1",
  semester: 3,
  major: "SE",
  description: "Programming Fundamentals · 75 phút",
  questionCount: 2,
  questions: [
    {
      orderIndex: 1,
      content: "Câu 1 từ API",
      questionType: "SingleChoice",
      options: [
        { id: "opt-1", label: "A", text: "Alpha" },
        { id: "opt-2", label: "B", text: "Beta" },
      ],
      correctOptionIds: ["opt-1"],
    },
  ],
  canResubmit: true,
  isContentLocked: false,
};

export const mockPracticeExamDetailDto = {
  id: "practice-detail-001",
  subjectCode: "SWE201c",
  paperCode: "PE-SWE201c-SU2026-1",
  semester: 2,
  description: "Mô tả ngắn\n\nHướng dẫn GitHub chi tiết",
  attachments: [
    {
      id: "att-zip",
      originalFileName: "project.zip",
      contentType: "application/zip",
      fileSize: 5242880,
    },
  ],
};

export const mockOcrQuestions = [
  {
    orderIndex: 1,
    content: "OCR câu hỏi",
    questionType: "SingleChoice",
    options: ["Đáp án 1", "Đáp án 2"],
    correct: 0,
  },
  {
    content: "Multi OCR",
    questionType: "MultiSelect",
    options: [
      { id: "a-id", label: "A", text: "A text" },
      { id: "b-id", label: "B", text: "B text" },
    ],
    correctOptionIds: ["a-id", "b-id"],
  },
];
