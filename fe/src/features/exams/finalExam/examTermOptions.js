import { getSeasonTerm, parseExamPaperCode } from "@/utils/examPaperCode";

export const EXAM_TERM_SEASON_OPTIONS = [
  { value: "SP", label: "SP" },
  { value: "SU", label: "SU" },
  { value: "FA", label: "FA" },
];

export const ACADEMIC_YEAR_START = 2023;

export function getAcademicYearOptions(now = new Date()) {
  const endYear = now.getFullYear();
  const years = [];
  for (let year = ACADEMIC_YEAR_START; year <= endYear; year += 1) {
    years.push(String(year));
  }
  return years;
}

export function getDefaultTermSeason(now = new Date()) {
  return getSeasonTerm(now).slice(0, 2);
}

export function getDefaultAcademicYear(now = new Date()) {
  return String(now.getFullYear());
}

export function parseTermFromExamCode(examCode) {
  const parsed = parseExamPaperCode(examCode);
  if (!parsed?.season || !parsed?.year) {
    return null;
  }

  return {
    termSeason: parsed.season,
    academicYear: parsed.year,
  };
}

export function createDefaultExamTermFields(now = new Date()) {
  return {
    termSeason: getDefaultTermSeason(now),
    academicYear: getDefaultAcademicYear(now),
  };
}
