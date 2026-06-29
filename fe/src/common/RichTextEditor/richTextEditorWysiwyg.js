import { richTextToPreviewHtml, isHtmlContent } from "./richTextPreviewHtml";

export function valueToEditorHtml(source) {
  if (!source?.trim()) {
    return "";
  }

  if (isHtmlContent(source)) {
    return source;
  }

  return richTextToPreviewHtml(source);
}

export function getPlainTextLength(html) {
  if (!html) {
    return 0;
  }

  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, "").length;
  }

  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent?.length ?? 0;
}

export function normalizeEditorHtml(html) {
  const trimmed = html?.trim() ?? "";
  if (!trimmed || trimmed === "<br>" || trimmed === "<div><br></div>") {
    return "";
  }

  return html;
}

function insertHtmlAtSelection(html) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  selection.deleteFromDocument();
  const range = selection.getRangeAt(0);
  const template = document.createElement("template");
  template.innerHTML = html;
  const node = template.content.firstChild;
  if (!node) {
    return;
  }

  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function insertImageAtSelection(url, alt = "", editor = null) {
  editor?.focus();
  const safeUrl = url.replace(/"/g, "&quot;");
  const safeAlt = (alt || "").replace(/"/g, "&quot;");
  insertHtmlAtSelection(
    `<img src="${safeUrl}" alt="${safeAlt}" style="max-width:100%;height:auto;display:block;margin:0.5rem 0;" />`,
  );
}

function wrapSelectionWithTag(tagName) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    return;
  }

  const wrapper = document.createElement(tagName);
  wrapper.appendChild(range.extractContents());
  range.insertNode(wrapper);
  range.selectNodeContents(wrapper);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function applyWysiwygAction(action, editor, onSync) {
  if (!editor) {
    return;
  }

  editor.focus();

  switch (action) {
    case "paragraph":
      document.execCommand("formatBlock", false, "p");
      break;
    case "bold":
      document.execCommand("bold");
      break;
    case "italic":
      document.execCommand("italic");
      break;
    case "underline":
      document.execCommand("underline");
      break;
    case "strikethrough":
      document.execCommand("strikeThrough");
      break;
    case "highlight":
      document.execCommand("hiliteColor", false, "#fef08a");
      break;
    case "bulletList":
      document.execCommand("insertUnorderedList");
      break;
    case "orderedList":
      document.execCommand("insertOrderedList");
      break;
    case "quote":
      document.execCommand("formatBlock", false, "blockquote");
      break;
    case "horizontalRule":
      document.execCommand("insertHorizontalRule");
      break;
    case "alignLeft":
      document.execCommand("justifyLeft");
      break;
    case "unlink":
      document.execCommand("unlink");
      break;
    case "code":
      wrapSelectionWithTag("code");
      break;
    case "color": {
      const color = window.prompt("Màu chữ (hex hoặc tên, vd: #2563eb hoặc red):", "#2563eb");
      if (color?.trim()) {
        document.execCommand("foreColor", false, color.trim());
      }
      break;
    }
    case "link": {
      const url = window.prompt("Nhập URL liên kết:", "https://");
      if (url?.trim()) {
        document.execCommand("createLink", false, url.trim());
      }
      break;
    }
    case "image": {
      const url = window.prompt("URL hình ảnh:", "https://");
      if (url?.trim()) {
        document.execCommand("insertImage", false, url.trim());
      }
      break;
    }
    case "attach": {
      const url = window.prompt("URL file đính kèm:", "https://");
      if (!url?.trim()) {
        break;
      }
      const name = window.prompt("Tên hiển thị file:", "file") || "file";
      insertHtmlAtSelection(
        `<a href="${url.trim()}" target="_blank" rel="noreferrer">📎 ${name}</a>`,
      );
      break;
    }
    case "table":
      insertHtmlAtSelection(
        '<table><thead><tr><th>Cột 1</th><th>Cột 2</th><th>Cột 3</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br></p>',
      );
      break;
    case "formula": {
      const latex = window.prompt("Nhập công thức LaTeX (ví dụ: x^2):", "");
      if (latex?.trim()) {
        insertHtmlAtSelection(`$${latex.trim()}$`);
      }
      break;
    }
    default:
      break;
  }

  onSync?.();
}
