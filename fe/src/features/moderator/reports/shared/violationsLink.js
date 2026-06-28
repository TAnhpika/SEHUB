export function buildViolationsHref(report) {
  const userId = report?.reportedUserId ?? null;
  const username = report?.reportedUser?.username?.replace(/^@/, "") ?? "";
  const reason = report?.reporterReason?.trim() ?? "";

  if (!userId && !username) {
    return "/moderator/violations";
  }

  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (username) params.set("username", username);
  if (reason) params.set("reason", reason.slice(0, 500));

  return `/moderator/violations?${params.toString()}`;
}
