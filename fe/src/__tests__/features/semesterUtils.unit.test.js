import { describe, expect, it } from "vitest";
import {
  semesterIdToLabel,
  semesterLabelToId,
} from "@/features/exams/finalExam/semesterUtils";

describe("semesterUtils", () => {
  describe("semesterIdToLabel", () => {
    it("maps numeric semester id to SEMESTERS label", () => {
      expect(semesterIdToLabel(1)).toBe("Học kỳ 1");
      expect(semesterIdToLabel("4")).toBe("Học kỳ 4");
    });

    it("returns fallback label for out-of-range semesters", () => {
      expect(semesterIdToLabel(99)).toBe("Học kỳ 99");
    });

    it("returns empty string for invalid ids", () => {
      expect(semesterIdToLabel(0)).toBe("");
      expect(semesterIdToLabel("")).toBe("");
      expect(semesterIdToLabel(null)).toBe("");
    });
  });

  describe("semesterLabelToId", () => {
    it("extracts semester number from label", () => {
      expect(semesterLabelToId("Học kỳ 5")).toBe("5");
      expect(semesterLabelToId("Kỳ 3")).toBe("3");
    });

    it("returns empty string when label has no number", () => {
      expect(semesterLabelToId("")).toBe("");
      expect(semesterLabelToId("Invalid")).toBe("");
    });
  });
});
