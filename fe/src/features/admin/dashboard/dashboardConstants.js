import {
  faBook,
  faClipboardCheck,
  faCreditCard,
  faFlag,
  faTrophy,
  faUserShield,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

/** KPI hàng trên (ưu tiên) vs hàng dưới */
export const KPI_PRIMARY_IDS = ["users", "revenue", "premium", "reports"];
export const KPI_SECONDARY_IDS = ["exams", "documents", "posts"];

export const PENDING_ACTION_BADGE = {
  p1: "actionMod",
  p2: "actionReport",
  p3: "actionError",
};

export const ACTIVITY_BADGE_VARIANT = {
  exam: "exam",
  report: "report",
  payment: "payment",
  user: "user",
};

export const QUICK_LINK_ICONS = {
  "/admin/users": faUsers,
  "/admin/exams/pending": faClipboardCheck,
  "/admin/moderation": faFlag,
  "/admin/documents": faBook,
  "/admin/payments": faCreditCard,
  "/admin/permissions": faUserShield,
  "/admin/users?status=banned": faUsers,
  "/admin/gamification": faTrophy,
};

export function splitStatsByTier(stats) {
  const primary = stats.filter((s) => KPI_PRIMARY_IDS.includes(s.id));
  const secondary = stats.filter((s) => KPI_SECONDARY_IDS.includes(s.id));
  return { primary, secondary };
}

export function trendBadgeVariant(trend, urgent) {
  if (urgent) return "warning";
  if (trend === "down") return "warning";
  if (trend === "up") return "success";
  return "neutral";
}
