import { describe, expect, it } from "vitest";
import {
  getExamAssetFileName,
  getPrimaryExamAttachment,
  isPdfAttachment,
  resolveExamAssetUrl,
} from "@/utils/examAssetUrl";

describe("examAssetUrl", () => {
  describe("resolveExamAssetUrl", () => {
    it("returns absolute URLs unchanged", () => {
      expect(resolveExamAssetUrl("https://cdn.sehub.vn/exam.pdf")).toBe(
        "https://cdn.sehub.vn/exam.pdf",
      );
      expect(resolveExamAssetUrl("http://localhost/assets/x.pdf")).toBe(
        "http://localhost/assets/x.pdf",
      );
    });

    it("prefixes relative paths with API base URL", () => {
      expect(resolveExamAssetUrl("/uploads/exam.pdf")).toBe(
        "http://localhost:5006/uploads/exam.pdf",
      );
      expect(resolveExamAssetUrl("uploads/exam.pdf")).toBe(
        "http://localhost:5006/uploads/exam.pdf",
      );
    });

    it("returns null for empty input", () => {
      expect(resolveExamAssetUrl(null)).toBe(null);
      expect(resolveExamAssetUrl("")).toBe(null);
    });
  });

  describe("getExamAssetFileName", () => {
    it("extracts filename segment from URL path", () => {
      expect(getExamAssetFileName("/uploads/abc123_de-thi-prf192.pdf")).toBe(
        "abc123_de-thi-prf192.pdf",
      );
    });

    it("strips 32-char hash prefix from stored filenames", () => {
      expect(
        getExamAssetFileName("/files/a1b2c3d4e5f6789012345678abcdef90_exam.pdf"),
      ).toBe("exam.pdf");
    });

    it("returns fallback when URL is empty", () => {
      expect(getExamAssetFileName(null)).toBe("exam-attachment");
      expect(getExamAssetFileName("", "custom.pdf")).toBe("custom.pdf");
    });
  });

  describe("isPdfAttachment", () => {
    it("detects PDF by content type", () => {
      expect(isPdfAttachment({ contentType: "application/pdf" })).toBe(true);
    });

    it("detects PDF by file extension in name fields", () => {
      expect(isPdfAttachment({ name: "de-thi.PDF" })).toBe(true);
      expect(isPdfAttachment({ originalFileName: "paper.pdf" })).toBe(true);
    });

    it("returns false for non-PDF or missing attachment", () => {
      expect(isPdfAttachment(null)).toBe(false);
      expect(isPdfAttachment({ contentType: "image/png", name: "photo.png" })).toBe(false);
    });
  });

  describe("getPrimaryExamAttachment", () => {
    it("prefers first attachment with viewUrl or viewPath", () => {
      const exam = {
        attachments: [
          {
            id: "att-1",
            name: "de-thi.pdf",
            viewPath: "/api/v1/exams/1/attachments/att-1/view",
            contentType: "application/pdf",
          },
        ],
      };

      const primary = getPrimaryExamAttachment(exam);
      expect(primary?.id).toBe("att-1");
      expect(primary?.url).toContain("localhost:5006");
    });

    it("falls back to legacy assetUrl on exam object", () => {
      const primary = getPrimaryExamAttachment({
        assetUrl: "/uploads/legacy-exam.pdf",
        fileName: "legacy-exam.pdf",
      });
      expect(primary?.name).toBe("legacy-exam.pdf");
      expect(primary?.url).toContain("legacy-exam.pdf");
    });

    it("returns null when exam has no attachments or assetUrl", () => {
      expect(getPrimaryExamAttachment(null)).toBe(null);
      expect(getPrimaryExamAttachment({ attachments: [] })).toBe(null);
    });
  });
});
