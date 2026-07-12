import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDateTimeFromApi,
  formatIsoLocalDateTime,
  formatRelativeTime,
  formatRelativeTimeFromApi,
  parseApiDate,
} from "@/utils/dateTime";

const FIXED_NOW = new Date("2026-07-10T12:00:00.000Z");

describe("dateTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("parseApiDate", () => {
    describe("happy paths", () => {
      it("parses ISO strings with Z suffix as UTC", () => {
        const date = parseApiDate("2026-07-10T08:30:00Z");
        expect(date).toBeInstanceOf(Date);
        expect(date?.toISOString()).toBe("2026-07-10T08:30:00.000Z");
      });

      it("appends Z to timezone-less API timestamps", () => {
        const date = parseApiDate("2026-07-10T08:30:00");
        expect(date?.toISOString()).toBe("2026-07-10T08:30:00.000Z");
      });

      it("parses explicit offset timestamps", () => {
        const date = parseApiDate("2026-07-10T15:30:00+07:00");
        expect(date?.toISOString()).toBe("2026-07-10T08:30:00.000Z");
      });
    });

    describe("edge cases and error states", () => {
      it("returns null for empty, null, or invalid input", () => {
        expect(parseApiDate(null)).toBe(null);
        expect(parseApiDate(undefined)).toBe(null);
        expect(parseApiDate("")).toBe(null);
        expect(parseApiDate("   ")).toBe(null);
        expect(parseApiDate("not-a-date")).toBe(null);
      });
    });
  });

  describe("formatRelativeTime", () => {
    it('returns "Vừa xong" for timestamps under one minute ago', () => {
      expect(formatRelativeTime("2026-07-10T11:59:30Z")).toBe("Vừa xong");
    });

    it("formats minutes and hours in Vietnamese", () => {
      expect(formatRelativeTime("2026-07-10T11:45:00Z")).toBe("15 phút trước");
      expect(formatRelativeTime("2026-07-10T09:00:00Z")).toBe("3 giờ trước");
    });

    it('returns "Hôm qua" for exactly one day ago', () => {
      expect(formatRelativeTime("2026-07-09T12:00:00Z")).toBe("Hôm qua");
    });

    it("formats multi-day gaps without weeks style", () => {
      expect(formatRelativeTime("2026-07-05T12:00:00Z")).toBe("5 ngày trước");
    });

    it("uses weeks style when requested", () => {
      expect(formatRelativeTime("2026-07-05T12:00:00Z", { style: "weeks" })).toBe("5 ngày trước");
      expect(formatRelativeTime("2026-06-20T12:00:00Z", { style: "weeks" })).toBe("2 tuần trước");
    });

    it("falls back to locale date string beyond one week", () => {
      const result = formatRelativeTime("2026-06-01T12:00:00Z");
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it("returns empty string for invalid dates", () => {
      expect(formatRelativeTime("invalid")).toBe("");
    });
  });

  describe("formatRelativeTimeFromApi", () => {
    it("delegates to formatRelativeTime with weeks style", () => {
      expect(formatRelativeTimeFromApi("2026-06-20T12:00:00Z")).toBe("2 tuần trước");
    });
  });

  describe("formatDateTimeFromApi", () => {
    it("formats valid timestamps in vi-VN locale", () => {
      const result = formatDateTimeFromApi("2026-07-10T08:30:00Z");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(result).not.toBe("—");
    });

    it('returns em dash for invalid input', () => {
      expect(formatDateTimeFromApi(null)).toBe("—");
      expect(formatDateTimeFromApi("bad")).toBe("—");
    });
  });

  describe("formatIsoLocalDateTime", () => {
    it("formats as YYYY-MM-DD HH:mm in local time components", () => {
      const result = formatIsoLocalDateTime("2026-07-10T08:30:00Z");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('returns em dash when date cannot be parsed', () => {
      expect(formatIsoLocalDateTime("")).toBe("—");
    });
  });
});
