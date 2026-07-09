/**
 * @fileoverview Dữ liệu catalog môn học và helper cho form đề thực hành.
 *
 * Cung cấp danh sách học kỳ, option môn theo học kỳ từ catalog review courses,
 * và draft mẫu dùng khi khởi tạo form.
 *
 * @module features/moderator/practiceExams/practiceExamData
 * @see {@link module:features/review/ReviewQuestionsPage/reviewData} — nguồn catalog môn học
 */

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

/**
 * Danh sách mã môn (chỉ populate khi `VITE_USE_MOCK=true`).
 *
 * @constant {ReadonlyArray<string>}
 * @readonly
 */
export const PRACTICE_SUBJECT_OPTIONS = USE_MOCK ? buildSubjectOptions(REVIEW_COURSES) : [];

/**
 * Danh sách nhãn học kỳ dùng trong dropdown form đề thực hành.
 *
 * @constant {ReadonlyArray<string>}
 * @readonly
 */
export const PRACTICE_SEMESTER_OPTIONS = SEMESTERS;

/**
 * Trích số học kỳ từ nhãn dạng "Học kỳ N".
 *
 * @param {string | null | undefined} semesterLabel - Nhãn học kỳ.
 * @returns {number | null} Số học kỳ hoặc `null` nếu không parse được.
 */
export function parseSemesterNumberFromLabel(semesterLabel) {
  const match = String(semesterLabel ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

/**
 * Lấy danh sách môn học (code + tên) theo học kỳ từ catalog courses.
 *
 * @param {string} semesterLabel - Nhãn học kỳ (ví dụ "Học kỳ 5").
 * @param {Array<object>} [courses=REVIEW_COURSES] - Catalog nhóm môn theo semester.
 * @returns {Array<{ code: string, name: string, major: string }>} Option môn đã sort theo mã.
 */
export function getSubjectOptionsForSemester(semesterLabel, courses = REVIEW_COURSES) {
  const semesterNumber = parseSemesterNumberFromLabel(semesterLabel);
  if (!semesterNumber) return [];

  const group = courses.find((item) => item.semester === semesterNumber);
  if (!group) return [];

  const nameLookup = new Map();
  for (const catalogGroup of courses) {
    for (const course of catalogGroup.courses ?? []) {
      const code = normalizeCourseSubjectCode(course.code) ?? course.code;
      const name = String(course.name ?? "").trim();
      if (code && name && !nameLookup.has(code)) {
        nameLookup.set(code, name);
      }
    }
  }

  const options = new Map();
  for (const course of group.courses) {
    const code = normalizeCourseSubjectCode(course.code) ?? course.code;
    if (!options.has(code)) {
      options.set(code, {
        code,
        name: String(course.name ?? "").trim() || nameLookup.get(code) || "",
        major: course.major ?? "SE",
      });
    }
  }

  return [...options.values()]
    .filter((item) => item.name)
    .sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Tải catalog môn từ API và trả về danh sách mã môn phẳng.
 *
 * @returns {Promise<ReadonlyArray<string>>} Mã môn đã sort.
 */
export async function loadPracticeSubjectOptions() {
  const courses = await loadReviewCourses();
  return buildSubjectOptions(courses);
}

/**
 * Draft mẫu khởi tạo form đề thực hành (mock data).
 *
 * @constant {object}
 * @readonly
 */
export const DEMO_DRAFT = PRACTICE_EXAM_DRAFT_MOCK;

/**
 * File đính kèm mẫu từ draft demo.
 *
 * @constant {ReadonlyArray<object>}
 * @readonly
 */
export const DEMO_ATTACHMENTS = PRACTICE_EXAM_DRAFT_MOCK.attachments;
