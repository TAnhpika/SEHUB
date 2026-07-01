import { SEMESTERS } from "@/features/posts/createPostData";
import { parseSemesterNumberFromLabel } from "@/features/moderator/practiceExams/practiceExamData";

export function semesterIdToLabel(semesterId) {
  const n = Number(semesterId);
  if (!Number.isFinite(n) || n <= 0) return "";
  return SEMESTERS[n - 1] ?? `Học kỳ ${n}`;
}
export function semesterLabelToId(semesterLabel) {
  const parsed = parseSemesterNumberFromLabel(semesterLabel);
  return parsed != null ? String(parsed) : "";
}
