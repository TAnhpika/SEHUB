/**
 * @fileoverview Quy ước gói học viên và helper xác định quyền Premium theo vai trò/nghiệp vụ.
 *
 * @module utils/studentPlan
 */

/**
 * Gói sinh viên — khớp nghiệp vụ SEHUB (Free = Basic trong UI mock).
 *
 * @constant {{ FREE: string, PREMIUM: string }}
 * @readonly
 */
export const STUDENT_PLAN = {
  FREE: "Basic",
  PREMIUM: "Premium",
};

/**
 * Kiểm tra role có thuộc nhóm vận hành được hưởng quyền Premium nội bộ hay không.
 *
 * @param {string | null | undefined} role - Vai trò người dùng từ hồ sơ đăng nhập.
 * @returns {boolean} `true` nếu role là `admin` hoặc `moderator`.
 *
 * @example
 * isStaffRole("moderator"); // true
 */
export function isStaffRole(role) {
  return role === "admin" || role === "moderator";
}

/**
 * Xác định người dùng hiện tại có được coi là Premium trong nghiệp vụ SEHUB hay không.
 *
 * Premium theo bảng actor §6:
 * - Student: chỉ khi plan === Premium (sau PayOS / Admin cộng tay)
 * - Mod / Admin: full quyền Premium để kiểm thử & vận hành
 *
 * @param {{ role?: string | null, plan?: string | null } | null | undefined} user - User đã enrich từ auth/profile.
 * @returns {boolean} `true` nếu user có quyền Premium.
 *
 * @example
 * resolveIsPremium({ role: "student", plan: STUDENT_PLAN.PREMIUM }); // true
 */
export function resolveIsPremium(user) {
  if (!user) return false;
  if (isStaffRole(user.role)) return true;
  if (user.role && user.role !== "student") return false;
  return user.plan === STUDENT_PLAN.PREMIUM;
}

/**
 * Chuẩn hóa nhãn hiển thị plan cho UI.
 *
 * @param {string | null | undefined} plan - Giá trị plan đang lưu trên user/subscription.
 * @returns {string} `Premium` hoặc `Basic`.
 *
 * @example
 * getPlanLabel(STUDENT_PLAN.FREE); // 'Basic'
 */
export function getPlanLabel(plan) {
  if (plan === STUDENT_PLAN.PREMIUM) return "Premium";
  return "Basic";
}
