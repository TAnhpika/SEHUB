import { MOCK_POSTS } from "@/features/feed/feedData";
import { MOCK_FRIENDS } from "@/features/home/friendsData";
import { getAdminDocuments } from "@/features/admin/documents/adminDocumentData";
import { getAdminExams } from "@/features/admin/exams/adminExamData";
import { REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";
import { getExamPapersForCourse } from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";

export const SEARCH_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "blogs", label: "Blogs" },
  { id: "documents", label: "Tài liệu" },
  { id: "exams", label: "Đề thi" },
  { id: "practice", label: "Thực hành" },
  { id: "users", label: "Người dùng" },
];

/** Người dùng bổ sung cho tìm kiếm tổng (ngoài MOCK_FRIENDS) */
const EXTRA_SEARCH_USERS = [
  { id: 101, username: "PhamLong", displayName: "PhamLong", initial: "P", level: "SILVER" },
  { id: 102, username: "long05hn5", displayName: "long05hn5", initial: "L", level: "COPPER" },
  { id: 103, username: "longdeptrai", displayName: "longdeptrai", initial: "L", level: "BRONZE" },
  { id: 104, username: "longnguyen", displayName: "longnguyen", initial: "L", level: "GOLD" },
];

const ALL_SEARCH_USERS = [
  ...MOCK_FRIENDS.map((user) => ({
    ...user,
    displayName: user.displayName ?? user.username,
  })),
  ...EXTRA_SEARCH_USERS,
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

  const published = getAdminExams().filter(
    (exam) => exam.status === "published" && exam.typeKey === "final",
  );

  const procedural = uniqueCourses().flatMap((courseCode) =>
    getExamPapersForCourse(courseCode, "Cuối kỳ", "FE").map((exam) => ({
      ...exam,
      title: `${exam.type} ${exam.courseCode} — ${exam.termLabel} ${exam.year}`,
      detailPath: `${getSubjectCatalogPath("review", "home")}/${exam.courseCode}/${exam.id}`,
    })),
  );

  const admin = published.map((exam) => ({
    id: exam.id,
    courseCode: exam.code,
    title: exam.title,
    year: exam.semester,
    termLabel: `Kì ${exam.semester}`,
    type: exam.type,
    detailPath: `${getSubjectCatalogPath("review", "home")}/${exam.code}/${exam.id}`,
  }));

  finalExamIndexCache = [...admin, ...procedural];
  return finalExamIndexCache;
}

function buildPracticeExamIndex() {
  if (practiceExamIndexCache) return practiceExamIndexCache;

  const published = getAdminExams().filter(
    (exam) => exam.status === "published" && exam.typeKey === "practice",
  );

  const procedural = uniqueCourses().flatMap((courseCode) =>
    getExamPapersForCourse(courseCode, "Thực hành", "PE").map((exam) => ({
      ...exam,
      title: `${exam.type} ${exam.courseCode} — ${exam.termLabel} ${exam.year}`,
      detailPath: `${getSubjectCatalogPath("practice", "home")}/${exam.courseCode}/${exam.id}`,
    })),
  );

  const admin = published.map((exam) => ({
    id: exam.id,
    courseCode: exam.code,
    title: exam.title,
    year: exam.semester,
    termLabel: `Kì ${exam.semester}`,
    type: exam.type,
    detailPath: `${getSubjectCatalogPath("practice", "home")}/${exam.code}/${exam.id}`,
  }));

  practiceExamIndexCache = [...admin, ...procedural];
  return practiceExamIndexCache;
}

export function searchPosts(query) {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];

  return MOCK_POSTS.filter((post) =>
    matchesQuery(
      keyword,
      post.title,
      post.excerpt,
      post.body,
      post.author?.username,
      ...(post.tags ?? []),
    ),
  );
}

export function searchUsers(query) {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];

  return ALL_SEARCH_USERS.filter((user) =>
    matchesQuery(keyword, user.username, user.displayName),
  );
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

export function searchAll(query) {
  const blogs = searchPosts(query);
  const documents = searchDocuments(query);
  const exams = searchFinalExams(query);
  const practice = searchPracticeExams(query);
  const users = searchUsers(query);

  return { blogs, documents, exams, practice, users };
}

export function getSearchCounts(query) {
  const results = searchAll(query);
  const total =
    results.blogs.length +
    results.documents.length +
    results.exams.length +
    results.practice.length +
    results.users.length;

  return {
    all: total,
    blogs: results.blogs.length,
    documents: results.documents.length,
    exams: results.exams.length,
    practice: results.practice.length,
    users: results.users.length,
  };
}
