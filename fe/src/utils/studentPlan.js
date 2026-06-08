/** Gói sinh viên — khớp nghiệp vụ SEHUB (Free = Basic trong UI mock) */
export const STUDENT_PLAN = {
  FREE: "Basic",
  PREMIUM: "Premium",
};

export function isStaffRole(role) {
  return role === "admin" || role === "moderator";
}

/**
 * Premium theo bảng actor §6:
 * - Student: chỉ khi plan === Premium (sau PayOS / Admin cộng tay)
 * - Mod / Admin: full quyền Premium để kiểm thử & vận hành
 */
export function resolveIsPremium(user) {
  if (!user) return false;
  if (isStaffRole(user.role)) return true;
  if (user.role && user.role !== "student") return false;
  return user.plan === STUDENT_PLAN.PREMIUM;
}

export function getPlanLabel(plan) {
  if (plan === STUDENT_PLAN.PREMIUM) return "Premium";
  return "Basic";
}
