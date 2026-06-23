import {
  createEmptyAnswers,
  isMultiSelectQuestion,
  OPTION_LABELS,
  QUESTION_TYPES,
} from "@/features/exams/examQuestionTypes";

export const ANSWER_KEYS = OPTION_LABELS.slice(0, 4);

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
    questionType: QUESTION_TYPES.SINGLE,
    optionLabels: [...ANSWER_KEYS],
    answers: createEmptyAnswers(ANSWER_KEYS),
    correctAnswer: "A",
    correctAnswers: [],
    requiredSelectCount: null,
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

const INTERNAL_GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HTML_TAG_RE = /<[a-z][\s\S]*>/i;

export function isInternalGuid(value) {
  return INTERNAL_GUID_RE.test(String(value ?? "").trim());
}

export function sanitizeWizardQuestionContent(content) {
  const raw = String(content ?? "").trim();
  if (!raw || isInternalGuid(raw)) {
    return "";
  }

  if (HTML_TAG_RE.test(raw)) {
    return raw
      .replace(/<p>\s*[0-9a-f-]{36}\s*<\/p>/gi, "")
      .replace(/<div>\s*[0-9a-f-]{36}\s*<\/div>/gi, "")
      .replace(INTERNAL_GUID_RE, "")
      .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />")
      .trim();
  }

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !isInternalGuid(line))
    .join("\n")
    .trim();
}

function sanitizeWizardAnswerText(text) {
  const value = String(text ?? "").trim();
  return isInternalGuid(value) ? "" : value;
}

function normalizeOptionId(value) {
  return String(value ?? "").toLowerCase();
}

export const MARKDOWN_IMPORT_PLACEHOLDER = `## Câu 1
Nội dung câu hỏi?

A. Phương án A
B. Phương án B
C. Phương án C
D. Phương án D

**Đáp án: B**

---

## Câu 2 [MULTI:3]
Chọn đúng 3 đáp án:

A. ...
B. ...
C. ...
D. ...
E. ...
F. ...

**Đáp án: A, C, E**`;

function mapQuestionOptionsToWizardAnswers(options = []) {
  const answers = createEmptyAnswers(OPTION_LABELS);
  const optionLabels = [];

  for (const option of options) {
    const label = String(option.label ?? option.Label ?? "")
      .trim()
      .toUpperCase();
    if (OPTION_LABELS.includes(label)) {
      answers[label] = sanitizeWizardAnswerText(option.text ?? option.Text ?? "");
      optionLabels.push(label);
    }
  }

  return {
    answers,
    optionLabels: optionLabels.length > 0 ? optionLabels : [...ANSWER_KEYS],
  };
}

export function mapImportedExamQuestions(apiQuestions = [], importWarnings = []) {
  const warningsByQuestion = indexImportWarnings(importWarnings);

  return apiQuestions.map((question, index) => {
    const options = question.options ?? [];
    const { answers, optionLabels } = mapQuestionOptionsToWizardAnswers(options);
    const questionType = question.questionType ?? question.QuestionType ?? QUESTION_TYPES.SINGLE;
    const isMulti = String(questionType).toLowerCase() === "multiselect";

    let correctAnswer = "A";
    let correctAnswers = [];
    const correctOptionIds = (question.correctOptionIds ?? question.CorrectOptionIds ?? []).map(
      normalizeOptionId,
    );

    if (correctOptionIds.length > 0) {
      correctAnswers = options
        .filter((option) =>
          correctOptionIds.includes(normalizeOptionId(option.id ?? option.Id)),
        )
        .map((option) => String(option.label ?? option.Label ?? "").trim().toUpperCase())
        .filter((label) => OPTION_LABELS.includes(label));
    } else {
      const correctOptionId = normalizeOptionId(
        question.correctOptionId ?? question.CorrectOptionId,
      );
      const correctOption = options.find(
        (option) => normalizeOptionId(option.id ?? option.Id) === correctOptionId,
      );
      const label = String(correctOption?.label ?? correctOption?.Label ?? "")
        .trim()
        .toUpperCase();
      if (OPTION_LABELS.includes(label)) {
        correctAnswer = label;
        correctAnswers = [label];
      }
    }

    if (isMulti && correctAnswers.length === 0) {
      correctAnswers = ["A"];
    }

    const orderIndex = question.orderIndex ?? question.OrderIndex ?? index + 1;
    const rawContent = question.content ?? question.Content ?? "";
    const content = sanitizeWizardQuestionContent(rawContent);

    return {
      id: `q-${orderIndex}`,
      orderIndex,
      content,
      questionType,
      optionLabels,
      answers,
      correctAnswer: correctAnswers[0] ?? correctAnswer,
      correctAnswers: isMulti ? correctAnswers : [],
      requiredSelectCount: question.requiredSelectCount ?? question.RequiredSelectCount ?? null,
      explanation: "",
      showExplanation: false,
      importWarnings: warningsByQuestion.get(orderIndex) ?? [],
    };
  });
}

const IMPORT_WARNING_QUESTION_RE = /^Câu\s+(\d+)\s*:/iu;

export function parseImportWarningQuestionNumber(warning) {
  const match = String(warning ?? "").match(IMPORT_WARNING_QUESTION_RE);
  return match ? Number(match[1]) : null;
}

export function indexImportWarnings(warnings = []) {
  const byQuestion = new Map();

  for (const warning of warnings) {
    const questionNumber = parseImportWarningQuestionNumber(warning);
    if (questionNumber == null) continue;

    if (!byQuestion.has(questionNumber)) {
      byQuestion.set(questionNumber, []);
    }

    byQuestion.get(questionNumber).push(warning);
  }

  return byQuestion;
}

export function formatImportWarningSummary(warnings = []) {
  if (warnings.length === 0) {
    return "";
  }

  return warnings
    .map((warning) => {
      const questionNumber = parseImportWarningQuestionNumber(warning);
      const detail = warning.replace(IMPORT_WARNING_QUESTION_RE, "").trim();
      return questionNumber ? `Câu ${questionNumber}: ${detail}` : warning;
    })
    .join("\n");
}

export function isQuestionComplete(question) {
  if (!question.content?.trim()) return false;

  const labels = question.optionLabels ?? ANSWER_KEYS;
  const filledOptions = labels.filter((key) => question.answers?.[key]?.trim());
  if (filledOptions.length < 2) return false;

  if (isMultiSelectQuestion(question)) {
    const required = question.requiredSelectCount ?? question.correctAnswers?.length ?? 2;
    return (question.correctAnswers?.length ?? 0) >= required;
  }

  return Boolean(question.correctAnswer && question.answers?.[question.correctAnswer]?.trim());
}
