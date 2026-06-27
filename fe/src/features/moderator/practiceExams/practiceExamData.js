import { REVIEW_COURSES, loadReviewCourses } from "@/features/review/ReviewQuestionsPage/reviewData";
import { SEMESTERS } from "@/features/posts/createPostData";
import { PRACTICE_EXAM_DRAFT_MOCK } from "@/features/moderator/moderatorMockData";
import { normalizeCourseSubjectCode } from "@/utils/examDisplay";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function buildSubjectOptions(courses) {
  const courseSet = new Set();
  courses.forEach((group) => {
    group.courses.forEach((course) => {
      courseSet.add(normalizeCourseSubjectCode(course.code) ?? course.code);
    });
  });
  return [...courseSet].sort();
}

export const PRACTICE_SUBJECT_OPTIONS = USE_MOCK ? buildSubjectOptions(REVIEW_COURSES) : [];

export const PRACTICE_SEMESTER_OPTIONS = SEMESTERS;

export function parseSemesterNumberFromLabel(semesterLabel) {
  const match = String(semesterLabel ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function getSubjectOptionsForSemester(semesterLabel, courses = REVIEW_COURSES) {
  const semesterNumber = parseSemesterNumberFromLabel(semesterLabel);
  if (!semesterNumber) return [];

  const group = courses.find((item) => item.semester === semesterNumber);
  if (!group) return [];

  const codes = new Set();
  for (const course of group.courses) {
    codes.add(normalizeCourseSubjectCode(course.code) ?? course.code);
  }
  return [...codes].sort();
}

export async function loadPracticeSubjectOptions() {
  const courses = await loadReviewCourses();
  return buildSubjectOptions(courses);
}

export const DEMO_DRAFT = PRACTICE_EXAM_DRAFT_MOCK;

export const DEMO_ATTACHMENTS = PRACTICE_EXAM_DRAFT_MOCK.attachments;
