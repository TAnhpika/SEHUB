import * as adminApi from "@/api/adminApi";
import * as feedbackApi from "@/api/feedbackApi";
import { getAdminPendingExams } from "@/features/admin/exams/adminExamData";
import { getAdminReports } from "@/features/admin/moderation/adminReportData";
import { getPendingPracticeSubmissionCount } from "@/features/exams/practiceExamSubmissions";
import { getPendingContentCount } from "@/features/moderator/content/contentModerationStore";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/** Badge sidebar — đọc từ store khi mock */
export function getAdminNavBadgeCounts() {
  const pendingReports = getAdminReports().filter((r) => r.status === "pending").length;
  const pendingExams = getAdminPendingExams().length;
  const pendingSubmissions = getPendingPracticeSubmissionCount();
  const pendingPosts = getPendingContentCount();

  return {
    "exam-pending": pendingExams,
    "practice-submissions": pendingSubmissions,
    "pending-posts": pendingPosts,
    moderation: pendingReports,
    feedback: 0,
  };
}

export async function loadAdminNavBadgeCounts() {
  if (USE_MOCK) {
    return getAdminNavBadgeCounts();
  }

  try {
    const [modStats, pendingExamsPage, submissionsPage, pendingFeedbackPage] = await Promise.all([
      adminApi.getModerationStats(),
      adminApi.listExams({ status: "PendingApproval", pageSize: 1 }),
      adminApi.listModerationPracticeSubmissions({ status: "Submitted", pageSize: 1 }),
      feedbackApi.listFeedback({ status: "Pending", pageSize: 1 }),
    ]);

    const pendingSubmissions =
      submissionsPage.totalCount ?? modStats.pendingPracticeSubmissions ?? 0;

    return {
      "exam-pending": pendingExamsPage.totalCount ?? 0,
      "practice-submissions": pendingSubmissions,
      "pending-posts": modStats.pendingPosts ?? 0,
      moderation: modStats.pendingReports ?? 0,
      feedback: pendingFeedbackPage?.totalCount ?? 0,
    };
  } catch {
    return getAdminNavBadgeCounts();
  }
}
