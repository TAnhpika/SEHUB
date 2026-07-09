export const EXAMS_PER_PAGE = 5;

export const YEAR_OPTIONS = [
  { value: "all", label: "Tất cả năm" },
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
];

export const TERM_OPTIONS = [
  { value: "all", label: "Tất cả kỳ học" },
  { value: "SP", label: "Spring" },
  { value: "SU", label: "Summer" },
  { value: "FA", label: "Fall" },
];

import * as examsApi from "@/api/examsApi";
import { getStudentDocumentsBySubject } from "@/features/admin/documents/adminDocumentData";
import { normalizeCourseSubjectCode, resolvePublicExamName } from "@/utils/examDisplay";
import { parseExamPaperCode } from "@/utils/examPaperCode";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const PAGE_EXAM_API_META = {
  review: { apiType: "Final", typeLabel: "Cuối kỳ" },
  practice: { apiType: "Practice", typeLabel: "Thực hành" },
};

const TERM_LABELS = { SP: "Spring", SU: "Summer", FA: "Fall" };

const SUBJECT_DETAIL_META = {
  review: {
    titlePrefix: "Đề thi cuối kỳ",
    examType: "Cuối kỳ",
    codePrefix: "FE",
    pageKey: "review",
  },
  practice: {
    titlePrefix: "Đề thi thực hành",
    examType: "Thực hành",
    codePrefix: "PE",
    pageKey: "practice",
  },
  documents: {
    titlePrefix: "Tài liệu học tập",
    examType: "Tài liệu",
    codePrefix: "FE",
    pageKey: "documents",
  },
};

/** @deprecated Dùng getSubjectDetailConfig(pageKey, scope) */
export const SUBJECT_DETAIL_CONFIG = Object.fromEntries(
  Object.entries(SUBJECT_DETAIL_META).map(([key, meta]) => [
    key,
    {
      ...meta,
      backTo: getSubjectCatalogPath(meta.pageKey, "community"),
      detailBase: getSubjectCatalogPath(meta.pageKey, "community"),
    },
  ]),
);

/**
 * @param {"review" | "practice" | "documents"} pageKey
 * @param {"community" | "home"} [scope="community"]
 */
export function getSubjectDetailConfig(pageKey, scope = "community") {
  const meta = SUBJECT_DETAIL_META[pageKey];
  if (!meta) return null;

  const catalogPath = getSubjectCatalogPath(meta.pageKey, scope);
  return {
    ...meta,
    backTo: catalogPath,
    detailBase: catalogPath,
  };
}

const YEARS = [2024, 2025, 2026];
const TERMS = [
  { code: "SP", label: "Spring" },
  { code: "SU", label: "Summer" },
  { code: "FA", label: "Fall" },
];

const UPLOAD_TIMES = [
  "2025-11-17, 17:46:20",
  "2025-11-17, 17:45:18",
  "2025-11-17, 17:44:47",
  "2025-11-17, 17:44:06",
  "2025-11-17, 17:43:29",
  "2025-11-17, 15:03:06",
  "2024-10-23, 22:54:46",
];

function buildExamCode(courseCode, termCode, year) {
  const yy = String(year).slice(-2);
  return `${courseCode}_${termCode}${yy}`;
}

export function getDocumentItemsForCourse(courseCode) {
  const normalized = courseCode?.toUpperCase() ?? "";
  const docs = getStudentDocumentsBySubject(normalized, "all");

  if (docs.length > 0) {
    return docs.map((doc) => ({
      id: doc.id,
      courseCode: doc.subject,
      name: doc.name,
      year: "2026",
      term: "SP",
      termLabel: "Spring",
      uploadedAt: doc.uploadedAt,
      type: doc.name?.match(/\.([^.]+)$/)?.[1]?.toUpperCase() ?? "—",
      questionCount: doc.pages,
      document: doc,
    }));
  }

  return getExamPapersForCourse(normalized, "Tài liệu", "DOC");
}

export function getExamPapersForCourse(courseCode, examType, codePrefix = "FE") {
  const normalized = courseCode.toUpperCase();
  const exams = [];

  YEARS.forEach((year) => {
    TERMS.forEach((term, termIndex) => {
      const paperCode = buildExamCode(normalized, term.code, year);
      exams.push({
        id: paperCode,
        paperCode,
        courseCode: normalized,
        year: String(year),
        term: term.code,
        termLabel: term.label,
        uploadedAt: UPLOAD_TIMES[(year + termIndex) % UPLOAD_TIMES.length],
        type: examType,
        questionCount: 48 + ((year + termIndex) % 5),
      });
    });
  });

  const extraPaper = buildExamCode(normalized, "SP", 2025);
  exams.push({
    id: extraPaper,
    paperCode: extraPaper,
    courseCode: normalized,
    year: "2025",
    term: "SP",
    termLabel: "Spring",
    uploadedAt: "2025-11-17, 17:43:29",
    type: examType,
    questionCount: 50,
  });

  return exams.sort((a, b) => {
    if (b.year !== a.year) return Number(b.year) - Number(a.year);
    const termOrder = { SP: 0, SU: 1, FA: 2 };
    return termOrder[a.term] - termOrder[b.term];
  });
}

export function filterExamPapers(exams, yearFilter, termFilter) {
  return exams.filter((exam) => {
    const matchYear = yearFilter === "all" || exam.year === yearFilter;
    const matchTerm = termFilter === "all" || exam.term === termFilter;
    return matchYear && matchTerm;
  });
}

function formatExamUploadedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function mapApiExamListItemToPaper(dto, courseCode, typeLabel) {
  const paperCode = dto.paperCode ?? dto.title ?? dto.subjectCode ?? dto.code ?? dto.id;
  const displayCode = resolvePublicExamName({
    code: paperCode,
    title: paperCode,
    subjectCode: dto.subjectCode ?? dto.code,
    description: dto.description,
  });
  const parsed = parseExamPaperCode(paperCode) ?? parseExamPaperCode(displayCode);
  const createdAt = dto.createdAt ?? dto.updatedAt;

  return {
    id: displayCode,
    paperCode,
    apiId: dto.id,
    courseCode: courseCode.toUpperCase(),
    year: parsed?.year ?? String(new Date(createdAt).getFullYear()),
    term: parsed?.season ?? "SP",
    termLabel: TERM_LABELS[parsed?.season] ?? parsed?.season ?? "—",
    uploadedAt: formatExamUploadedAt(createdAt),
    type: typeLabel,
    questionCount: dto.questionCount ?? 0,
    isPinned: Boolean(dto.isPinned),
  };
}

export async function loadExamPapersForCourse(courseCode, pageKey) {
  const meta = PAGE_EXAM_API_META[pageKey];
  if (!meta) {
    return [];
  }

  if (USE_MOCK) {
    const config = SUBJECT_DETAIL_META[pageKey];
    return getExamPapersForCourse(
      courseCode?.toUpperCase() ?? "",
      config?.examType ?? "Cuối kỳ",
      config?.codePrefix ?? "FE",
    );
  }

  const subjectCode =
    normalizeCourseSubjectCode(courseCode) ?? courseCode?.toUpperCase() ?? "";
  if (!subjectCode) {
    return [];
  }

  const page = await examsApi.listExams({
    code: subjectCode,
    type: meta.apiType,
    pageSize: 100,
  });

  return (page.items ?? [])
    .map((dto) => mapApiExamListItemToPaper(dto, courseCode, meta.typeLabel))
    .sort((a, b) => {
      if (Boolean(b.isPinned) !== Boolean(a.isPinned)) {
        return Number(b.isPinned) - Number(a.isPinned);
      }
      if (b.year !== a.year) {
        return Number(b.year) - Number(a.year);
      }
      const termOrder = { SP: 0, SU: 1, FA: 2 };
      return (termOrder[a.term] ?? 0) - (termOrder[b.term] ?? 0);
    });
}

export async function loadExamById(courseCode, examId, pageKey, scope = "community") {
  if (USE_MOCK) {
    return getExamById(courseCode, examId, pageKey, scope);
  }

  const config = getSubjectDetailConfig(pageKey, scope);
  if (!config) return null;

  const normalizedCode = courseCode?.toUpperCase() ?? "";

  if (pageKey === "documents") {
    const { loadDocumentItemsForCourse } = await import(
      "@/features/documents/studentDocumentsData"
    );
    const docs = await loadDocumentItemsForCourse(normalizedCode);
    return docs.find((item) => item.id === examId) ?? null;
  }

  const papers = await loadExamPapersForCourse(courseCode, pageKey);
  const paper = papers.find(
    (exam) =>
      exam.id === examId
      || exam.paperCode === examId
      || String(exam.apiId) === String(examId),
  );
  if (paper) {
    return paper;
  }

  return null;
}

export function getExamById(courseCode, examId, pageKey, scope = "community") {
  const config = getSubjectDetailConfig(pageKey, scope);
  if (!config) return null;

  const normalizedCode = courseCode?.toUpperCase() ?? "";

  if (pageKey === "documents") {
    const docs = getDocumentItemsForCourse(normalizedCode);
    return docs.find((item) => item.id === examId) ?? null;
  }

  const exams = getExamPapersForCourse(normalizedCode, config.examType, config.codePrefix);
  return (
    exams.find(
      (exam) =>
        exam.id === examId || exam.paperCode === examId || String(exam.apiId) === String(examId),
    ) ?? null
  );
}
