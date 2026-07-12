import { describe, expect, it } from "vitest";
import {
  isHtmlContent,
  richTextToDisplayHtml,
  richTextToPreviewHtml,
  stripRichTextMarkup,
} from "@/common/RichTextEditor/richTextPreviewHtml";

describe("richTextPreviewHtml", () => {
  describe("isHtmlContent", () => {
    it("detects HTML tags in source", () => {
      expect(isHtmlContent("<p>Hello</p>")).toBe(true);
      expect(isHtmlContent("**bold** only")).toBe(false);
    });
  });

  describe("stripRichTextMarkup", () => {
    it("strips markdown formatting to plain text", () => {
      expect(stripRichTextMarkup("**Bold** and *italic* text")).toBe("Bold and italic text");
      expect(stripRichTextMarkup("[link](https://sehub.vn)")).toBe("link");
    });

    it("strips HTML to text content in jsdom", () => {
      expect(stripRichTextMarkup("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
    });

    it("returns empty string for null input", () => {
      expect(stripRichTextMarkup(null)).toBe("");
    });
  });

  describe("richTextToPreviewHtml", () => {
    it("converts markdown bold to strong tags", () => {
      const html = richTextToPreviewHtml("**Important** note");
      expect(html).toContain("<strong>Important</strong>");
    });

    it("renders bullet lists from markdown lines", () => {
      const html = richTextToPreviewHtml("- Item A\n- Item B");
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>Item A</li>");
    });

    it("renders blockquotes", () => {
      const html = richTextToPreviewHtml("> Quote line");
      expect(html).toContain("<blockquote>");
    });

    it("renders markdown tables", () => {
      const table = "| A | B |\n| --- | --- |\n| 1 | 2 |";
      const html = richTextToPreviewHtml(table);
      expect(html).toContain("<table>");
      expect(html).toContain("<th>A</th>");
    });

    it("returns empty string for blank input", () => {
      expect(richTextToPreviewHtml("")).toBe("");
      expect(richTextToPreviewHtml("   ")).toBe("");
    });
  });

  describe("richTextToDisplayHtml", () => {
    it("passes through existing HTML unchanged", () => {
      const source = "<p>Already HTML</p>";
      expect(richTextToDisplayHtml(source)).toBe(source);
    });

    it("converts markdown to HTML for display", () => {
      const html = richTextToDisplayHtml("## Heading");
      expect(html).toContain("<h3>Heading</h3>");
    });
  });
});
