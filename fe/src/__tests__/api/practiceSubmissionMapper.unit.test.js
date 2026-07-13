import { describe, expect, it } from "vitest";
import {
  buildReviewerComment,
  mapApiStatusToFe,
  mapFeReviewStatusToApi,
  mapModerationPracticeSubmission,
  mapPracticeSubmissionDto,
  mapPracticeSubmissionListItem,
  parseFeedbackFromComment,
  parseGradeFromComment,
} from "@/api/practiceSubmissionMapper";
import {
  mockPracticeSubmissionDto,
  mockReviewedSubmissionDto,
} from "../fixtures/mockApiDtos";

describe("practiceSubmissionMapper", () => {
  describe("status mapping", () => {
    it("maps API statuses to FE review states", () => {
      expect(mapApiStatusToFe("Submitted")).toBe("pending");
      expect(mapApiStatusToFe("Reviewed")).toBe("reviewed");
      expect(mapApiStatusToFe("Passed")).toBe("pass");
      expect(mapApiStatusToFe("Failed")).toBe("fail");
      expect(mapApiStatusToFe("Unknown")).toBe("unknown");
    });

    it("maps FE review states back to API enum", () => {
      expect(mapFeReviewStatusToApi("pass")).toBe("Passed");
      expect(mapFeReviewStatusToApi("fail")).toBe("Failed");
      expect(mapFeReviewStatusToApi("reviewed")).toBe("Reviewed");
      expect(mapFeReviewStatusToApi("pending")).toBe(null);
    });
  });

  describe("reviewer comment helpers", () => {
    it("builds combined grade and feedback comment", () => {
      expect(buildReviewerComment("8.5", "Tốt")).toBe("Điểm: 8.5\n\nTốt");
      expect(buildReviewerComment("", "Chỉ feedback")).toBe("Chỉ feedback");
      expect(buildReviewerComment("", "")).toBe(null);
    });

    it("parses grade and feedback from stored comment", () => {
      const comment = "Điểm: 9.0\n\nRepo đầy đủ test case.";
      expect(parseGradeFromComment(comment)).toBe("9.0");
      expect(parseFeedbackFromComment(comment)).toBe("Repo đầy đủ test case.");
    });

    it("returns null grade and empty feedback for missing comment", () => {
      expect(parseGradeFromComment(null)).toBe(null);
      expect(parseFeedbackFromComment(null)).toBe("");
    });
  });

  describe("mapPracticeSubmissionDto", () => {
    it("maps pending submission with context", () => {
      const item = mapPracticeSubmissionDto(mockPracticeSubmissionDto, {
        courseCode: "SWE201c",
        examId: "PE-SWE201c-SU2026-1",
        student: "demo_student",
        displayName: "Demo Premium",
      });
      expect(item.status).toBe("pending");
      expect(item.courseCode).toBe("SWE201C");
      expect(item.githubUrl).toContain("github.com");
    });
  });

  describe("mapPracticeSubmissionListItem", () => {
    it("maps reviewed submission with parsed grade", () => {
      const item = mapPracticeSubmissionListItem(mockReviewedSubmissionDto, {
        code: "PE-SWE201c-SU2026-1",
        major: "SE",
      });
      expect(item.status).toBe("pass");
      expect(item.grade).toBe("8.5");
      expect(item.feedback).toContain("Code sạch");
      expect(item.student).toBe("demo_student");
    });
  });

  describe("mapModerationPracticeSubmission", () => {
    it("delegates to list item mapper with exam code context", () => {
      const item = mapModerationPracticeSubmission(mockPracticeSubmissionDto);
      expect(item.examId).toBe("PE-SWE201c-SU2026-1");
      expect(item.courseCode).toBe("SWE201C");
      expect(item.status).toBe("pending");
    });
  });
});
