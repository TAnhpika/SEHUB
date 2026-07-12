import { describe, expect, it } from "vitest";
import {
  getPlainTextLength,
  normalizeEditorHtml,
  valueToEditorHtml,
} from "@/common/RichTextEditor/richTextEditorWysiwyg";

describe("richTextEditorWysiwyg", () => {
  describe("valueToEditorHtml", () => {
    it("returns empty string for blank source", () => {
      expect(valueToEditorHtml("")).toBe("");
      expect(valueToEditorHtml("   ")).toBe("");
    });

    it("passes through HTML content unchanged", () => {
      expect(valueToEditorHtml("<p>HTML</p>")).toBe("<p>HTML</p>");
    });

    it("converts markdown to preview HTML", () => {
      const html = valueToEditorHtml("**Bold** text");
      expect(html).toContain("<strong>Bold</strong>");
    });
  });

  describe("getPlainTextLength", () => {
    it("counts plain text length stripping HTML tags", () => {
      expect(getPlainTextLength("<p>Hello <strong>world</strong></p>")).toBe(11);
    });

    it("returns 0 for empty html", () => {
      expect(getPlainTextLength("")).toBe(0);
      expect(getPlainTextLength(null)).toBe(0);
    });
  });

  describe("normalizeEditorHtml", () => {
    it("returns empty string for empty or br-only content", () => {
      expect(normalizeEditorHtml("")).toBe("");
      expect(normalizeEditorHtml("<br>")).toBe("");
      expect(normalizeEditorHtml("<div><br></div>")).toBe("");
    });

    it("preserves meaningful HTML", () => {
      const html = "<p>Content</p>";
      expect(normalizeEditorHtml(html)).toBe(html);
    });
  });
});
