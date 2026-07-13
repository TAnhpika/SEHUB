import { describe, expect, it } from "vitest";
import {
  mapDocumentDetailDto,
  mapDocumentListItemDto,
  mapDocumentToSubjectListItem,
} from "@/api/documentMapper";
import {
  mockDocumentDetailDto,
  mockDocumentListDto,
  mockFreeDocumentDto,
} from "../fixtures/mockExtendedDtos";

describe("documentMapper", () => {
  describe("mapDocumentListItemDto", () => {
    it("maps premium PDF document with subject extracted from category", () => {
      const doc = mapDocumentListItemDto(mockDocumentListDto, "CSD203");
      expect(doc.id).toBe("doc-001");
      expect(doc.subject).toBe("CSD203");
      expect(doc.name).toBe("Slide_CSD203_Chapter1.pdf");
      expect(doc.access).toBe("Premium");
      expect(doc.pages).toBe(45);
      expect(doc.uploadedAt).toBe("—");
    });

    it("maps free preview tier label", () => {
      const doc = mapDocumentListItemDto(mockFreeDocumentDto);
      expect(doc.access).toBe("Free (3 trang)");
      expect(doc.name).toBe("PRF192_Intro.pdf");
    });

    it("uses courseCode fallback when category has no extractable code", () => {
      const doc = mapDocumentListItemDto(
        { ...mockFreeDocumentDto, category: "" },
        "prf192",
      );
      expect(doc.subject).toBe("PRF192");
    });
  });

  describe("mapDocumentDetailDto", () => {
    it("includes download flags and formatted upload time", () => {
      const doc = mapDocumentDetailDto(mockDocumentDetailDto);
      expect(doc.canDownload).toBe(true);
      expect(doc.pageLimit).toBe(3);
      expect(doc.mimeType).toBe("application/pdf");
      expect(doc.uploadedAt).toMatch(/^\d{4}-\d{2}-\d{2}, \d{2}:\d{2}:\d{2}$/);
    });

    it('returns em dash uploadedAt for invalid date', () => {
      const doc = mapDocumentDetailDto({ ...mockDocumentDetailDto, createdAt: "bad" });
      expect(doc.uploadedAt).toBe("—");
    });
  });

  describe("mapDocumentToSubjectListItem", () => {
    it("wraps document for subject catalog list UI", () => {
      const item = mapDocumentToSubjectListItem(mockDocumentListDto, "CSD203");
      expect(item.courseCode).toBe("CSD203");
      expect(item.type).toBe("PDF");
      expect(item.questionCount).toBe(45);
      expect(item.document?.id).toBe("doc-001");
    });
  });
});
