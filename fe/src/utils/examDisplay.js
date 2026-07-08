import {
  formatExamPaperDisplayCode,
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

const VALID_MAJORS = new Set(["SE", "AI"]);

export function inferMajorFromSubjectCode(subjectCode) {
  const upper = String(subjectCode ?? "").trim().toUpperCase();
  if (/^(CSI|CSD|AIG)/.test(upper)) {
    return "AI";
  }
  return "SE";
}

export function findCourseMajor(subjectCode, semester, courses = []) {
  const normalized =
    normalizeCourseSubjectCode(subjectCode) ?? String(subjectCode ?? "").trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  const semesterNumber = Number(semester);
  const groups = Number.isFinite(semesterNumber)
    ? courses.filter((group) => group.semester === semesterNumber)
    : courses;

  for (const group of groups) {
    for (const course of group.courses ?? []) {
      const code = normalizeCourseSubjectCode(course.code) ?? String(course.code ?? "").trim().toUpperCase();
      if (code === normalized) {
        return course.major ?? inferMajorFromSubjectCode(normalized);
      }
    }
  }

  return inferMajorFromSubjectCode(normalized);
}

export function resolveExamMajor({ major, subjectCode, semester, courses = [] } = {}) {
  const trimmedMajor = String(major ?? "").trim().toUpperCase();
  if (VALID_MAJORS.has(trimmedMajor)) {
    return trimmedMajor;
  }

  const normalizedSubject =
    normalizeCourseSubjectCode(subjectCode) ?? String(subjectCode ?? "").trim().toUpperCase();
  if (!normalizedSubject) {
    return "SE";
  }

  return (
    findCourseMajor(normalizedSubject, semester, courses) ??
    inferMajorFromSubjectCode(normalizedSubject)
  );
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

export { isBareSubjectCode };

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
    dto.revisionSourcePaperCode,
    dto.revisionSourceTitle,
    dto.paperCode,
    dto.title,
    dto.revisionSourceSubjectCode,
    dto.revisionSourceCode,
    dto.description,
    dto.subjectCode,
    dto.code,
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
      return formatExamPaperDisplayCode(candidate);
    }
  }

  const subjectCode = extractCourseSubjectCode(...candidates);
  if (subjectCode) {
    const term = extractSeasonTermFromCandidates(...candidates) ?? getSeasonTerm();
    const built = buildExamPaperCode(subjectCode, { term, sequence: 1 });
    if (built) {
      return formatExamPaperDisplayCode(built);
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
  const paperCodeRaw = dto.paperCode ?? dto.title ?? "";
  const subjectCodeRaw = dto.subjectCode ?? dto.code ?? "";
  const paperCode = isExamPaperCode(paperCodeRaw) ? stripRevisionLabel(paperCodeRaw) : null;
  const publicName = paperCode
    ? formatExamPaperDisplayCode(paperCode)
    : resolvePublicExamName({ ...dto, code: subjectCodeRaw, title: paperCodeRaw });
  const subjectCode =
    (isBareSubjectCode(subjectCodeRaw) ? normalizeCourseSubjectCode(subjectCodeRaw) : null)
    ?? extractCourseSubjectCode(
      subjectCodeRaw,
      dto.revisionSourceSubjectCode ?? dto.revisionSourceCode,
      paperCodeRaw,
      dto.revisionSourcePaperCode ?? dto.revisionSourceTitle,
      dto.major,
      dto.description,
    )
    ?? "—";

  const primaryTitle =
    /^Môn\s/i.test(paperCodeRaw) && isExamPaperCode(publicName) ? publicName : paperCodeRaw || publicName;

  return {
    subjectCode,
    subjectName: dto.subjectName ?? "",
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
          revisionSourceCode: entry.revisionSourceCode ?? entry.revisionSourceSubjectCode ?? parent?.code ?? parent?.subjectCode ?? null,
          revisionSourceTitle: entry.revisionSourceTitle ?? entry.revisionSourcePaperCode ?? parent?.title ?? parent?.paperCode ?? null,
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
  if (item?.subjectCode && item.subjectCode !== "—") {
    return item.subjectCode;
  }
  if (isBareSubjectCode(item?.code)) {
    return normalizeCourseSubjectCode(item.code) ?? item.code;
  }
  return extractCourseSubjectCode(item?.code, item?.major, item?.title) ?? "—";
}

export function getExamDisplayCode(item) {
  return item?.displayExamCode ?? resolvePublicExamName(item);
}

export function getExamListPaperLabel(item) {
  if (item?.typeKey === "final") {
    return getExamDisplayCode(item);
  }

  return item?.title ?? getExamDisplayTitle(item) ?? "—";
}
