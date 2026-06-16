import { REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";
import { SEMESTERS } from "@/features/posts/createPostData";
import { PRACTICE_EXAM_DRAFT_MOCK } from "@/features/moderator/moderatorMockData";
import { normalizeCourseSubjectCode } from "@/utils/examDisplay";

const courseSet = new Set();

REVIEW_COURSES.forEach((group) => {
  group.courses.forEach((course) => {
    courseSet.add(normalizeCourseSubjectCode(course.code) ?? course.code);
  });
});

export const PRACTICE_SUBJECT_OPTIONS = [...courseSet].sort();

export const PRACTICE_SEMESTER_OPTIONS = SEMESTERS;

export function parseSemesterNumberFromLabel(semesterLabel) {
  const match = String(semesterLabel ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function getSubjectOptionsForSemester(semesterLabel) {
  const semesterNumber = parseSemesterNumberFromLabel(semesterLabel);
  if (!semesterNumber) return [];

  const group = REVIEW_COURSES.find((item) => item.semester === semesterNumber);
  if (!group) return [];

  const codes = new Set();
  for (const course of group.courses) {
    codes.add(normalizeCourseSubjectCode(course.code) ?? course.code);
  }
  return [...codes].sort();
}

export const DEMO_DRAFT = PRACTICE_EXAM_DRAFT_MOCK;

export const DEMO_ATTACHMENTS = PRACTICE_EXAM_DRAFT_MOCK.attachments;
