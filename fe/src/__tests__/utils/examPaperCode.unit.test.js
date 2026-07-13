import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as adminApi from "@/api/adminApi";
import {
  EXAM_TYPE_PREFIX,
  buildExamPaperCodePrefix,
  formatExamPaperDisplayCode,
  generateExamPaperCode,
  getSeasonTerm,
  invalidateExamPaperCodeCache,
  isValidExamPaperCode,
  loadExistingExamPaperIdentifiers,
  nextExamPaperSequence,
  parseExamPaperCode,
} from "@/utils/examPaperCode";
import { mockExistingPaperIdentifiers } from "../fixtures/mockExams";

describe("examPaperCode", () => {
  describe("getSeasonTerm", () => {
    it("returns SP for Jan–Apr", () => {
      expect(getSeasonTerm(new Date(2026, 1, 15))).toBe("SP2026");
      expect(getSeasonTerm(new Date(2026, 3, 30))).toBe("SP2026");
    });

    it("returns SU for May–Aug", () => {
      expect(getSeasonTerm(new Date(2026, 6, 10))).toBe("SU2026");
    });

    it("returns FA for Sep–Dec", () => {
      expect(getSeasonTerm(new Date(2026, 10, 1))).toBe("FA2026");
    });
  });

  describe("buildExamPaperCodePrefix", () => {
    it("builds FE prefix for final exams", () => {
      expect(buildExamPaperCodePrefix("final", "prf192", { season: "SU", year: "2026" })).toBe(
        "FE-PRF192-SU2026",
      );
    });

    it("builds PE prefix for practice exams", () => {
      expect(buildExamPaperCodePrefix("practice", "SWE201c", { season: "FA", year: "2025" })).toBe(
        "PE-SWE201c-FA2025",
      );
    });

    it("returns null when subject code is invalid", () => {
      expect(buildExamPaperCodePrefix("final", "INVALID")).toBe(null);
    });

    it("uses EXAM_TYPE_PREFIX constants", () => {
      expect(EXAM_TYPE_PREFIX.final).toBe("FE");
      expect(EXAM_TYPE_PREFIX.practice).toBe("PE");
    });
  });

  describe("parseExamPaperCode", () => {
    it("parses canonical FE/PE paper codes", () => {
      const parsed = parseExamPaperCode("FE-PRF192-SU2026-3");
      expect(parsed).toEqual({
        type: "FE",
        subjectCode: "PRF192",
        season: "SU",
        year: "2026",
        sequence: 3,
        term: "SU2026",
      });
    });

    it("parses short legacy format PRF192_SU26", () => {
      const parsed = parseExamPaperCode("PRF192_SU26");
      expect(parsed?.subjectCode).toBe("PRF192");
      expect(parsed?.season).toBe("SU");
      expect(parsed?.year).toBe("2026");
      expect(parsed?.sequence).toBe(1);
    });

    it("strips revision suffix before parsing", () => {
      const parsed = parseExamPaperCode("FE-PRF192-SU2026-1-REV-a1b2c3");
      expect(parsed?.sequence).toBe(1);
    });

    it("returns null for unrecognizable codes", () => {
      expect(parseExamPaperCode("Môn PRF192")).toBe(null);
      expect(parseExamPaperCode("")).toBe(null);
    });
  });

  describe("formatExamPaperDisplayCode", () => {
    it("formats canonical codes to SUBJECT_SEASONYY display", () => {
      expect(formatExamPaperDisplayCode("FE-PRF192-SU2026-1")).toBe("PRF192_SU26");
      expect(formatExamPaperDisplayCode("PE-SWE201c-FA2025-2")).toBe("SWE201c_FA25");
    });

    it("preserves short format input", () => {
      expect(formatExamPaperDisplayCode("PRF192_SU26")).toBe("PRF192_SU26");
    });

    it("returns empty string for blank input", () => {
      expect(formatExamPaperDisplayCode("")).toBe("");
    });
  });

  describe("isValidExamPaperCode", () => {
    it("accepts canonical and short formats", () => {
      expect(isValidExamPaperCode("FE-PRF192-SU2026-1")).toBe(true);
      expect(isValidExamPaperCode("PRF192_SU26")).toBe(true);
    });

    it("accepts legacy format when allowLegacy is true", () => {
      expect(isValidExamPaperCode("FE-LEGACY-SU2026")).toBe(true);
      expect(isValidExamPaperCode("FE-LEGACY-SU2026", { allowLegacy: false })).toBe(false);
    });

    it("rejects Vietnamese subject titles and revision suffix before validation", () => {
      expect(isValidExamPaperCode("Môn PRF192")).toBe(false);
      // stripRevisionLabel removes -REV-* before pattern check, so base code remains valid
      expect(isValidExamPaperCode("FE-PRF192-SU2026-1-REV-abc")).toBe(true);
    });
  });

  describe("nextExamPaperSequence", () => {
    it("returns max sequence + 1 for matching prefix", () => {
      const prefix = "FE-PRF192-SU2026";
      expect(nextExamPaperSequence(mockExistingPaperIdentifiers, prefix)).toBe(3);
    });

    it("returns 1 when no existing identifiers match", () => {
      expect(nextExamPaperSequence([], "FE-NEW101-SU2026")).toBe(1);
    });
  });

  describe("generateExamPaperCode", () => {
    it("generates next sequential code for subject and term", () => {
      const code = generateExamPaperCode(
        "final",
        "PRF192",
        mockExistingPaperIdentifiers,
        { season: "SU", year: "2026" },
      );
      expect(code).toBe("FE-PRF192-SU2026-3");
    });

    it("returns empty string when subject is invalid", () => {
      expect(generateExamPaperCode("final", "bad", [])).toBe("");
    });
  });

  describe("loadExistingExamPaperIdentifiers", () => {
    beforeEach(() => {
      invalidateExamPaperCodeCache();
      vi.restoreAllMocks();
    });

    afterEach(() => {
      invalidateExamPaperCodeCache();
    });

    it("fetches and caches identifiers from admin API", async () => {
      vi.spyOn(adminApi, "listExams").mockResolvedValue({
        items: [
          { code: "FE-PRF192-SU2026-1", title: "FE-PRF192-SU2026-1" },
          { code: "PE-SWE201c-SU2026-1", title: "Alt title" },
        ],
      });

      const first = await loadExistingExamPaperIdentifiers({ force: true });
      expect(first).toContain("FE-PRF192-SU2026-1");
      expect(first).toContain("Alt title");

      const second = await loadExistingExamPaperIdentifiers();
      expect(adminApi.listExams).toHaveBeenCalledTimes(1);
      expect(second).toEqual(first);
    });

    it("returns cached or empty array on API failure", async () => {
      vi.spyOn(adminApi, "listExams").mockRejectedValue(new Error("network"));

      const result = await loadExistingExamPaperIdentifiers({ force: true });
      expect(result).toEqual([]);
    });
  });
});
