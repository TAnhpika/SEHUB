export const HEATMAP_WEEKS = 26;
export const HEATMAP_DAYS = 7;
export const HEATMAP_LOCALE = "en-US";

export const HEATMAP_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Minimum week columns between month labels (prevents "Dec" + "Jan" overlap). */
const MIN_WEEK_GAP = 3;

/** Monday = 0 … Sunday = 6 */
export function getMondayBasedDayIndex(date) {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function startOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function startOfWeekMonday(date) {
  const normalized = startOfDay(date);
  normalized.setDate(normalized.getDate() - getMondayBasedDayIndex(normalized));
  return normalized;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

export function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Locale-aware month label for heatmap headers (no hard-coded month names).
 * vi-VN → T1…T12; other locales → Intl short month (Jan, Feb, …).
 */
export function formatHeatmapMonthLabel(date, locale = HEATMAP_LOCALE) {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const normalizedLocale = String(locale).replace("_", "-");

  if (normalizedLocale.toLowerCase().startsWith("vi")) {
    return `T${date.getMonth() + 1}`;
  }

  return new Intl.DateTimeFormat(normalizedLocale, { month: "short" }).format(date);
}

/**
 * Pick the date that best represents a month within a week column (GitHub-style).
 * Prefer the 1st of the month when it falls inside the column; otherwise column start.
 */
export function resolveMonthLabelDate(columnStart, columnEnd) {
  const firstOfMonth = new Date(columnStart.getFullYear(), columnStart.getMonth(), 1);

  if (firstOfMonth >= columnStart && firstOfMonth <= columnEnd) {
    return firstOfMonth;
  }

  return columnStart;
}

/**
 * Build month labels for week columns.
 * Labels align to the week where a new month begins; cramped labels drop the earlier one.
 */
export function buildHeatmapMonthLabels(weekColumnStarts, locale = HEATMAP_LOCALE) {
  const labels = Array(weekColumnStarts.length).fill("");
  let lastLabelWeek = -MIN_WEEK_GAP;
  let previousMonthKey = null;

  weekColumnStarts.forEach((columnStart, week) => {
    const columnEnd = addDays(columnStart, HEATMAP_DAYS - 1);
    const monthKey = `${columnStart.getFullYear()}-${columnStart.getMonth()}`;

    if (monthKey === previousMonthKey) {
      return;
    }

    const labelDate = resolveMonthLabelDate(columnStart, columnEnd);
    const hasRoom = week - lastLabelWeek >= MIN_WEEK_GAP;

    if (!hasRoom && lastLabelWeek >= 0) {
      labels[lastLabelWeek] = "";
    }

    labels[week] = formatHeatmapMonthLabel(labelDate, locale);
    lastLabelWeek = week;
    previousMonthKey = monthKey;
  });

  return labels;
}

/**
 * Build a GitHub-style contribution grid ending on the week that contains `endDate`.
 */
export function buildHeatmapGrid({
  endDate = new Date(),
  weeks = HEATMAP_WEEKS,
  locale = HEATMAP_LOCALE,
  levelByDate = new Map(),
  countByDate = new Map(),
} = {}) {
  const today = startOfDay(endDate);
  const endWeekMonday = startOfWeekMonday(today);
  const startWeekMonday = addDays(endWeekMonday, -(weeks - 1) * HEATMAP_DAYS);

  const cells = [];
  const weekColumnStarts = [];

  for (let week = 0; week < weeks; week += 1) {
    const weekMonday = addDays(startWeekMonday, week * HEATMAP_DAYS);
    weekColumnStarts.push(weekMonday);

    for (let day = 0; day < HEATMAP_DAYS; day += 1) {
      const date = addDays(weekMonday, day);
      const isoDate = formatIsoDate(date);

      cells.push({
        week,
        day,
        level: levelByDate.get(isoDate) ?? 0,
        date: isoDate,
        count: countByDate.get(isoDate) ?? 0,
      });
    }
  }

  return {
    months: buildHeatmapMonthLabels(weekColumnStarts, locale),
    dayLabels: HEATMAP_DAY_LABELS,
    cells,
  };
}
