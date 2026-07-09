/**
 * @fileoverview Re-export legacy — dùng `moderatorExamContributionStore` thay thế.
 *
 * Module này giữ tương thích ngược cho import cũ từ `practiceExamContributionStore`.
 * Tất cả symbol đều delegate sang store thống nhất đề cuối kỳ + thực hành.
 *
 * @module features/moderator/practiceExams/practiceExamContributionStore
 * @deprecated Import từ `@/features/moderator/exams/moderatorExamContributionStore`.
 */

/** @deprecated Import from @/features/moderator/exams/moderatorExamContributionStore */
export {
  CONTRIBUTION_STATUS_LABELS,
  getPendingContributionCount,
  getPracticeExamContributionAudit,
  recordPracticeExamDraft,
  resolvePendingStatus,
  submitPracticeExamForApproval,
} from "@/features/moderator/exams/moderatorExamContributionStore";
