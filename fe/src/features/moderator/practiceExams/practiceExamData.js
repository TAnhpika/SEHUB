import { REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";
import { SEMESTERS } from "@/features/posts/createPostData";
import { PRACTICE_EXAM_DRAFT_MOCK } from "@/features/moderator/moderatorMockData";

const courseSet = new Set();

REVIEW_COURSES.forEach((group) => {
  group.courses.forEach((course) => {
    courseSet.add(course.code);
  });
});

export const PRACTICE_SUBJECT_OPTIONS = [...courseSet].sort();

export const PRACTICE_SEMESTER_OPTIONS = SEMESTERS;

export const DEMO_DRAFT = PRACTICE_EXAM_DRAFT_MOCK;

export const DEMO_ATTACHMENTS = PRACTICE_EXAM_DRAFT_MOCK.attachments;
