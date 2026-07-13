import { describe, expect, it } from "vitest";
import {
  HEATMAP_DAYS,
  HEATMAP_DAY_LABELS,
  HEATMAP_WEEKS,
  addDays,
  buildHeatmapGrid,
  buildHeatmapMonthLabels,
  formatHeatmapMonthLabel,
  formatIsoDate,
  getMondayBasedDayIndex,
  resolveMonthLabelDate,
  startOfDay,
  startOfWeekMonday,
} from "@/utils/heatmapCalendar";

describe("heatmapCalendar", () => {
  const sampleDate = new Date(2026, 6, 10); // July 10, 2026 (Friday)

  describe("getMondayBasedDayIndex", () => {
    it("maps Monday to 0 and Sunday to 6", () => {
      expect(getMondayBasedDayIndex(new Date(2026, 6, 6))).toBe(0); // Mon
      expect(getMondayBasedDayIndex(new Date(2026, 6, 12))).toBe(6); // Sun
    });
  });

  describe("startOfDay", () => {
    it("zeroes time components", () => {
      const input = new Date(2026, 6, 10, 15, 45, 30, 500);
      const result = startOfDay(input);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe("startOfWeekMonday", () => {
    it("returns Monday of the week containing the given date", () => {
      const monday = startOfWeekMonday(sampleDate);
      expect(monday.getDay()).toBe(1);
      expect(formatIsoDate(monday)).toBe("2026-07-06");
    });
  });

  describe("addDays", () => {
    it("advances calendar days and normalizes to start of day", () => {
      const next = addDays(sampleDate, 3);
      expect(formatIsoDate(next)).toBe("2026-07-13");
      expect(next.getHours()).toBe(0);
    });

    it("handles negative offsets", () => {
      expect(formatIsoDate(addDays(sampleDate, -5))).toBe("2026-07-05");
    });
  });

  describe("formatIsoDate", () => {
    it("formats as YYYY-MM-DD with zero padding", () => {
      expect(formatIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    });
  });

  describe("formatHeatmapMonthLabel", () => {
    it("uses T{n} format for Vietnamese locale", () => {
      expect(formatHeatmapMonthLabel(new Date(2026, 0, 15), "vi-VN")).toBe("T1");
      expect(formatHeatmapMonthLabel(new Date(2026, 11, 1), "vi_VN")).toBe("T12");
    });

    it("uses Intl short month for non-Vietnamese locales", () => {
      const label = formatHeatmapMonthLabel(new Date(2026, 6, 1), "en-US");
      expect(label).toMatch(/Jul/);
    });

    it("returns empty string for invalid dates", () => {
      expect(formatHeatmapMonthLabel(null)).toBe("");
      expect(formatHeatmapMonthLabel(new Date("invalid"))).toBe("");
    });
  });

  describe("resolveMonthLabelDate", () => {
    it("prefers the 1st of month when it falls inside the column", () => {
      const columnStart = new Date(2026, 6, 1);
      const columnEnd = new Date(2026, 6, 7);
      const labelDate = resolveMonthLabelDate(columnStart, columnEnd);
      expect(labelDate.getDate()).toBe(1);
      expect(labelDate.getMonth()).toBe(6);
    });

    it("falls back to column start when 1st is outside range", () => {
      const columnStart = new Date(2026, 6, 7);
      const columnEnd = new Date(2026, 6, 13);
      expect(resolveMonthLabelDate(columnStart, columnEnd)).toBe(columnStart);
    });
  });

  describe("buildHeatmapMonthLabels", () => {
    it("places month labels with minimum gap between them", () => {
      const weekStarts = [
        new Date(2026, 5, 30),
        new Date(2026, 6, 7),
        new Date(2026, 6, 14),
        new Date(2026, 6, 21),
        new Date(2026, 6, 28),
      ];
      const labels = buildHeatmapMonthLabels(weekStarts, "en-US");
      const nonEmpty = labels.filter(Boolean);
      expect(nonEmpty.length).toBeGreaterThan(0);
      expect(labels.some((l) => l.includes("Jul") || l.startsWith("T"))).toBe(true);
    });
  });

  describe("buildHeatmapGrid", () => {
    it("produces default 26 weeks × 7 days of cells", () => {
      const grid = buildHeatmapGrid({ endDate: sampleDate });
      expect(grid.cells).toHaveLength(HEATMAP_WEEKS * HEATMAP_DAYS);
      expect(grid.dayLabels).toEqual(HEATMAP_DAY_LABELS);
      expect(grid.months).toHaveLength(HEATMAP_WEEKS);
    });

    it("applies level and count maps by ISO date key", () => {
      const levelByDate = new Map([["2026-07-10", 3]]);
      const countByDate = new Map([["2026-07-10", 5]]);
      const grid = buildHeatmapGrid({
        endDate: sampleDate,
        weeks: 2,
        levelByDate,
        countByDate,
      });

      const targetCell = grid.cells.find((c) => c.date === "2026-07-10");
      expect(targetCell?.level).toBe(3);
      expect(targetCell?.count).toBe(5);
    });

    it("defaults level and count to 0 when date not in maps", () => {
      const grid = buildHeatmapGrid({ endDate: sampleDate, weeks: 1 });
      grid.cells.forEach((cell) => {
        expect(cell.level).toBe(0);
        expect(cell.count).toBe(0);
      });
    });

    it("supports custom week count", () => {
      const grid = buildHeatmapGrid({ endDate: sampleDate, weeks: 4 });
      expect(grid.cells).toHaveLength(4 * HEATMAP_DAYS);
    });
  });
});
