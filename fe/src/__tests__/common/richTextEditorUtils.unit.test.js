import { describe, expect, it, vi } from "vitest";
import {
  applyRichTextAction,
  getTextareaSelection,
  insertText,
  prefixLines,
  wrapSelection,
} from "@/common/RichTextEditor/richTextEditorUtils";

function createTextarea(value = "Hello world", selectionStart = 0, selectionEnd = 0) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.selectionStart = selectionStart;
  textarea.selectionEnd = selectionEnd;
  document.body.appendChild(textarea);
  return textarea;
}

describe("richTextEditorUtils", () => {
  describe("getTextareaSelection", () => {
    it("returns selection range and selected text", () => {
      const textarea = createTextarea("Hello world", 0, 5);
      const sel = getTextareaSelection(textarea);
      expect(sel.selected).toBe("Hello");
      expect(sel.start).toBe(0);
      expect(sel.end).toBe(5);
      textarea.remove();
    });
  });

  describe("wrapSelection", () => {
    it("wraps selected text with markdown bold markers", () => {
      const textarea = createTextarea("Hello world", 0, 5);
      const onChange = vi.fn();
      wrapSelection(textarea, "**", "**", onChange);
      expect(onChange).toHaveBeenCalledWith("**Hello** world");
      textarea.remove();
    });

    it("uses fallback text when selection is empty", () => {
      const textarea = createTextarea("Hello", 2, 2);
      const onChange = vi.fn();
      wrapSelection(textarea, "*", "*", onChange, "italic");
      expect(onChange).toHaveBeenCalledWith("He*italic*llo");
      textarea.remove();
    });
  });

  describe("insertText", () => {
    it("inserts text at cursor position", () => {
      const textarea = createTextarea("AB", 1, 1);
      const onChange = vi.fn();
      insertText(textarea, "XYZ", onChange);
      expect(onChange).toHaveBeenCalledWith("AXYZB");
      textarea.remove();
    });
  });

  describe("prefixLines", () => {
    it("prefixes each non-empty line with bullet marker", () => {
      const textarea = createTextarea("Line 1\nLine 2", 0, 12);
      const onChange = vi.fn();
      prefixLines(textarea, "- ", onChange);
      expect(onChange).toHaveBeenCalledWith("- Line 1\n- Line 2");
      textarea.remove();
    });
  });

  describe("applyRichTextAction", () => {
    it("applies bold action via wrapSelection", () => {
      const textarea = createTextarea("text", 0, 4);
      const onChange = vi.fn();
      applyRichTextAction("bold", textarea, onChange);
      expect(onChange).toHaveBeenCalledWith("**text**");
      textarea.remove();
    });

    it("inserts table template for table action", () => {
      const textarea = createTextarea("", 0, 0);
      const onChange = vi.fn();
      applyRichTextAction("table", textarea, onChange);
      expect(onChange.mock.calls[0][0]).toContain("| Cột 1 |");
      textarea.remove();
    });

    it("does nothing when textarea is null", () => {
      expect(applyRichTextAction("bold", null, vi.fn())).toBeUndefined();
    });
  });
});
