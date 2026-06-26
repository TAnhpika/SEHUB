function roleLabelFor(role) {
  if (role === "admin") return "Quản trị viên";
  if (role === "moderator") return "Kiểm duyệt viên";
  return undefined;
}

const PREMIUM_PLAN = "Premium";
const FREE_PLAN = "Basic";

export function mapApiUser(dto) {
  if (!dto) return null;

  const role = (dto.role ?? "Student").toLowerCase();
  const displayName = dto.displayName?.trim() || dto.username || dto.email || "User";
  const isPremium = Boolean(dto.isPremium);

  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    displayName,
    initial: displayName.charAt(0).toUpperCase(),
    role,
    roleLabel: roleLabelFor(role),
    isPremium,
    plan: isPremium ? PREMIUM_PLAN : FREE_PLAN,
    points: dto.points ?? 0,
    level: dto.levelName ?? "Bronze",
    avatarUrl: dto.avatarUrl ?? null,
    emailConfirmed: dto.emailConfirmed ?? false,
    streak: 0,
    unreadNotifications: 0,
    levelProgress: 0,
    pointsToNext: 0,
  };
}

export function deriveUsernameFromEmail(email) {
  const local = email.split("@")[0] ?? "user";
  const sanitized = local.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
  const trimmed = sanitized.replace(/^_+|_+$/g, "");
  if (trimmed.length >= 3) {
    return trimmed.slice(0, 50);
  }
  return `user_${trimmed || "sehub"}`.slice(0, 50);
}
