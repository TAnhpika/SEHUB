import { useEffect, useState } from "react";
import * as subjectsApi from "@/api/subjectsApi";
import * as examsApi from "@/api/examsApi";
import * as documentsApi from "@/api/documentsApi";
import {
  inferMajorFromSubjectCode,
  normalizeCourseSubjectCode,
} from "@/utils/examDisplay";

export const SEMESTER_OPTIONS = [
  { value: "all", label: "Tất cả học kỳ" },
  { value: "1", label: "Kỳ 1" },
  { value: "2", label: "Kỳ 2" },
  { value: "3", label: "Kỳ 3" },
  { value: "4", label: "Kỳ 4" },
  { value: "5", label: "Kỳ 5" },
  { value: "6", label: "Kỳ 6" },
  { value: "7", label: "Kỳ 7" },
  { value: "8", label: "Kỳ 8" },
  { value: "9", label: "Kỳ 9" },
];

export const MAJOR_OPTIONS = [
  { value: "all", label: "Tất cả chuyên ngành" },
  { value: "AI", label: "AI" },
  { value: "SE", label: "SE" },
];

export const REVIEW_COURSES = [
  {
    semester: 1,
    courses: [
      { code: "MAE101", major: "SE" },
      { code: "PRF192", major: "SE" },
      { code: "CEA201", major: "SE" },
      { code: "CSI104", major: "SE" },
      { code: "SSL101c", major: "SE" },
    ],
  },
  {
    semester: 2,
    courses: [
      { code: "MAD101", major: "SE" },
      { code: "OSG202", major: "SE" },
      { code: "PRO192", major: "SE" },
      { code: "SSG104", major: "SE" },
      { code: "NWC204", major: "SE" },
    ],
  },
  {
    semester: 3,
    courses: [
      { code: "JPD113", major: "SE" },
      { code: "WED201c", major: "SE" },
      { code: "DBI202", major: "SE" },
      { code: "CSD201", major: "SE" },
      { code: "LAB211", major: "SE" },
    ],
  },
  {
    semester: 4,
    courses: [
      { code: "PRJ301", major: "SE" },
      { code: "SWE201c", major: "SE" },
      { code: "MAS291", major: "SE" },
      { code: "JPD123", major: "SE" },
      { code: "IOT102", major: "SE" },
    ],
  },
  {
    semester: 5,
    courses: [
      { code: "SWP391", major: "SE" },
      { code: "WDU203c", major: "SE" },
      { code: "SWR302", major: "SE" },
      { code: "SWT301", major: "SE" },
      { code: "FER202", major: "SE" },
    ],
  },
  {
    semester: 6,
    courses: [
      { code: "ENW493c", major: "SE" },
      { code: "OJT202", major: "SE" },
    ],
  },
  {
    semester: 7,
    courses: [
      { code: "MMA301", major: "SE" },
      { code: "PMG201c", major: "SE" },
      { code: "SDN302", major: "SE" },
      { code: "EXE101", major: "SE" },
      { code: "SWD392", major: "SE" },
    ],
  },
  {
    semester: 8,
    courses: [
      { code: "EXE201", major: "SE" },
      { code: "PRM393", major: "SE" },
      { code: "ITE302c", major: "SE" },
      { code: "WDP301", major: "SE" },
      { code: "MLN111", major: "SE" },
      { code: "MLN122", major: "SE" },
    ],
  },
  {
    semester: 9,
    courses: [
      { code: "VNR202", major: "SE" },
      { code: "SEP490", major: "SE" },
      { code: "MLN131", major: "SE" },
      { code: "HCM202", major: "SE" },
    ],
  },
];

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function normalizeCatalogSubjectKey(value) {
  return (
    normalizeCourseSubjectCode(value) ??
    String(value ?? "").trim().toUpperCase()
  );
}

function normalizeCatalogCourseCode(course) {
  return normalizeCatalogSubjectKey(course?.code ?? course?.Code);
}

function readCatalogCourseName(course) {
  return String(course?.name ?? course?.Name ?? "").trim();
}

function normalizeCatalogMajor(code, major) {
  const trimmed = String(major ?? "").trim().toUpperCase();
  if (trimmed === "SE" || trimmed === "AI") {
    return trimmed;
  }

  const normalizedCode = normalizeCourseSubjectCode(code) ?? String(code ?? "").trim().toUpperCase();
  if (normalizeCourseSubjectCode(major) === normalizedCode) {
    return inferMajorFromSubjectCode(normalizedCode);
  }

  return inferMajorFromSubjectCode(normalizedCode);
}

function mergeCourseCatalog(apiCourses = []) {
  const nameByCode = new Map();
  const majorByCode = new Map();

  for (const group of apiCourses ?? []) {
    for (const course of group?.courses ?? group?.Courses ?? []) {
      const code = normalizeCatalogCourseCode(course);
      if (!code) continue;
      const name = readCatalogCourseName(course);
      if (name) {
        nameByCode.set(code, name);
      }
      majorByCode.set(
        code,
        normalizeCatalogMajor(code, course?.major ?? course?.Major ?? "SE"),
      );
    }
  }

  const semesterMap = new Map();

  const upsertCourse = (semester, course) => {
    const parsedSemester = Number(semester);
    if (!Number.isFinite(parsedSemester) || parsedSemester <= 0) {
      return;
    }

    const code = normalizeCatalogCourseCode(course);
    if (!code) {
      return;
    }

    if (!semesterMap.has(parsedSemester)) {
      semesterMap.set(parsedSemester, new Map());
    }

    const codeMap = semesterMap.get(parsedSemester);
    const existing = codeMap.get(code);
    const name =
      readCatalogCourseName(course) ||
      nameByCode.get(code) ||
      existing?.name ||
      "";

    if (!name) {
      return;
    }

    codeMap.set(code, {
      code,
      name,
      major: normalizeCatalogMajor(
        code,
        course?.major ?? course?.Major ?? majorByCode.get(code) ?? existing?.major ?? "SE",
      ),
    });
  };

  for (const group of REVIEW_COURSES) {
    for (const course of group.courses ?? []) {
      upsertCourse(group.semester, course);
    }
  }

  for (const group of apiCourses ?? []) {
    const semester = group?.semester ?? group?.Semester;
    for (const course of group?.courses ?? group?.Courses ?? []) {
      upsertCourse(semester, course);
    }
  }

  return [...semesterMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([semester, codeMap]) => ({
      semester,
      courses: [...codeMap.values()].sort((a, b) => a.code.localeCompare(b.code)),
    }))
    .filter((group) => group.courses.length > 0);
}

/** @typedef {"final" | "practice" | "documents"} CourseContentFilter */

const EXAM_CONTENT_FILTERS = {
  final: "Final",
  practice: "Practice",
};

function extractDocumentSubjectCode(dto) {
  const category = String(dto?.category ?? "").trim();
  const match = category.match(/^([A-Z0-9]+)/i);
  if (match?.[1]) {
    return normalizeCourseSubjectCode(match[1]) ?? match[1].toUpperCase();
  }

  const title = String(dto?.title ?? "").trim();
  const titleMatch = title.match(/^([A-Z0-9]+)/i);
  return titleMatch?.[1]
    ? normalizeCourseSubjectCode(titleMatch[1]) ?? titleMatch[1].toUpperCase()
    : "";
}

const EXAM_CODES_PAGE_SIZE = 500;

function collectSubjectCodesFromExamItems(items = []) {
  const codes = new Set();

  for (const item of items) {
    const code = normalizeCatalogSubjectKey(item?.code);
    if (code) {
      codes.add(code);
    }
  }

  return codes;
}

async function loadSubjectCodesWithExams(examType) {
  const codes = new Set();
  let page = 1;
  let totalCount = 0;
  const pageSize = EXAM_CODES_PAGE_SIZE;

  do {
    const result = await examsApi.listExams({ type: examType, page, pageSize });
    const items = result?.items ?? [];
    totalCount = Number(result?.totalCount ?? items.length);

    for (const code of collectSubjectCodesFromExamItems(items)) {
      codes.add(code);
    }

    if (items.length < pageSize) {
      break;
    }

    page += 1;
  } while ((page - 1) * pageSize < totalCount);

  return codes;
}

async function loadSubjectCodesWithDocuments() {
  const codes = new Set();
  let page = 1;
  let totalCount = 0;

  do {
    const result = await documentsApi.listDocuments({ page, pageSize: 200 });
    totalCount = Number(result?.totalCount ?? 0);

    for (const item of result?.items ?? []) {
      const code = extractDocumentSubjectCode(item);
      if (code) {
        codes.add(code);
      }
    }

    page += 1;
  } while ((page - 1) * 200 < totalCount);

  return codes;
}

function filterCatalogBySubjectCodes(catalog, subjectCodes) {
  if (!subjectCodes?.size) {
    return [];
  }

  return catalog
    .map((group) => ({
      ...group,
      courses: (group.courses ?? []).filter((course) => {
        const code = normalizeCatalogCourseCode(course);
        return code && subjectCodes.has(code);
      }),
    }))
    .filter((group) => group.courses.length > 0);
}

async function resolveSubjectCodesWithContent(contentFilter) {
  if (contentFilter === "documents") {
    return loadSubjectCodesWithDocuments();
  }

  const examType = EXAM_CONTENT_FILTERS[contentFilter];
  if (!examType) {
    return null;
  }

  return loadSubjectCodesWithExams(examType);
}

function normalizeApiSubjectCatalog(apiCourses = []) {
  return apiCourses.map((group) => ({
    ...group,
    courses: (group.courses ?? []).map((course) => ({
      ...course,
      major: normalizeCatalogMajor(course.code, course.major ?? "SE"),
    })),
  }));
}

export async function loadReviewCourses({ apiOnly = false, contentFilter = null } = {}) {
  if (USE_MOCK) {
    return REVIEW_COURSES;
  }

  const [subjectsData, subjectCodes] = await Promise.all([
    subjectsApi.listSubjects(),
    contentFilter ? resolveSubjectCodesWithContent(contentFilter) : Promise.resolve(null),
  ]);

  const apiCourses = Array.isArray(subjectsData) ? subjectsData : [];
  const normalizedApiCourses = normalizeApiSubjectCatalog(apiCourses);
  let catalog = apiOnly ? normalizedApiCourses : mergeCourseCatalog(normalizedApiCourses);

  if (contentFilter && subjectCodes) {
    catalog = filterCatalogBySubjectCodes(catalog, subjectCodes);
  }

  return catalog;
}

const LOAD_TIMEOUT_MS = 30_000;

function withTimeout(promise, ms = LOAD_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Máy chủ phản hồi quá chậm. Vui lòng thử lại."));
    }, ms);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

export function useReviewCourses({ apiOnly = false, contentFilter = null } = {}) {
  const [courses, setCourses] = useState(apiOnly && !USE_MOCK ? [] : REVIEW_COURSES);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (USE_MOCK) {
      setCourses(REVIEW_COURSES);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    withTimeout(loadReviewCourses({ apiOnly, contentFilter }))
      .then((data) => {
        if (!cancelled) {
          setCourses(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCourses([]);
          setError(
            err instanceof Error
              ? err.message
              : "Không tải được danh sách môn học. Vui lòng thử lại.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiOnly, contentFilter, reloadKey]);

  function reload() {
    setReloadKey((value) => value + 1);
  }

  return { courses, loading, error, reload };
}
