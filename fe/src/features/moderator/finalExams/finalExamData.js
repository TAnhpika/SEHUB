import {
  createEmptyAnswers,
  isMultiSelectQuestion,
  OPTION_LABELS,
  QUESTION_TYPES,
} from "@/features/exams/examQuestionTypes";
import { createDefaultExamTermFields } from "@/features/exams/finalExam/examTermOptions";

/**
 * @fileoverview Dữ liệu, hằng số và helper nghiệp vụ cho wizard đề cuối kỳ.
 *
 * Cung cấp:
 * - Cấu hình bước wizard, metadata mặc định, factory câu hỏi rỗng.
 * - Chuẩn hóa / làm sạch nội dung câu hỏi import (loại GUID nội bộ, HTML thừa).
 * - Map câu hỏi từ API import Markdown sang model wizard.
 * - Kiểm tra câu hỏi đã hoàn thiện đủ điều kiện gửi duyệt.
 *
 * @module features/moderator/finalExams/finalExamData
 */

/**
 * Các nhãn phương án đáp án mặc định (A–D) dùng trong wizard.
 *
 * @constant {ReadonlyArray<string>}
 * @readonly
 */
export const ANSWER_KEYS = OPTION_LABELS.slice(0, 4);

/**
 * Cấu hình 3 bước wizard mặc định cho route Moderator thêm đề mới.
 *
 * @constant {ReadonlyArray<{ id: number, path: string, title: string, hint: string }>}
 * @readonly
 */
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

/**
 * Sinh danh sách bước wizard với `basePath` tùy chỉnh (add hoặc edit).
 *
 * @param {string} [basePath="/moderator/final-exams/add"] - Đường dẫn gốc wizard.
 * @returns {Array<{ id: number, path: string, title: string, hint: string }>} 3 bước với path đã resolve.
 *
 * @example
 * getWizardSteps('/moderator/final-exams/edit/abc-123');
 * // => [{ path: '.../edit/abc-123' }, { path: '.../questions' }, { path: '.../review' }]
 */
export function getWizardSteps(basePath = "/moderator/final-exams/add") {
  return [
    { ...WIZARD_STEPS[0], path: basePath },
    { ...WIZARD_STEPS[1], path: `${basePath}/questions` },
    { ...WIZARD_STEPS[2], path: `${basePath}/review` },
  ];
}

/**
 * Metadata đề cuối kỳ mặc định khi tạo mới wizard.
 *
 * @constant {object}
 * @readonly
 */
export const EMPTY_FINAL_EXAM_INFO = {
  subjectCode: "",
  subjectName: "",
  major: "",
  semesterLabel: "",
  ...createDefaultExamTermFields(),
  examCode: "",
  durationMinutes: 60,
  totalQuestions: 50,
};

/**
 * Tạo object câu hỏi trống với cấu trúc wizard chuẩn.
 *
 * @param {string} id - Định danh nội bộ câu hỏi (ví dụ `q-1`).
 * @returns {object} Câu hỏi single-choice rỗng với 4 phương án A–D.
 */
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

/**
 * Parse và validate số câu hỏi từ input người dùng.
 *
 * @param {string | number | null | undefined} value - Giá trị nhập (ô số câu).
 * @returns {number | null} Số nguyên dương hoặc `null` nếu không hợp lệ.
 */
export function parseTotalQuestions(value) {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

/**
 * Tạo mảng câu hỏi rỗng theo số lượng yêu cầu.
 *
 * @param {string | number} count - Số câu hỏi mong muốn.
 * @returns {Array<object>} Mảng câu hỏi rỗng với id `q-1`, `q-2`, ...
 */
export function buildEmptyQuestions(count) {
  const total = parseTotalQuestions(count) ?? 1;
  return Array.from({ length: total }, (_, index) => createEmptyQuestion(`q-${index + 1}`));
}

const INTERNAL_GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HTML_TAG_RE = /<[a-z][\s\S]*>/i;

/**
 * Kiểm tra chuỗi có phải GUID nội bộ (placeholder từ API) hay không.
 *
 * @param {string | null | undefined} value - Chuỗi cần kiểm tra.
 * @returns {boolean} `true` nếu khớp định dạng UUID.
 */
export function isInternalGuid(value) {
  return INTERNAL_GUID_RE.test(String(value ?? "").trim());
}

/**
 * Làm sạch nội dung câu hỏi import — loại GUID nội bộ và HTML placeholder thừa.
 *
 * @param {string | null | undefined} content - Nội dung thô từ API hoặc Markdown.
 * @returns {string} Nội dung đã sanitize, chuỗi rỗng nếu chỉ còn GUID.
 */
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

/**
 * Ví dụ Markdown mẫu hiển thị trong panel import câu hỏi.
 *
 * Minh họa format single-choice, multi-select và câu tiếng Nhật.
 *
 * @constant {string}
 * @readonly
 */
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

**Đáp án: A, C, E**

---

## Câu 3
「あしたも 7時に学校へ行きます。」は正しい文です。

A. Đúng
B. Sai

**Đáp án: A**

---

## Câu 4
Chọn đáp án thích hợp trong A. B. C. D để điền vào ngoặc:
あしたも 7時に学校へ( ).

A. きます
B. ききます
C. はたらきます
D. おきます

**Đáp án: A**`;

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

/**
 * Map danh sách câu hỏi từ API import sang model wizard nội bộ.
 *
 * Gán đáp án đúng, loại câu hỏi, cảnh báo import theo từng câu.
 *
 * @param {Array<object>} [apiQuestions=[]] - Câu hỏi trả về từ API parse Markdown.
 * @param {Array<string>} [importWarnings=[]] - Cảnh báo import (ví dụ câu không hợp lệ).
 * @returns {Array<object>} Câu hỏi đã map sang cấu trúc wizard.
 */
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

/**
 * Trích số thứ tự câu hỏi từ chuỗi cảnh báo import.
 *
 * @param {string} warning - Cảnh báo dạng `Câu 3: ...`.
 * @returns {number | null} Số câu hoặc `null` nếu không parse được.
 */
export function parseImportWarningQuestionNumber(warning) {
  const match = String(warning ?? "").match(IMPORT_WARNING_QUESTION_RE);
  return match ? Number(match[1]) : null;
}

/**
 * Nhóm cảnh báo import theo số thứ tự câu hỏi.
 *
 * @param {Array<string>} [warnings=[]] - Danh sách cảnh báo từ API import.
 * @returns {Map<number, Array<string>>} Map `questionNumber → warnings[]`.
 */
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

/**
 * Gộp danh sách cảnh báo import thành chuỗi tóm tắt hiển thị cho người dùng.
 *
 * @param {Array<string>} [warnings=[]] - Cảnh báo import gốc.
 * @returns {string} Chuỗi nhiều dòng hoặc rỗng nếu không có cảnh báo.
 */
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

/**
 * Kiểm tra câu hỏi đã đủ điều kiện coi là hoàn thiện để gửi duyệt.
 *
 * Yêu cầu: có nội dung, ít nhất 2 phương án có text, và đáp án đúng hợp lệ
 * (single hoặc multi-select đủ số lượng bắt buộc).
 *
 * @param {object} question - Câu hỏi wizard.
 * @returns {boolean} `true` nếu câu hỏi hoàn chỉnh.
 */
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
