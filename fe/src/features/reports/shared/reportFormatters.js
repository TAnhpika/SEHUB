/** Shared community post report reasons for feed + moderation UI. */
export const COMMUNITY_REPORT_REASONS = [
  { id: "spam", label: "Spam hoặc quảng cáo", tone: "danger" },
  { id: "inappropriate", label: "Nội dung không phù hợp", tone: "muted" },
  { id: "harassment", label: "Quấy rối hoặc bắt nạt", tone: "danger" },
  { id: "misinformation", label: "Thông tin sai lệch", tone: "muted" },
  { id: "copyright", label: "Vi phạm bản quyền", tone: "muted" },
  { id: "other", label: "Khác", tone: "muted" },
];

export const COMMUNITY_REPORT_REASON_META = Object.fromEntries(
  COMMUNITY_REPORT_REASONS.map(({ id, label, tone }) => [id, { label, tone }]),
);

export const MIN_REPORT_DETAIL_LENGTH = 10;

export function formatReportCode(id) {
  const short = String(id ?? "")
    .replace(/-/g, "")
    .slice(0, 4)
    .toUpperCase();
  return short ? `RP-${short}` : "RP-0000";
}

export function inferReasonId(reasonText) {
  const text = String(reasonText ?? "").toLowerCase();
  if (text.includes("spam") || text.includes("quảng cáo")) return "spam";
  if (text.includes("quấy") || text.includes("bắt nạt") || text.includes("harass")) return "harassment";
  if (text.includes("sai") || text.includes("fake") || text.includes("lệch")) return "misinformation";
  if (text.includes("độc") || text.includes("toxic") || text.includes("không phù hợp")) return "harmful";
  if (text.includes("bản quyền") || text.includes("copyright")) return "copyright";
  return "other";
}

export function toReportInitials(value) {
  const parts = String(value ?? "")
    .replace(/^@/, "")
    .split(/[\s_]+/);
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "?";
}

export function truncateReportSnippet(text, maxLength = 72) {
  const raw = String(text ?? "").trim();
  if (raw.length <= maxLength) return raw;
  return `${raw.slice(0, maxLength)}…`;
}
