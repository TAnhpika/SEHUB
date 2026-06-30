import { getAdminDocuments } from "@/features/admin/documents/adminDocumentData";
import { getAdminExams } from "@/features/admin/exams/adminExamData";
import { REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";
import { getExamPapersForCourse } from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import * as postsApi from "@/api/postsApi";
import * as documentsApi from "@/api/documentsApi";
import * as examsApi from "@/api/examsApi";
import * as usersApi from "@/api/usersApi";
import { mapPostListItem } from "@/api/feedMapper";
import { mapDocumentListItemDto } from "@/api/documentMapper";
import { mapUserSearchResult } from "@/api/usersMapper";

export const SEARCH_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "blogs", label: "Blogs" },
  { id: "documents", label: "Tài liệu" },
  { id: "exams", label: "Đề thi" },
  { id: "practice", label: "Thực hành" },
  { id: "users", label: "Người dùng" },
];

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const SEARCH_PAGE_SIZE = 20;

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

function mapExamSearchResult(dto, examTypeLabel) {
  const courseCode = (dto.code ?? dto.major ?? "").toString().toUpperCase();
  const catalogKey = examTypeLabel === "Practice" ? "practice" : "exams";
  const id = dto.title || dto.code || dto.id;

  return {
    id,
    courseCode,
    title: dto.title,
    type: examTypeLabel,
    detailPath: `${getSubjectCatalogPath(catalogKey, "home")}/${courseCode}/${id}`,
  };
}

function mapDocumentSearchResult(doc) {
  return {
    id: doc.id,
    title: doc.name,
    subtitle: `${doc.subject} · ${doc.access}`,
    typeLabel: "Tài liệu",
    detailPath: `${getSubjectCatalogPath("documents", "home")}/${doc.subject}/${doc.id}`,
  };
}

function filterExams(items, keyword, examType) {
  return items
    .filter((exam) => {
      const type = String(exam.examType ?? exam.type ?? "").toLowerCase();
      if (examType === "Final" && type !== "final") return false;
      if (examType === "Practice" && type !== "practice") return false;
      return matchesQuery(keyword, exam.id, exam.code, exam.major, exam.title, exam.examType, exam.type);
    })
    .map((exam) => mapExamSearchResult(exam, examType === "Practice" ? "Practice" : "Final"));
}

export async function searchPosts(query) {
  const keyword = query?.trim() ?? "";
  if (!keyword) return [];

  if (USE_MOCK) {
    return [];
  }

  try {
    const data = await postsApi.listPosts({ search: keyword, page: 1, pageSize: SEARCH_PAGE_SIZE });
    return (data.items ?? []).map(mapPostListItem);
  } catch {
    return [];
  }
}

export async function searchDocuments(query) {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];

  if (USE_MOCK) {
    return getAdminDocuments()
      .filter((doc) =>
        matchesQuery(keyword, doc.name, doc.subject, doc.description, doc.examTitle),
      )
      .map(mapDocumentSearchResult);
  }

  try {
    const data = await documentsApi.listDocuments({ page: 1, pageSize: 100 });
    return (data.items ?? [])
      .map((dto) => mapDocumentListItemDto(dto))
      .filter((doc) =>
        matchesQuery(keyword, doc.id, doc.name, doc.subject, doc.description, doc.access),
      )
      .map(mapDocumentSearchResult);
  } catch {
    return [];
  }
}

export async function searchFinalExams(query) {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];

  if (USE_MOCK) {
    return buildFinalExamIndex().filter((exam) =>
      matchesQuery(keyword, exam.id, exam.courseCode, exam.title, exam.type),
    );
  }

  try {
    const data = await examsApi.listExams({ type: "Final", page: 1, pageSize: 100 });
    return filterExams(data.items ?? [], keyword, "Final");
  } catch {
    return [];
  }
}

export async function searchPracticeExams(query) {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];

  if (USE_MOCK) {
    return buildPracticeExamIndex().filter((exam) =>
      matchesQuery(keyword, exam.id, exam.courseCode, exam.title, exam.type),
    );
  }

  try {
    const data = await examsApi.listExams({ type: "Practice", page: 1, pageSize: 100 });
    return filterExams(data.items ?? [], keyword, "Practice");
  } catch {
    return [];
  }
}

export async function searchUsers(query, { page = 1, pageSize = SEARCH_PAGE_SIZE } = {}) {
  const keyword = query?.trim() ?? "";
  if (!keyword) {
    return { items: [], totalCount: 0 };
  }

  if (USE_MOCK) {
    return { items: [], totalCount: 0 };
  }

  try {
    const data = await usersApi.searchUsers(keyword, { page, pageSize });
    return {
      items: (data.items ?? []).map(mapUserSearchResult),
      totalCount: data.totalCount ?? 0,
    };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

export async function searchLocalContent(query) {
  const [documents, exams, practice] = await Promise.all([
    searchDocuments(query),
    searchFinalExams(query),
    searchPracticeExams(query),
  ]);

  return {
    blogs: [],
    documents,
    exams,
    practice,
  };
}

export async function getSearchCounts(query, { blogCount = 0, userCount = 0 } = {}) {
  const results = await searchLocalContent(query);
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
