export function parseApiDate(isoDate) {
  if (!isoDate) return null;

  const raw = String(isoDate).trim();
  if (!raw) return null;

  const hasTimezone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativeTimeFromApi(isoDate) {
  const date = parseApiDate(isoDate);
  if (!date) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} tuần trước`;
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
