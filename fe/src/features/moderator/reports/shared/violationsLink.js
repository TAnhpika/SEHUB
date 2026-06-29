export function buildViolationsHref(report) {
  const userId = report?.reportedUserId ?? null;
  const username = report?.reportedUser?.username?.replace(/^@/, "") ?? "";
  const reason = report?.reporterReason?.trim() ?? "";
  const code = report?.code?.replace(/^#/, "") ?? "";
  const reporter = report?.reporterUsername?.replace(/^@/, "") ?? "";

  if (!userId && !username) {
    return "/moderator/violations";
  }

  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (username) params.set("username", username);
  if (reason) params.set("reason", reason.slice(0, 500));
  if (code) params.set("code", code);
  if (reporter) params.set("reporter", reporter);

  return `/moderator/violations?${params.toString()}`;
}
