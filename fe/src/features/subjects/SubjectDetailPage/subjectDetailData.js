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

export const SUBJECT_DETAIL_CONFIG = {
  review: {
    titlePrefix: "Đề thi cuối kỳ",
    backTo: "/community/final-exam",
    examType: "Cuối kỳ",
  },
  practice: {
    titlePrefix: "Đề thi thực hành",
    backTo: "/community/pratical-exam",
    examType: "Thực hành",
  },
  documents: {
    titlePrefix: "Tài liệu học tập",
    backTo: "/community/documents",
    examType: "Tài liệu",
  },
};

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

function buildExamCode(courseCode, termCode, year, suffix = "") {
  const base = `FE-${courseCode}-${termCode}${year}`;
  return suffix ? `${base}-${suffix}` : base;
}

export function getExamPapersForCourse(courseCode, examType) {
  const normalized = courseCode.toUpperCase();
  const exams = [];

  YEARS.forEach((year) => {
    TERMS.forEach((term, termIndex) => {
      exams.push({
        id: buildExamCode(normalized, term.code, year),
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
    id: buildExamCode(normalized, "SP", 2025, "RE"),
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
