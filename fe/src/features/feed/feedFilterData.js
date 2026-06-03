import { MAJORS, SEMESTERS } from "@/features/posts/createPostData";

export const POST_SEMESTER_OPTIONS = [
  { value: "all", label: "Tất cả học kỳ" },
  ...SEMESTERS.map((label) => ({ value: label, label })),
];

export const POST_MAJOR_OPTIONS = [
  { value: "all", label: "Tất cả chuyên ngành" },
  ...MAJORS.map((label) => ({ value: label, label })),
];

export function filterPosts(posts, semesterFilter, majorFilter) {
  return posts.filter((post) => {
    const matchSemester =
      semesterFilter === "all" || post.semester === semesterFilter;
    const matchMajor = majorFilter === "all" || post.major === majorFilter;
    return matchSemester && matchMajor;
  });
}
