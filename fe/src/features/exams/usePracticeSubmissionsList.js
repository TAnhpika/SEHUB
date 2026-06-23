import { useEffect, useMemo, useState } from "react";
import { loadAllPracticeSubmissions } from "@/features/exams/practiceExamSubmissions";

export const PRACTICE_SUBMISSIONS_PAGE_SIZE = 5;

export const SUBMISSION_STATUS_FILTERS = [
  { id: "all", label: "Tất cả trạng thái" },
  { id: "pending", label: "Chờ chấm" },
  { id: "reviewed", label: "Đã xem" },
  { id: "pass", label: "Đạt" },
  { id: "fail", label: "Không đạt" },
];

export const SUBMISSION_SORT_OPTIONS = [
  { value: "submittedAt:desc", label: "Nộp mới nhất" },
  { value: "submittedAt:asc", label: "Nộp cũ nhất" },
  { value: "gradedAt:desc", label: "Chấm gần nhất" },
  { value: "student:asc", label: "Sinh viên A → Z" },
  { value: "course:asc", label: "Môn A → Z" },
  { value: "status:asc", label: "Trạng thái A → Z" },
];

const STATUS_ORDER = { pending: 0, reviewed: 1, pass: 2, fail: 3 };

/**
 * @param {import("@/features/exams/practiceExamSubmissions").PracticeExamSubmission[]} submissions
 * @param {{
 *   query?: string;
 *   statusFilter?: string;
 *   courseFilter?: string;
 *   sortPreset?: string;
 * }} options
 */
export function filterAndSortPracticeSubmissions(submissions, options) {
  const q = (options.query ?? "").trim().toLowerCase();
  const statusFilter = options.statusFilter ?? "all";
  const courseFilter = options.courseFilter ?? "all";
  const [sortBy, sortDir] = (options.sortPreset ?? "submittedAt:desc").split(":");

  let result = submissions.filter((sub) => {
    if (statusFilter !== "all" && sub.status !== statusFilter) return false;
    if (courseFilter !== "all" && sub.courseCode !== courseFilter) return false;
    if (!q) return true;
    return (
      sub.displayName.toLowerCase().includes(q) ||
      sub.student.toLowerCase().includes(q) ||
      sub.courseCode.toLowerCase().includes(q) ||
      sub.examId.toLowerCase().includes(q) ||
      sub.githubUrl.toLowerCase().includes(q)
    );
  });

  const mul = sortDir === "asc" ? 1 : -1;

  result = [...result].sort((a, b) => {
    if (sortBy === "submittedAt") {
      return mul * a.submittedAt.localeCompare(b.submittedAt);
    }
    if (sortBy === "gradedAt") {
      const aTime = a.gradedAt ?? "";
      const bTime = b.gradedAt ?? "";
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      return mul * aTime.localeCompare(bTime);
    }
    if (sortBy === "student") {
      return mul * a.displayName.localeCompare(b.displayName, "vi");
    }
    if (sortBy === "course") {
      return mul * a.courseCode.localeCompare(b.courseCode, "vi");
    }
    if (sortBy === "status") {
      return mul * ((STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
    }
    return 0;
  });

  return result;
}

/**
 * @param {number} [refreshKey]
 */
export function usePracticeSubmissionsList(refreshKey = 0) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sortPreset, setSortPreset] = useState("submittedAt:desc");
  const [page, setPage] = useState(1);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    loadAllPracticeSubmissions()
      .then((items) => {
        if (!cancelled) {
          setAllSubmissions(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllSubmissions([]);
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
  }, [refreshKey]);

  const pendingCount = useMemo(
    () => allSubmissions.filter((item) => item.status === "pending").length,
    [allSubmissions],
  );

  const courseOptions = useMemo(() => {
    return [...new Set(allSubmissions.map((s) => s.courseCode))].sort();
  }, [allSubmissions]);

  const filtered = useMemo(
    () =>
      filterAndSortPracticeSubmissions(allSubmissions, {
        query,
        statusFilter,
        courseFilter,
        sortPreset,
      }),
    [allSubmissions, query, statusFilter, courseFilter, sortPreset],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRACTICE_SUBMISSIONS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageSubmissions = useMemo(() => {
    const start = (safePage - 1) * PRACTICE_SUBMISSIONS_PAGE_SIZE;
    return filtered.slice(start, start + PRACTICE_SUBMISSIONS_PAGE_SIZE);
  }, [filtered, safePage]);

  const rangeStart =
    filtered.length === 0 ? 0 : (safePage - 1) * PRACTICE_SUBMISSIONS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PRACTICE_SUBMISSIONS_PAGE_SIZE, filtered.length);

  const hasActiveFilters =
    query.trim() !== "" ||
    statusFilter !== "all" ||
    courseFilter !== "all" ||
    sortPreset !== "submittedAt:desc";

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, courseFilter, sortPreset]);

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setCourseFilter("all");
    setSortPreset("submittedAt:desc");
  }

  function handlePageChange(next) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    courseFilter,
    setCourseFilter,
    sortPreset,
    setSortPreset,
    courseOptions,
    filtered,
    pageSubmissions,
    filteredCount: filtered.length,
    totalPages,
    safePage,
    rangeStart,
    rangeEnd,
    hasActiveFilters,
    resetFilters,
    handlePageChange,
    loading,
    pendingCount,
  };
}
