import { getAiTokenSnapshot } from "@/utils/aiTokens";
import { isStaffRole, resolveIsPremium } from "@/utils/studentPlan";

/**
 * Quyền đề thi cuối kỳ — SEHUB_PhanTichNghiepVu §3.3, §6
 */

/** Xem đáp án đúng (highlight) — Premium + staff */
export function canViewExamAnswers(user) {
  if (!user) return false;
  if (isStaffRole(user.role)) return true;
  return resolveIsPremium(user);
}

/** Làm bài trắc nghiệm online — Premium + staff */
export function canTakeReviewExam(user) {
  return canViewExamAnswers(user);
}

/** Nộp bài thực hành GitHub — Premium + staff (§3.4) */
export function canSubmitPracticeExam(user) {
  if (!user) return false;
  if (isStaffRole(user.role)) return true;
  return resolveIsPremium(user);
}

/** Bình luận câu hỏi — Premium + staff (§2.3, §3.3) */
export function canCommentOnExamQuestion(user) {
  return canViewExamAnswers(user);
}

/** Xáo câu / hiện đáp án đúng khi ôn tập — Premium + staff (§3.3) */
export function canUseReviewStudyTools(user) {
  return canViewExamAnswers(user);
}

/** Guest không dùng AI; Free 10 token/ngày; Premium 1000 (§6) */
export function getExamAiAccess(user) {
  if (!user) {
    return {
      status: "guest",
      snapshot: getAiTokenSnapshot(null),
    };
  }

  const snapshot = getAiTokenSnapshot(user);

  if (snapshot.canExplain) {
    return { status: "ready", snapshot };
  }

  return { status: "exhausted", snapshot };
}

/** Chat hỏi thêm AI — Premium + staff (§2.3) */
export function canUseExamAiChat(user) {
  if (!user) return false;
  if (isStaffRole(user.role)) return true;
  return resolveIsPremium(user);
}

/** Chỉ Admin không giới hạn token — §6 */
export function shouldAutoRevealAiExplanation(user) {
  return user?.role === "admin";
}
