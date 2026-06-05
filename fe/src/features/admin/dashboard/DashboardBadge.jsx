import dash from "./AdminDashboardPage.module.css";

const VARIANT_CLASS = {
  neutral: dash.badgeNeutral,
  primary: dash.badgePrimary,
  success: dash.badgeSuccess,
  warning: dash.badgeWarning,
  danger: dash.badgeDanger,
  exam: dash.badgeExam,
  report: dash.badgeReport,
  payment: dash.badgePayment,
  user: dash.badgeUser,
};

/**
 * @param {{
 *   variant?: keyof typeof VARIANT_CLASS;
 *   children: import('react').ReactNode;
 *   className?: string;
 * }} props
 */
function DashboardBadge({ variant = "neutral", children, className = "" }) {
  const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.neutral;
  return (
    <span className={`${dash.badge} ${variantClass} ${className}`.trim()}>{children}</span>
  );
}

export default DashboardBadge;
