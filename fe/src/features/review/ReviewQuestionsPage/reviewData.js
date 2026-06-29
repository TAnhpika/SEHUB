import { useEffect, useState } from "react";
import * as subjectsApi from "@/api/subjectsApi";
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
      { code: "CSI105", major: "AI" },
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
      { code: "CSD203", major: "AI" },
      { code: "AIG202C", major: "AI" },
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
  const staticCodes = new Set(
    REVIEW_COURSES.flatMap((group) =>
      (group.courses ?? []).map((course) => String(course.code ?? "").trim().toUpperCase()),
    ),
  );
  const semesterMap = new Map();

  const addGroup = (group, { skipStaticSubjects = false } = {}) => {
    const semester = Number(group?.semester);
    if (!Number.isFinite(semester) || semester <= 0) {
      return;
    }

    if (!semesterMap.has(semester)) {
      semesterMap.set(semester, new Map());
    }

    const codeMap = semesterMap.get(semester);
    for (const course of group.courses ?? []) {
      const code = String(course?.code ?? "").trim().toUpperCase();
      if (!code) {
        continue;
      }

      if (skipStaticSubjects && staticCodes.has(code)) {
        continue;
      }

      codeMap.set(code, {
        code,
        major: normalizeCatalogMajor(code, course.major ?? "SE"),
      });
    }
  };

  for (const group of REVIEW_COURSES) {
    addGroup(group);
  }

  for (const group of apiCourses) {
    addGroup(group, { skipStaticSubjects: true });
  }

  return [...semesterMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([semester, codeMap]) => ({
      semester,
      courses: [...codeMap.values()].sort((a, b) => a.code.localeCompare(b.code)),
    }))
    .filter((group) => group.courses.length > 0);
}

export async function loadReviewCourses({ apiOnly = false } = {}) {
  if (USE_MOCK) {
    return REVIEW_COURSES;
  }

  const data = await subjectsApi.listSubjects();
  const apiCourses = Array.isArray(data) ? data : [];
  const normalizedApiCourses = apiCourses.map((group) => ({
    ...group,
    courses: (group.courses ?? []).map((course) => ({
      ...course,
      major: normalizeCatalogMajor(course.code, course.major ?? "SE"),
    })),
  }));
  return apiOnly ? normalizedApiCourses : mergeCourseCatalog(normalizedApiCourses);
}

export function useReviewCourses({ apiOnly = false } = {}) {
  const [courses, setCourses] = useState(apiOnly && !USE_MOCK ? [] : REVIEW_COURSES);
  const [loading, setLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    loadReviewCourses({ apiOnly })
      .then((data) => {
        if (!cancelled) {
          setCourses(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiOnly]);

  return { courses, loading };
}
