import { getAdminPendingExams } from "@/features/admin/exams/adminExamData";
import { getAdminReports } from "@/features/admin/moderation/adminReportData";
import { getPendingPracticeSubmissionCount } from "@/features/exams/practiceExamSubmissions";

/** Badge sidebar — đọc từ store, không hardcode */
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
