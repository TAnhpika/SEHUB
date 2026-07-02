import {
  mapApiStatusToFe,
  parseFeedbackFromComment,
  parseGradeFromComment,
} from "@/api/practiceSubmissionMapper";
import { EXAM_COMPLETED_REWARD_POINTS } from "./learningActivityConstants";

function resolveCourseCodeFromExamCode(examCode) {
  const match = examCode?.match(/^([A-Z0-9]+)-/i);
  return match?.[1]?.toUpperCase() ?? "";
}

function deriveCorrectCount(scorePercent, totalQuestions) {
  if (!totalQuestions) return 0;
  return Math.round((Number(scorePercent) / 100) * totalQuestions);
}

/** @param {Record<string, unknown>} dto */
export function mapExamAttemptHistoryDto(dto) {
  const examCode = dto.examCode ?? dto.exam?.code ?? "";
  const totalQuestions = dto.questionCount ?? dto.totalQuestions ?? 0;
  const scorePercent = Number(dto.scorePercent ?? dto.score ?? 0);

  return {
    attemptId: dto.attemptId ?? dto.id,
    examId: dto.examId,
    examCode,
    examTitle: dto.examTitle ?? dto.exam?.title ?? "Final Examination",
    major: dto.major ?? dto.exam?.major ?? "",
    semester: dto.semester ?? dto.exam?.semester ?? 0,
    submittedAt: dto.submittedAt,
    scorePercent,
    correctCount: dto.correctCount ?? deriveCorrectCount(scorePercent, totalQuestions),
    totalQuestions,
    rewardPoints: EXAM_COMPLETED_REWARD_POINTS,
  };
}

/** @param {Record<string, unknown>} page */
export function mapExamAttemptHistoryPage(page) {
  const items = (page.items ?? []).map(mapExamAttemptHistoryDto);
  return {
    items,
    page: page.page ?? 1,
    pageSize: page.pageSize ?? items.length,
    totalCount: page.totalCount ?? items.length,
    hasNextPage: Boolean(page.hasNextPage),
    source: "api",
  };
}

/** @param {Record<string, unknown>} dto */
export function mapPracticeHistoryDto(dto) {
  const examCode = dto.examCode ?? "";
  const feedback = dto.reviewerComment ?? "";

  return {
    id: dto.id,
    examId: dto.examId,
    examCode,
    examTitle: dto.examTitle ?? "Practice",
    courseCode: resolveCourseCodeFromExamCode(examCode),
    githubUrl: dto.gitHubRepoUrl ?? dto.githubUrl ?? "",
    status: mapApiStatusToFe(dto.status),
    submittedAt: dto.submittedAt,
    reviewedAt: dto.reviewedAt ?? null,
    grade: parseGradeFromComment(feedback),
    feedback: parseFeedbackFromComment(feedback),
  };
}

/** @param {Record<string, unknown>} page */
export function mapPracticeHistoryPage(page) {
  const items = (page.items ?? []).map(mapPracticeHistoryDto);
  return {
    items,
    page: page.page ?? 1,
    pageSize: page.pageSize ?? items.length,
    totalCount: page.totalCount ?? items.length,
    hasNextPage: Boolean(page.hasNextPage),
    source: "api",
  };
}
