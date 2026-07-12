import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMIC_YEAR_START,
  EXAM_TERM_SEASON_LABELS,
  EXAM_TERM_SEASON_OPTIONS,
  createDefaultExamTermFields,
  getAcademicYearOptions,
  getDefaultAcademicYear,
  getDefaultTermSeason,
  parseTermFromExamCode,
  resolveExamTermFromCode,
} from "@/features/exams/finalExam/examTermOptions";

describe("examTermOptions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("constants", () => {
    it("exports season options SP, SU, FA", () => {
      expect(EXAM_TERM_SEASON_OPTIONS.map((o) => o.value)).toEqual(["SP", "SU", "FA"]);
      expect(EXAM_TERM_SEASON_LABELS.SU).toBe("Summer");
    });

    it("starts academic years from 2023", () => {
      expect(ACADEMIC_YEAR_START).toBe(2023);
    });
  });

  describe("getAcademicYearOptions", () => {
    it("returns years from ACADEMIC_YEAR_START through current year", () => {
      const years = getAcademicYearOptions();
      expect(years[0]).toBe("2023");
      expect(years[years.length - 1]).toBe("2026");
      expect(years).toContain("2025");
    });
  });

  describe("getDefaultTermSeason and getDefaultAcademicYear", () => {
    it("defaults to SU season in July", () => {
      expect(getDefaultTermSeason()).toBe("SU");
      expect(getDefaultAcademicYear()).toBe("2026");
    });
  });

  describe("createDefaultExamTermFields", () => {
    it("combines default season and year", () => {
      expect(createDefaultExamTermFields()).toEqual({
        termSeason: "SU",
        academicYear: "2026",
      });
    });
  });

  describe("parseTermFromExamCode", () => {
    it("parses season and year from paper code", () => {
      expect(parseTermFromExamCode("FE-PRF192-SU2026-1")).toEqual({
        termSeason: "SU",
        academicYear: "2026",
      });
    });

    it("returns null for invalid codes", () => {
      expect(parseTermFromExamCode("invalid")).toBe(null);
      expect(parseTermFromExamCode(null)).toBe(null);
    });
  });

  describe("resolveExamTermFromCode", () => {
    it("includes human-readable term label", () => {
      expect(resolveExamTermFromCode("PE-SWE201c-FA2025-2")).toEqual({
        termLabel: "Fall",
        year: "2025",
        season: "FA",
      });
    });
  });
});
