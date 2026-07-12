import { describe, expect, it } from "vitest";
import {
  getExamDetailPath,
  getExamFocusDoPath,
  getExamFocusResultPath,
  getExamResultPath,
  getPracticeDoPath,
  getPracticeFocusDoPath,
  getPracticeFocusResultPath,
  getPracticeResultPath,
  isExamFocusPath,
  isPracticeFocusPath,
  resolveExamScope,
} from "@/utils/examFocusPaths";

describe("examFocusPaths", () => {
  const courseCode = "PRF192";
  const examId = "FE-PRF192-SU2026-1";
  const questionIndex = 2;

  describe("isExamFocusPath", () => {
    it("matches /exam/focus/ prefix", () => {
      expect(isExamFocusPath("/exam/focus/final-exam/PRF192/do")).toBe(true);
      expect(isExamFocusPath("/home/final-exam")).toBe(false);
      expect(isExamFocusPath("")).toBe(false);
    });
  });

  describe("isPracticeFocusPath", () => {
    it("matches current and legacy practical-exam focus paths", () => {
      expect(isPracticeFocusPath("/exam/focus/practical-exam/SWE201c/PE-01/do/1")).toBe(true);
      expect(isPracticeFocusPath("/exam/focus/pratical-exam/SWE201c/PE-01/do/1")).toBe(true);
      expect(isPracticeFocusPath("/exam/focus/final-exam/PRF192/do")).toBe(false);
    });
  });

  describe("getExamDetailPath", () => {
    it("builds home and community detail paths for review and practice", () => {
      expect(getExamDetailPath(courseCode, examId, "home", "review")).toBe(
        "/home/final-exam/PRF192/FE-PRF192-SU2026-1",
      );
      expect(getExamDetailPath("SWE201c", "PE-01", "community", "practice")).toBe(
        "/community/practical-exam/SWE201c/PE-01",
      );
    });

    it("encodes special characters in examId", () => {
      const encoded = getExamDetailPath(courseCode, "FE/特殊", "home", "review");
      expect(encoded).toContain(encodeURIComponent("FE/特殊"));
    });
  });

  describe("focus and result path builders", () => {
    it("builds final exam focus do path", () => {
      expect(getExamFocusDoPath(courseCode, examId)).toBe(
        "/exam/focus/final-exam/PRF192/FE-PRF192-SU2026-1/do",
      );
    });

    it("builds deprecated focus result path", () => {
      expect(getExamFocusResultPath(courseCode, examId)).toBe(
        "/exam/focus/final-exam/PRF192/FE-PRF192-SU2026-1/result",
      );
    });

    it("builds scoped result path via exam detail", () => {
      expect(getExamResultPath(courseCode, examId, "home")).toBe(
        "/home/final-exam/PRF192/FE-PRF192-SU2026-1/result",
      );
      expect(getExamResultPath(courseCode, examId, "community")).toBe(
        "/community/final-exam/PRF192/FE-PRF192-SU2026-1/result",
      );
    });

    it("builds practice do and result paths with question index", () => {
      expect(getPracticeDoPath(courseCode, examId, questionIndex, "home")).toBe(
        "/home/practical-exam/PRF192/FE-PRF192-SU2026-1/do/2",
      );
      expect(getPracticeResultPath(courseCode, examId, questionIndex, "community")).toBe(
        "/community/practical-exam/PRF192/FE-PRF192-SU2026-1/result/2",
      );
    });

    it("deprecated practice focus aliases delegate to new helpers", () => {
      expect(getPracticeFocusDoPath(courseCode, examId, 0)).toBe(
        getPracticeDoPath(courseCode, examId, 0),
      );
      expect(getPracticeFocusResultPath(courseCode, examId, 1)).toBe(
        getPracticeResultPath(courseCode, examId, 1),
      );
    });
  });

  describe("resolveExamScope", () => {
    it("prefers location state scope when valid", () => {
      expect(resolveExamScope("/home/final-exam", { scope: "community" })).toBe("community");
      expect(resolveExamScope("/community/x", { scope: "home" })).toBe("home");
    });

    it("infers scope from pathname prefix", () => {
      expect(resolveExamScope("/home/practical-exam")).toBe("home");
      expect(resolveExamScope("/community/documents")).toBe("community");
    });

    it("defaults to home for unrelated paths", () => {
      expect(resolveExamScope("/exam/focus/final-exam")).toBe("home");
      expect(resolveExamScope("/")).toBe("home");
    });

    it("ignores invalid location state scope values", () => {
      expect(resolveExamScope("/community/x", { scope: "invalid" })).toBe("community");
    });
  });
});
