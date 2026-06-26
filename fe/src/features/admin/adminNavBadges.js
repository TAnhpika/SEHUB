import * as adminApi from "@/api/adminApi";
import { getAdminPendingExams } from "@/features/admin/exams/adminExamData";
import { getAdminReports } from "@/features/admin/moderation/adminReportData";
import { getPendingPracticeSubmissionCount } from "@/features/exams/practiceExamSubmissions";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

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
    const [modStats, pendingExamsPage, submissionsPage] = await Promise.all([
      adminApi.getModerationStats(),
      adminApi.listExams({ status: "PendingApproval", pageSize: 1 }),
      adminApi.listModerationPracticeSubmissions({ status: "Submitted", pageSize: 1 }),
    ]);

    const pendingSubmissions =
      submissionsPage.totalCount ?? modStats.pendingPracticeSubmissions ?? 0;

    return {
      "exam-pending": pendingExamsPage.totalCount ?? 0,
      "practice-submissions": pendingSubmissions,
      moderation: modStats.pendingReports ?? 0,
    };
  } catch {
    return getAdminNavBadgeCounts();
  }
}
