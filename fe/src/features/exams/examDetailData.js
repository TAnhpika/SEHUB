import * as examsApi from "@/api/examsApi";
import {
  mapAiExplainResponse,
  mapExamDetailDtoToFeExam,
  mapQuestionAnswerDto,
  mapQuestionPublicDto,
} from "@/api/examMapper";
import {
  getExamById as getMockExamById,
  loadExamPapersForCourse,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import { isValidGuid } from "@/features/feed/postUtils";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export { USE_MOCK as EXAM_USE_MOCK };

export const DEMO_API_EXAM_CODES = {
  final: "PRF192-FINAL-01",
  practice: "PRF192-LAB-01",
};

export const SAMPLE_QUESTION = {
  text: "Which is a function in C language?",
  correctAnswer: "B",
  options: [
    { key: "A", label: "is_prime()" },
    { key: "B", label: "#include()" },
    { key: "C", label: "int()" },
    { key: "D", label: "if()" },
    { key: "E", label: "return()" },
    { key: "F", label: "2ndElement()" },
  ],
};

const REVIEW_QUESTION_TEMPLATES = [
  SAMPLE_QUESTION,
  {
    text: "What is the output of printf(\"%d\", 5 + 3 * 2);?",
    correctAnswer: "B",
    options: [
      { key: "A", label: "16" },
      { key: "B", label: "11" },
      { key: "C", label: "13" },
      { key: "D", label: "10" },
    ],
  },
  {
    text: "Which keyword is used to define a constant in C?",
    correctAnswer: "A",
    options: [
      { key: "A", label: "const" },
      { key: "B", label: "define" },
      { key: "C", label: "constant" },
      { key: "D", label: "fixed" },
    ],
  },
  {
    text: "What does the sizeof operator return?",
    correctAnswer: "B",
    options: [
      { key: "A", label: "Value of a variable" },
      { key: "B", label: "Size of a data type in bytes" },
      { key: "C", label: "Address of a variable" },
      { key: "D", label: "Number of elements in an array" },
    ],
  },
  {
    text: "Which header file is required for printf()?",
    correctAnswer: "B",
    options: [
      { key: "A", label: "<stdlib.h>" },
      { key: "B", label: "<stdio.h>" },
      { key: "C", label: "<string.h>" },
      { key: "D", label: "<math.h>" },
    ],
  },
  {
    text: "What is the correct way to declare a pointer to int?",
    correctAnswer: "B",
    options: [
      { key: "A", label: "int ptr;" },
      { key: "B", label: "int *ptr;" },
      { key: "C", label: "pointer int ptr;" },
      { key: "D", label: "int &ptr;" },
    ],
  },
  {
    text: "Which loop executes at least once?",
    correctAnswer: "C",
    options: [
      { key: "A", label: "for" },
      { key: "B", label: "while" },
      { key: "C", label: "do-while" },
      { key: "D", label: "foreach" },
    ],
  },
  {
    text: "What is the default return type of a function in C if not specified?",
    correctAnswer: "B",
    options: [
      { key: "A", label: "void" },
      { key: "B", label: "int" },
      { key: "C", label: "float" },
      { key: "D", label: "char" },
    ],
  },
];

const PRACTICE_ITEM_TEMPLATES = [
  "Viết chương trình C đọc danh sách số nguyên từ bàn phím, tính tổng và in kết quả.",
  "Tạo lớp Student với các thuộc tính id, name, gpa và phương thức hiển thị thông tin.",
  "Xây dựng API REST đơn giản với các endpoint GET/POST cho tài nguyên Product.",
  "Thiết kế giao diện form đăng nhập và xử lý validate phía client.",
  "Viết hàm kiểm tra số nguyên tố và áp dụng cho mảng n phần tử nhập từ người dùng.",
];

const DOCUMENT_ITEM_TEMPLATES = [
  "Slide bài giảng — Chương 1: Giới thiệu môn học và yêu cầu đánh giá.",
  "Tài liệu tham khảo — Hướng dẫn cài đặt môi trường và công cụ phát triển.",
  "Đề cương chi tiết — Mục tiêu học tập và rubric chấm điểm.",
  "Bài tập thực hành — Danh sách lab và deadline nộp bài.",
  "FAQ — Câu hỏi thường gặp về quy trình học và thi.",
];

function buildReviewQuestions(count) {
  return Array.from({ length: count }, (_, index) => {
    const template = REVIEW_QUESTION_TEMPLATES[index % REVIEW_QUESTION_TEMPLATES.length];

    return {
      id: index + 1,
      kind: "review",
      text: template.text,
      correctAnswer: template.correctAnswer,
      options: template.options.map((option) => ({ ...option })),
    };
  });
}

function buildPracticeItems(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    kind: "practice",
    text: PRACTICE_ITEM_TEMPLATES[index % PRACTICE_ITEM_TEMPLATES.length],
  }));
}

function buildDocumentItems(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    kind: "document",
    text: DOCUMENT_ITEM_TEMPLATES[index % DOCUMENT_ITEM_TEMPLATES.length],
  }));
}

export function buildExamQuestions(count, pageKey) {
  if (pageKey === "review") {
    return buildReviewQuestions(count);
  }

  if (pageKey === "practice") {
    return buildPracticeItems(resolvePracticeQuestionCount(count));
  }

  return buildDocumentItems(count);
}

export const EXAM_TYPE_LABELS = {
  review: "FINAL",
  practice: "PRACTICE",
  documents: "DOCUMENT",
};

export const EXAM_PREVIEW_LABELS = {
  review: "Câu hỏi",
  practice: "Bài thực hành",
  documents: "Tài liệu",
};

export async function resolveExamApiId(examIdOrCode) {
  if (USE_MOCK) return null;

  const value = String(examIdOrCode ?? "").trim();
  if (!value) return null;
  if (isValidGuid(value)) return value;

  const list = await examsApi.listExams({ pageSize: 100 });
  const match = (list.items ?? []).find(
    (item) => item.code?.toLowerCase() === value.toLowerCase(),
  );
  return match?.id ?? null;
}

export function resolvePracticeQuestionCount(count) {
  const parsed = Number(count);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

async function resolveExamApiIdFromPaperList(courseCode, examId, pageKey) {
  if (!courseCode || !examId || (pageKey !== "review" && pageKey !== "practice")) {
    return null;
  }

  const papers = await loadExamPapersForCourse(courseCode, pageKey);
  const normalizedExamId = String(examId).trim();
  const paper = papers.find(
    (item) =>
      item.id === normalizedExamId
      || item.paperCode === normalizedExamId
      || String(item.apiId) === normalizedExamId,
  );
  return paper?.apiId ?? null;
}

export async function loadExamMeta(courseCode, examId, pageKey, scope = "community", options = {}) {
  if (!USE_MOCK) {
    let apiExamId = options.apiExamId ?? null;
    if (!apiExamId) {
      apiExamId = await resolveExamApiId(examId);
    }
    if (!apiExamId) {
      apiExamId = await resolveExamApiIdFromPaperList(courseCode, examId, pageKey);
    }

    if (apiExamId) {
      const detail = await examsApi.getExam(apiExamId);
      return {
        exam: mapExamDetailDtoToFeExam(detail, courseCode),
        apiExamId,
        source: "api",
      };
    }

    return null;
  }

  const mockExam = getMockExamById(courseCode, examId, pageKey, scope);
  if (mockExam) {
    return { exam: mockExam, apiExamId: null, source: "mock" };
  }

  return null;
}

export async function loadReviewQuestions(apiExamId, fallbackCount, pageKey) {
  if (pageKey !== "review") {
    return buildExamQuestions(fallbackCount, pageKey);
  }

  if (USE_MOCK || !apiExamId) {
    return buildExamQuestions(fallbackCount, pageKey);
  }

  try {
    const questionDtos = await examsApi.getQuestions(apiExamId);
    if ((questionDtos ?? []).length > 0) {
      return questionDtos.map(mapQuestionPublicDto);
    }
  } catch {
    /* API mode: no mock fallback */
  }

  return [];
}

export async function loadQuestionWithAnswer(apiExamId, questionId) {
  if (USE_MOCK || !apiExamId || !questionId) {
    return null;
  }

  const dto = await examsApi.getQuestionWithAnswer(apiExamId, questionId);
  return mapQuestionAnswerDto(dto);
}

export async function loadAiExplanation(questionId, context) {
  if (USE_MOCK || !questionId || !isValidGuid(String(questionId))) {
    return null;
  }

  const response = await examsApi.aiExplain(questionId, { questionId, context });
  return mapAiExplainResponse(response);
}

export async function loadPracticeExamMeta(courseCode, examId, scope = "community") {
  return loadExamMeta(courseCode, examId, "practice", scope);
}
