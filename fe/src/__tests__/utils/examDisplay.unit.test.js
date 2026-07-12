import { describe, expect, it } from "vitest";
import {
  buildExamDisplayFields,
  buildExamPaperCode,
  enrichRevisionExamEntries,
  extractCourseSubjectCode,
  findCourseMajor,
  getExamDisplayCode,
  getExamDisplayTitle,
  getExamListPaperLabel,
  getExamSubjectCode,
  inferMajorFromSubjectCode,
  isBareSubjectCode,
  isExamPaperCode,
  normalizeCourseSubjectCode,
  resolveExamMajor,
  resolvePublicExamName,
  stripRevisionLabel,
} from "@/utils/examDisplay";
import { mockCourseCatalog } from "../fixtures/mockCourses";
import {
  mockBareSubjectExam,
  mockFinalExamDto,
  mockLegacyTitleExam,
  mockPracticeExamDto,
  mockRevisionExamDto,
} from "../fixtures/mockExams";

describe("examDisplay", () => {
  describe("stripRevisionLabel", () => {
    it("removes Rev suffix variants", () => {
      expect(stripRevisionLabel("FE-PRF192-SU2026-1 Rev")).toBe("FE-PRF192-SU2026-1");
      expect(stripRevisionLabel("FE-PRF192-SU2026-1-Rev-2")).toBe("FE-PRF192-SU2026-1");
      expect(stripRevisionLabel("FE-PRF192-SU2026-1-REV-a1b2c3")).toBe("FE-PRF192-SU2026-1");
    });

    it("trims whitespace", () => {
      expect(stripRevisionLabel("  PRF192  ")).toBe("PRF192");
    });
  });

  describe("normalizeCourseSubjectCode", () => {
    it("extracts and normalizes standard course codes", () => {
      expect(normalizeCourseSubjectCode("prf192")).toBe("PRF192");
      expect(normalizeCourseSubjectCode("Course SWE201C extra")).toBe("SWE201c");
      expect(normalizeCourseSubjectCode("AIG301")).toBe("AIG301");
    });

    it("returns null when no valid pattern found", () => {
      expect(normalizeCourseSubjectCode("INVALID")).toBe(null);
      expect(normalizeCourseSubjectCode(null)).toBe(null);
    });
  });

  describe("extractCourseSubjectCode", () => {
    it("returns first valid code among candidates", () => {
      expect(extractCourseSubjectCode("invalid", "PRF192", "CSD203")).toBe("PRF192");
    });

    it("returns null when no candidate matches", () => {
      expect(extractCourseSubjectCode("foo", "bar")).toBe(null);
    });
  });

  describe("isBareSubjectCode", () => {
    it("detects bare subject codes", () => {
      expect(isBareSubjectCode("PRF192")).toBe(true);
      expect(isBareSubjectCode("SWE201c")).toBe(true);
      expect(isBareSubjectCode("FE-PRF192-SU2026-1")).toBe(false);
    });
  });

  describe("inferMajorFromSubjectCode", () => {
    it("infers AI for CSI, CSD, AIG prefixes", () => {
      expect(inferMajorFromSubjectCode("CSI101")).toBe("AI");
      expect(inferMajorFromSubjectCode("CSD203")).toBe("AI");
      expect(inferMajorFromSubjectCode("AIG301")).toBe("AI");
    });

    it("defaults to SE for other prefixes", () => {
      expect(inferMajorFromSubjectCode("PRF192")).toBe("SE");
      expect(inferMajorFromSubjectCode("SWE201c")).toBe("SE");
    });
  });

  describe("findCourseMajor", () => {
    it("finds major from catalog by semester and code", () => {
      expect(findCourseMajor("CSD203", 4, mockCourseCatalog)).toBe("AI");
      expect(findCourseMajor("PRF192", 3, mockCourseCatalog)).toBe("SE");
    });

    it("falls back to prefix inference when not in catalog", () => {
      expect(findCourseMajor("AIG999", 99, mockCourseCatalog)).toBe("AI");
    });

    it("searches all semesters when semester is not finite", () => {
      expect(findCourseMajor("SWE201c", "invalid", mockCourseCatalog)).toBe("SE");
    });

    it("returns null for empty subject code", () => {
      expect(findCourseMajor("", 3, mockCourseCatalog)).toBe(null);
    });
  });

  describe("resolveExamMajor", () => {
    it("uses explicit valid major when provided", () => {
      expect(resolveExamMajor({ major: "AI", subjectCode: "PRF192" })).toBe("AI");
    });

    it("resolves from catalog and inference", () => {
      expect(
        resolveExamMajor({
          subjectCode: "CSD203",
          semester: 4,
          courses: mockCourseCatalog,
        }),
      ).toBe("AI");
    });

    it("defaults to SE when subject is missing", () => {
      expect(resolveExamMajor({})).toBe("SE");
    });
  });

  describe("buildExamPaperCode", () => {
    it("builds FE code with term and sequence", () => {
      const code = buildExamPaperCode("PRF192", {
        examType: "final",
        term: "SU2026",
        sequence: 2,
      });
      expect(code).toBe("FE-PRF192-SU2026-2");
    });

    it("builds PE code for practice type", () => {
      const code = buildExamPaperCode("SWE201c", {
        examType: "practice",
        term: "FA2025",
        sequence: 1,
      });
      expect(code).toBe("PE-SWE201c-FA2025-1");
    });

    it("returns null for invalid subject", () => {
      expect(buildExamPaperCode("BAD")).toBe(null);
    });
  });

  describe("isExamPaperCode", () => {
    it("delegates to examPaperCode validator with legacy support", () => {
      expect(isExamPaperCode("FE-PRF192-SU2026-1")).toBe(true);
      expect(isExamPaperCode("Môn học")).toBe(false);
    });
  });

  describe("resolvePublicExamName", () => {
    it("formats valid paper code from dto fields", () => {
      expect(resolvePublicExamName(mockFinalExamDto)).toBe("PRF192_SU26");
    });

    it("builds display name from bare subject when no paper code", () => {
      expect(resolvePublicExamName(mockBareSubjectExam)).toMatch(/^AIG301_(SP|SU|FA)\d{2}$/);
    });

    it("skips Vietnamese subject titles and returns meaningful fallback", () => {
      const name = resolvePublicExamName(mockLegacyTitleExam);
      expect(name).not.toMatch(/^Môn\s/);
    });

    it('returns em dash when dto is empty', () => {
      expect(resolvePublicExamName({})).toBe("—");
    });
  });

  describe("buildExamDisplayFields", () => {
    it("builds display fields for standard final exam", () => {
      const fields = buildExamDisplayFields(mockFinalExamDto);
      expect(fields.subjectCode).toBe("PRF192");
      expect(fields.displayExamCode).toBe("PRF192_SU26");
      expect(fields.displayTitle).toBe(mockFinalExamDto.title);
    });

    it("appends Rev suffix for revision exams", () => {
      const fields = buildExamDisplayFields(mockRevisionExamDto);
      expect(fields.displayTitle).toContain("Rev");
      expect(fields.displayExamCode).toContain("Rev");
    });
  });

  describe("enrichRevisionExamEntries", () => {
    it("merges parent metadata into revision entries", () => {
      const entries = enrichRevisionExamEntries([
        mockFinalExamDto,
        { ...mockRevisionExamDto, revisionSourceCode: null, revisionSourceTitle: null },
      ]);

      const revision = entries.find((e) => e.id === mockRevisionExamDto.id);
      expect(revision?.revisionSourceCode).toBe("PRF192");
      expect(revision?.displayExamCode).toContain("Rev");
    });

    it("indexes entries by id, apiId, examApiId, and pendingId", () => {
      const parent = { ...mockFinalExamDto, apiId: "parent-api", pendingId: "pending-1" };
      const child = {
        id: "child-rev",
        revisionOfExamId: "pending-1",
        paperCode: "FE-PRF192-SU2026-1-REV-x",
        subjectCode: "PRF192",
      };
      const [, enrichedChild] = enrichRevisionExamEntries([parent, child]);
      expect(enrichedChild.revisionSourceCode).toBe("PRF192");
    });
  });

  describe("display getters", () => {
    it("getExamDisplayTitle prefers displayTitle then title", () => {
      expect(getExamDisplayTitle({ displayTitle: "A", title: "B" })).toBe("A");
      expect(getExamDisplayTitle({ title: "B" })).toBe("B");
      expect(getExamDisplayTitle(null)).toBe("");
    });

    it("getExamSubjectCode resolves from multiple fields", () => {
      expect(getExamSubjectCode(mockFinalExamDto)).toBe("PRF192");
      expect(getExamSubjectCode(mockBareSubjectExam)).toBe("AIG301");
      expect(getExamSubjectCode({ code: "invalid" })).toBe("—");
    });

    it("getExamDisplayCode uses displayExamCode or resolves public name", () => {
      expect(getExamDisplayCode({ displayExamCode: "PRF192_SU26" })).toBe("PRF192_SU26");
      expect(getExamDisplayCode(mockPracticeExamDto)).toBe("SWE201c_SU26");
    });

    it("getExamListPaperLabel uses display code for final exams", () => {
      expect(getExamListPaperLabel(mockFinalExamDto)).toBe("PRF192_SU26");
      expect(getExamListPaperLabel(mockPracticeExamDto)).toBe(mockPracticeExamDto.title);
    });
  });
});
