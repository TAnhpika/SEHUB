import * as adminApi from "@/api/adminApi";

const COURSE_CODE_PATTERN = /[A-Za-z]{3}\d{3}[Cc]?/;

function stripRevisionLabel(value) {
  return String(value ?? "")
    .replace(/\s+Rev$/i, "")
    .replace(/-Rev(?:-\d+)?$/i, "")
    .replace(/-REV-[a-f0-9]+$/i, "")
    .trim();
}

function normalizeSubjectCode(value) {
  if (!value) return null;
  const match = String(value).match(COURSE_CODE_PATTERN);
  if (!match) return null;

  const raw = match[0];
  const letters = raw.slice(0, 3).toUpperCase();
  const digits = raw.slice(3, 6);
  const hasLowerC = raw.length > 6 && /^c$/i.test(raw.charAt(6));
  return letters + digits + (hasLowerC ? "c" : "");
}

export const EXAM_TYPE_PREFIX = {
  final: "FE",
  practice: "PE",
};

const PAPER_CODE_PATTERN = /^(FE|PE)-([A-Za-z]{3}\d{3}[cC]?)-(SP|SU|FA)(\d{4})-(\d+)$/i;
const LEGACY_PAPER_CODE_PATTERN = /^(FE|PE)-([A-Za-z0-9]+)-(SP|SU|FA)(\d{4})$/i;
const SHORT_PAPER_CODE_PATTERN = /^([A-Za-z]{3}\d{3}[cC]?)_(SP|SU|FA)(\d{2})$/i;

export function getSeasonTerm(date = new Date()) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let season = "FA";
  if (month >= 1 && month <= 4) {
    season = "SP";
  } else if (month >= 5 && month <= 8) {
    season = "SU";
  }
  return `${season}${year}`;
}

export function buildExamPaperCodePrefix(examType, subjectCode, date = new Date()) {
  const typePrefix = EXAM_TYPE_PREFIX[examType] ?? EXAM_TYPE_PREFIX.final;
  const subject = normalizeSubjectCode(subjectCode);
  if (!subject) return null;
  return `${typePrefix}-${subject}-${getSeasonTerm(date)}`;
}

export function parseExamPaperCode(value) {
  const normalized = stripRevisionLabel(String(value ?? "").trim());
  const shortMatch = normalized.match(SHORT_PAPER_CODE_PATTERN);
  if (shortMatch) {
    const year = `20${shortMatch[3]}`;
    return {
      type: null,
      subjectCode: normalizeSubjectCode(shortMatch[1]),
      season: shortMatch[2].toUpperCase(),
      year,
      sequence: 1,
      term: `${shortMatch[2].toUpperCase()}${year}`,
    };
  }

  const match = normalized.match(PAPER_CODE_PATTERN);
  if (!match) return null;

  return {
    type: match[1].toUpperCase(),
    subjectCode: normalizeSubjectCode(match[2]),
    season: match[3].toUpperCase(),
    year: match[4],
    sequence: Number(match[5]),
    term: `${match[3].toUpperCase()}${match[4]}`,
  };
}

export function formatExamPaperDisplayCode(value) {
  const normalized = stripRevisionLabel(String(value ?? "").trim());
  if (!normalized) {
    return "";
  }

  const shortMatch = normalized.match(SHORT_PAPER_CODE_PATTERN);
  if (shortMatch) {
    const subject = normalizeSubjectCode(shortMatch[1]);
    return `${subject}_${shortMatch[2].toUpperCase()}${shortMatch[3]}`;
  }

  const parsed = parseExamPaperCode(normalized);
  if (parsed?.subjectCode && parsed?.season && parsed?.year) {
    const yearSuffix = String(parsed.year).slice(-2);
    return `${parsed.subjectCode}_${parsed.season}${yearSuffix}`;
  }

  return normalized;
}

export function isValidExamPaperCode(value, { allowLegacy = true } = {}) {
  const normalized = stripRevisionLabel(String(value ?? "").trim());
  if (!normalized || /^Môn\s/i.test(normalized)) {
    return false;
  }
  if (/-Rev(?:-\d+)?$/i.test(normalized) || /-REV-[a-f0-9]+$/i.test(normalized)) {
    return false;
  }
  if (SHORT_PAPER_CODE_PATTERN.test(normalized)) {
    return true;
  }
  if (PAPER_CODE_PATTERN.test(normalized)) {
    return true;
  }
  return allowLegacy && LEGACY_PAPER_CODE_PATTERN.test(normalized);
}

export function nextExamPaperSequence(existingIdentifiers, prefix) {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sequencePattern = new RegExp(`^${escapedPrefix}-(\\d+)$`, "i");
  let maxSequence = 0;

  for (const raw of existingIdentifiers) {
    const candidate = stripRevisionLabel(String(raw ?? "").trim());
    if (!candidate) continue;

    const directMatch = candidate.match(sequencePattern);
    if (directMatch) {
      maxSequence = Math.max(maxSequence, Number(directMatch[1]));
      continue;
    }

    const parsed = parseExamPaperCode(candidate);
    if (parsed && candidate.toLowerCase().startsWith(`${prefix.toLowerCase()}-`)) {
      maxSequence = Math.max(maxSequence, parsed.sequence);
    }
  }

  return maxSequence + 1;
}

export function generateExamPaperCode(
  examType,
  subjectCode,
  existingIdentifiers = [],
  date = new Date(),
) {
  const prefix = buildExamPaperCodePrefix(examType, subjectCode, date);
  if (!prefix) return "";
  const sequence = nextExamPaperSequence(existingIdentifiers, prefix);
  return `${prefix}-${sequence}`;
}

let cachedIdentifiers = null;
let cacheExpiresAt = 0;

export async function loadExistingExamPaperIdentifiers({ force = false } = {}) {
  const now = Date.now();
  if (!force && cachedIdentifiers && cacheExpiresAt > now) {
    return cachedIdentifiers;
  }

  try {
    const page = await adminApi.listExams({ pageSize: 500 });
    const identifiers = new Set();
    for (const exam of page.items ?? []) {
      if (exam.code) identifiers.add(exam.code);
      if (exam.title) identifiers.add(exam.title);
    }
    cachedIdentifiers = [...identifiers];
    cacheExpiresAt = now + 30_000;
    return cachedIdentifiers;
  } catch {
    return cachedIdentifiers ?? [];
  }
}

export function invalidateExamPaperCodeCache() {
  cachedIdentifiers = null;
  cacheExpiresAt = 0;
}
