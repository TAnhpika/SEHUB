/** API timestamps are UTC; without a timezone suffix JS treats them as local time. */
export function parseApiDate(isoDate) {
  if (!isoDate) return null;

  const raw = String(isoDate).trim();
  if (!raw) return null;

  const hasTimezone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * @param {string} isoDate
 * @param {{ style?: "long" | "weeks" }} [options]
 */
export function formatRelativeTime(isoDate, options = {}) {
  const date = parseApiDate(isoDate);
  if (!date) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (options.style === "weeks") {
    if (diffDays < 7) return `${diffDays} ngày trước`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} tuần trước`;
  }

  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
}

/** @deprecated Use formatRelativeTime(iso, { style: "weeks" }) */
export function formatRelativeTimeFromApi(isoDate) {
  return formatRelativeTime(isoDate, { style: "weeks" });
}

export function formatDateTimeFromApi(isoDate) {
  const date = parseApiDate(isoDate);
  if (!date) return "—";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatIsoLocalDateTime(isoDate) {
  const date = parseApiDate(isoDate);
  if (!date) return "—";

  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
