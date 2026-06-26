import { getAdminDocuments } from "@/features/admin/documents/adminDocumentData";
import { getAdminExams } from "@/features/admin/exams/adminExamData";
import { REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";
import { getExamPapersForCourse } from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import * as postsApi from "@/api/postsApi";
import { mapPostListItem } from "@/api/feedMapper";

export const SEARCH_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "blogs", label: "Blogs" },
  { id: "documents", label: "Tài liệu" },
  { id: "exams", label: "Đề thi" },
  { id: "practice", label: "Thực hành" },
  { id: "users", label: "Người dùng" },
];

function normalizeQuery(query) {
  return query.trim().toLowerCase();
}

function matchesQuery(keyword, ...fields) {
  if (!keyword) return false;
  return fields.some((field) => String(field ?? "").toLowerCase().includes(keyword));
}

function uniqueCourses() {
  const seen = new Set();
  const courses = [];

  REVIEW_COURSES.forEach((group) => {
    group.courses.forEach((course) => {
      const code = course.code.toUpperCase();
      if (!seen.has(code)) {
        seen.add(code);
        courses.push(code);
      }
    });
  });

  return courses;
}

let finalExamIndexCache = null;
let practiceExamIndexCache = null;

function buildFinalExamIndex() {
  if (finalExamIndexCache) return finalExamIndexCache;

  finalExamIndexCache = getAdminExams()
    .filter((exam) => exam.type === "Final")
    .map((exam) => ({
      id: exam.id,
      courseCode: exam.subject,
      title: exam.title,
      type: exam.type,
      detailPath: `${getSubjectCatalogPath("exams", "home")}/${exam.subject}/${exam.id}`,
    }));

  return finalExamIndexCache;
}

function buildPracticeExamIndex() {
  if (practiceExamIndexCache) return practiceExamIndexCache;

  practiceExamIndexCache = uniqueCourses().flatMap((courseCode) =>
    getExamPapersForCourse(courseCode).map((exam) => ({
      id: exam.id,
      courseCode,
      title: exam.title,
      type: "Practice",
      detailPath: `${getSubjectCatalogPath("practice", "home")}/${courseCode}/${exam.id}`,
    })),
  );

  return practiceExamIndexCache;
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function searchPosts(query) {
  const keyword = query?.trim() ?? "";
  if (!keyword) return [];

  if (USE_MOCK) {
    return [];
  }

  try {
    const data = await postsApi.listPosts({ search: keyword, page: 1, pageSize: 20 });
    return (data.items ?? []).map(mapPostListItem);
  } catch {
    return [];
  }
}

export function searchDocuments(query) {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];

  return getAdminDocuments()
    .filter((doc) =>
      matchesQuery(keyword, doc.name, doc.subject, doc.description, doc.examTitle),
    )
    .map((doc) => ({
      id: doc.id,
      title: doc.name,
      subtitle: `${doc.subject} · ${doc.access}`,
      typeLabel: "Tài liệu",
      detailPath: `${getSubjectCatalogPath("documents", "home")}/${doc.subject}/${doc.id}`,
    }));
}

export function searchFinalExams(query) {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];

  return buildFinalExamIndex().filter((exam) =>
    matchesQuery(keyword, exam.id, exam.courseCode, exam.title, exam.type),
  );
}

export function searchPracticeExams(query) {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];

  return buildPracticeExamIndex().filter((exam) =>
    matchesQuery(keyword, exam.id, exam.courseCode, exam.title, exam.type),
  );
}

export function searchLocalContent(query) {
  return {
    blogs: [],
    documents: searchDocuments(query),
    exams: searchFinalExams(query),
    practice: searchPracticeExams(query),
  };
}

export function getSearchCounts(query, { blogCount = 0, userCount = 0 } = {}) {
  const results = searchLocalContent(query);
  const total =
    blogCount +
    results.documents.length +
    results.exams.length +
    results.practice.length +
    userCount;

  return {
    all: total,
    blogs: blogCount,
    documents: results.documents.length,
    exams: results.exams.length,
    practice: results.practice.length,
    users: userCount,
  };
}
