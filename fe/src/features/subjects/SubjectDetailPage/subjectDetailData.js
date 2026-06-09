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

import { getStudentDocumentsBySubject } from "@/features/admin/documents/adminDocumentData";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";

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

function buildExamCode(courseCode, termCode, year, prefix = "FE", suffix = "") {
  const base = `${prefix}-${courseCode}-${termCode}${year}`;
  return suffix ? `${base}-${suffix}` : base;
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
      exams.push({
        id: buildExamCode(normalized, term.code, year, codePrefix),
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

  exams.push({
    id: buildExamCode(normalized, "SP", 2025, codePrefix, "RE"),
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

export function getExamById(courseCode, examId, pageKey, scope = "community") {
  const config = getSubjectDetailConfig(pageKey, scope);
  if (!config) return null;

  const normalizedCode = courseCode?.toUpperCase() ?? "";

  if (pageKey === "documents") {
    const docs = getDocumentItemsForCourse(normalizedCode);
    return docs.find((item) => item.id === examId) ?? null;
  }

  const exams = getExamPapersForCourse(normalizedCode, config.examType, config.codePrefix);
  return exams.find((exam) => exam.id === examId) ?? null;
}
