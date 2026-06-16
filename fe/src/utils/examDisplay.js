import {
  getSeasonTerm,
  isValidExamPaperCode,
} from "@/utils/examPaperCode";

const COURSE_CODE_PATTERN = /[A-Za-z]{3}\d{3}[Cc]?/;
export function stripRevisionLabel(value) {
  return String(value ?? "")
    .replace(/\s+Rev$/i, "")
    .replace(/-Rev(?:-\d+)?$/i, "")
    .replace(/-REV-[a-f0-9]+$/i, "")
    .trim();
}

export function normalizeCourseSubjectCode(value) {
  if (!value) return null;
  const match = String(value).match(COURSE_CODE_PATTERN);
  if (!match) return null;

  const raw = match[0];
  const letters = raw.slice(0, 3).toUpperCase();
  const digits = raw.slice(3, 6);
  const hasLowerC = raw.length > 6 && /^c$/i.test(raw.charAt(6));
  return letters + digits + (hasLowerC ? "c" : "");
}

export function extractCourseSubjectCode(...candidates) {
  for (const value of candidates) {
    const normalized = normalizeCourseSubjectCode(value);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

function isInternalRevisionCode(value) {
  return /-REV-[a-f0-9]+$/i.test(value) || /-Rev(?:-\d+)?$/i.test(value);
}

function isBareSubjectCode(value) {
  return /^[A-Za-z]{3}\d{3}[Cc]?$/.test(String(value ?? "").trim());
}

function extractSeasonTermFromCandidates(...candidates) {
  for (const value of candidates) {
    const match = String(value ?? "").match(/-(SP|SU|FA)(\d{4})/i);
    if (match) {
      return `${match[1].toUpperCase()}${match[2]}`;
    }
  }
  return null;
}

function formatSubjectPartForPaperCode(subjectCode) {
  return normalizeCourseSubjectCode(subjectCode);
}

export function buildExamPaperCode(subjectCode, options = {}) {
  const { examType = "final", date = new Date(), sequence = 1, term } = options;
  const resolvedTerm =
    term ?? extractSeasonTermFromCandidates(options.termHint) ?? getSeasonTerm(date);
  const subjectPart = formatSubjectPartForPaperCode(subjectCode);
  if (!subjectPart) return null;
  const typePrefix = examType === "practice" ? "PE" : "FE";
  return `${typePrefix}-${subjectPart}-${resolvedTerm}-${sequence}`;
}

function collectNameCandidates(dto) {
  return [
    dto.revisionSourceTitle,
    dto.title,
    dto.revisionSourceCode,
    dto.code,
    dto.description,
  ]
    .map(stripRevisionLabel)
    .filter(Boolean);
}

export function isExamPaperCode(value) {
  return isValidExamPaperCode(value, { allowLegacy: true });
}

export function resolvePublicExamName(dto) {
  const candidates = collectNameCandidates(dto);

  for (const candidate of candidates) {
    if (isExamPaperCode(candidate)) {
      return candidate;
    }
  }

  const subjectCode = extractCourseSubjectCode(...candidates);
  if (subjectCode) {
    const term = extractSeasonTermFromCandidates(...candidates) ?? getSeasonTerm();
    const built = buildExamPaperCode(subjectCode, { term, sequence: 1 });
    if (built) {
      return built;
    }
  }

  for (const candidate of candidates) {
    if (isBareSubjectCode(candidate)) {
      continue;
    }
    if (!/^Môn\s/i.test(candidate) && !isInternalRevisionCode(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? "—";
}

export function buildExamDisplayFields(dto) {
  const isRevision = Boolean(dto.revisionOfExamId);
  const publicName = resolvePublicExamName(dto);
  const subjectCode =
    extractCourseSubjectCode(
      dto.major,
      dto.revisionSourceCode,
      dto.code,
      dto.title,
      dto.description,
    ) ?? "—";

  const primaryTitle =
    /^Môn\s/i.test(dto.title ?? "") && isExamPaperCode(publicName) ? publicName : dto.title ?? publicName;

  return {
    subjectCode,
    displayTitle: isRevision ? `${publicName} Rev` : primaryTitle,
    displayExamCode: isRevision ? `${publicName} Rev` : publicName,
  };
}

export function enrichRevisionExamEntries(entries) {
  const byId = new Map();
  for (const entry of entries) {
    for (const key of [entry.id, entry.apiId, entry.examApiId, entry.pendingId]) {
      if (key) {
        byId.set(String(key), entry);
      }
    }
  }

  return entries.map((entry) => {
    const parent = entry.revisionOfExamId
      ? byId.get(String(entry.revisionOfExamId))
      : null;
    const merged = entry.revisionOfExamId
      ? {
          ...entry,
          revisionSourceCode: entry.revisionSourceCode ?? parent?.code ?? null,
          revisionSourceTitle: entry.revisionSourceTitle ?? parent?.title ?? null,
        }
      : entry;

    return {
      ...merged,
      ...buildExamDisplayFields(merged),
    };
  });
}

export function getExamDisplayTitle(item) {
  return item?.displayTitle ?? item?.title ?? "";
}

export function getExamSubjectCode(item) {
  return item?.subjectCode ?? extractCourseSubjectCode(item?.major, item?.code, item?.title) ?? "—";
}

export function getExamDisplayCode(item) {
  return item?.displayExamCode ?? resolvePublicExamName(item);
}
