import { describe, expect, it } from "vitest";
import {
  appendQuestionImageToContent,
  extractQuestionImageUrl,
  mergeQuestionImage,
  stripQuestionImageMarkup,
} from "@/utils/examQuestionContent";

const HTML_IMAGE = '<p><img src="https://cdn.sehub.vn/q1.png" alt="diagram" /></p>';
const MARKDOWN_IMAGE = "![diagram](https://cdn.sehub.vn/q2.png)";
const TEXT_ONLY = "<p>Explain polymorphism in Java.</p>";

describe("examQuestionContent", () => {
  describe("extractQuestionImageUrl", () => {
    it("extracts src from HTML img tags", () => {
      expect(extractQuestionImageUrl(HTML_IMAGE)).toBe("https://cdn.sehub.vn/q1.png");
    });

    it("extracts URL from markdown image syntax", () => {
      expect(extractQuestionImageUrl(MARKDOWN_IMAGE)).toBe("https://cdn.sehub.vn/q2.png");
    });

    it("returns null when no image markup exists", () => {
      expect(extractQuestionImageUrl(TEXT_ONLY)).toBe(null);
      expect(extractQuestionImageUrl("")).toBe(null);
    });
  });

  describe("stripQuestionImageMarkup", () => {
    it("removes HTML and markdown images and empty paragraphs", () => {
      expect(stripQuestionImageMarkup(`${TEXT_ONLY}\n${HTML_IMAGE}`)).toBe(TEXT_ONLY);
      expect(stripQuestionImageMarkup(MARKDOWN_IMAGE)).toBe("");
    });
  });

  describe("appendQuestionImageToContent", () => {
    it("appends standardized image HTML when URL is provided", () => {
      const result = appendQuestionImageToContent(TEXT_ONLY, "https://cdn.sehub.vn/new.png");
      expect(result).toContain(TEXT_ONLY);
      expect(result).toContain('src="https://cdn.sehub.vn/new.png"');
      expect(result).toContain('alt="Minh họa câu hỏi"');
    });

    it("replaces existing image with new URL", () => {
      const result = appendQuestionImageToContent(HTML_IMAGE, "https://cdn.sehub.vn/replaced.png");
      expect(result).not.toContain("q1.png");
      expect(result).toContain("replaced.png");
    });

    it("returns trimmed text when image URL is empty", () => {
      expect(appendQuestionImageToContent(TEXT_ONLY, "")).toBe(TEXT_ONLY);
    });
  });

  describe("mergeQuestionImage", () => {
    it("merges explicit imageUrl into question content", () => {
      const merged = mergeQuestionImage(
        { id: "q-1", content: TEXT_ONLY },
        "https://cdn.sehub.vn/merged.png",
      );
      expect(merged.imageUrl).toBe("https://cdn.sehub.vn/merged.png");
      expect(merged.content).toContain("merged.png");
    });

    it("extracts imageUrl from existing content when not provided", () => {
      const merged = mergeQuestionImage({ content: HTML_IMAGE });
      expect(merged.imageUrl).toBe("https://cdn.sehub.vn/q1.png");
    });

    it("supports PascalCase Content field from API DTOs", () => {
      const merged = mergeQuestionImage({ Content: MARKDOWN_IMAGE });
      expect(merged.imageUrl).toBe("https://cdn.sehub.vn/q2.png");
    });

    it("sets imageUrl null when no image in content", () => {
      const merged = mergeQuestionImage({ text: TEXT_ONLY });
      expect(merged.imageUrl).toBe(null);
    });
  });
});
