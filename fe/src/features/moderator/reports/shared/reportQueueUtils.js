import { REASON_META } from "@/features/moderator/reports/reportsData";
import { filterReports, sortModeratorReports } from "@/features/moderator/reports/reportsData";

export function getReportedUsername(report) {
  if (!report) return "";
  if (report.category === "community") return report.reportedUser ?? "";
  return report.reportedUser?.username?.replace(/^@/, "") ?? "";
}

export function getResolvedBannerTitle(resolved) {
  if (!resolved) return "Đã xử lý báo cáo";
  if (resolved.category === "community") return `Đã xử lý báo cáo bài #${resolved.postId}`;
  return `Đã xử lý báo cáo ${resolved.code ?? ""}`;
}

export function matchesReportSearch(report, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return true;

  const reasonLabel = REASON_META[report.reason]?.label ?? report.reason ?? "";
  const fields = [
    report.code,
    report.snippet,
    report.reason,
    reasonLabel,
    report.postId,
    report.reporter,
    report.reportedUser,
    report.reporterUsername,
    report.reportedUser?.username,
    report.examId,
    report.post?.title,
    report.post?.excerpt,
  ];

  return fields
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
}

export function filterModerationReports(reports, { tab, category, query }) {
  const statusFiltered = filterReports(reports, tab === "all" ? "all" : tab);
  const categoryFiltered =
    category === "all"
      ? statusFiltered
      : statusFiltered.filter((report) => report.category === category);
  const searched = query
    ? categoryFiltered.filter((report) => matchesReportSearch(report, query))
    : categoryFiltered;

  return sortModeratorReports(searched, tab);
}

export function pickNextPendingReportId(reports, resolvedId, tab = "pending") {
  const pending = reports.filter((r) => r.status === "pending" && r.id !== resolvedId);
  if (tab === "pending" && pending.length > 0) {
    return pending[0].id;
  }
  return reports.find((r) => r.id !== resolvedId)?.id ?? null;
}
