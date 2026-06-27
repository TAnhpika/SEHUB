import * as adminApi from "@/api/adminApi";
import { getAdminPendingExams } from "@/features/admin/exams/adminExamData";
import { getAdminReports } from "@/features/admin/moderation/adminReportData";
import { getPendingPracticeSubmissionCount } from "@/features/exams/practiceExamSubmissions";
import { getPendingExamQuestionReportCount } from "@/features/exams/examQuestionReportStore";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

async function getPendingConversationReportCountSafe() {
  try {
    const result = await adminApi.getPendingConversationReportCount();
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

async function getPendingQuestionReportCountSafe() {
  try {
    return await getPendingExamQuestionReportCount();
  } catch {
    return 0;
  }
}

/** Badge sidebar — đọc từ store khi mock */
export function getAdminNavBadgeCounts() {
  const pendingReports = getAdminReports().filter((r) => r.status === "pending").length;
  const pendingExams = getAdminPendingExams().length;
  const pendingSubmissions = getPendingPracticeSubmissionCount();

  return {
    "exam-pending": pendingExams,
    "practice-submissions": pendingSubmissions,
    moderation: pendingReports,
  };
}

export async function loadAdminNavBadgeCounts() {
  if (USE_MOCK) {
    return getAdminNavBadgeCounts();
  }

  try {
    const [modStats, pendingExamsPage, submissionsPage, conversationPending, questionPending] =
      await Promise.all([
        adminApi.getModerationStats(),
        adminApi.listExams({ status: "PendingApproval", pageSize: 1 }),
        adminApi.listModerationPracticeSubmissions({ status: "Submitted", pageSize: 1 }),
        getPendingConversationReportCountSafe(),
        getPendingQuestionReportCountSafe(),
      ]);

    const pendingSubmissions =
      submissionsPage.totalCount ?? modStats.pendingPracticeSubmissions ?? 0;
    const postPending = modStats.pendingReports ?? 0;

    return {
      "exam-pending": pendingExamsPage.totalCount ?? 0,
      "practice-submissions": pendingSubmissions,
      moderation: postPending + conversationPending + questionPending,
    };
  } catch {
    return getAdminNavBadgeCounts();
  }
}
