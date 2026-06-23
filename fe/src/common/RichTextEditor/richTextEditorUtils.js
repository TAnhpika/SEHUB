export function getTextareaSelection(textarea) {
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const value = textarea.value ?? "";

  return {
    start,
    end,
    selected: value.slice(start, end),
    value,
  };
}

export function replaceTextareaRange(textarea, start, end, replacement, onChange) {
  const value = textarea.value ?? "";
  const next = value.slice(0, start) + replacement + value.slice(end);

  onChange(next);

  const cursor = start + replacement.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
  });

  return next;
}

export function wrapSelection(textarea, before, after, onChange, fallback = "văn bản") {
  const { start, end, selected } = getTextareaSelection(textarea);
  const inner = selected || fallback;
  const wrapped = `${before}${inner}${after}`;

  return replaceTextareaRange(textarea, start, end, wrapped, onChange);
}

export function insertText(textarea, text, onChange) {
  const { start, end } = getTextareaSelection(textarea);
  return replaceTextareaRange(textarea, start, end, text, onChange);
}

export function prefixLines(textarea, prefix, onChange) {
  const { start, end, value } = getTextareaSelection(textarea);
  const selected = value.slice(start, end);
  const lines = selected.split("\n");
  const prefixed = lines
    .map((line) => {
      if (!line.trim()) {
        return line;
      }
      const cleaned = line.replace(/^(-|\d+\.|>)\s+/, "");
      return `${prefix}${cleaned}`;
    })
    .join("\n");

  return replaceTextareaRange(textarea, start, end, prefixed, onChange);
}

export function applyRichTextAction(action, textarea, onChange) {
  if (!textarea) {
    return;
  }

  switch (action) {
    case "paragraph":
      if (getTextareaSelection(textarea).selected) {
        return wrapSelection(textarea, "## ", "", onChange);
      }
      return insertText(textarea, "\n\n", onChange);

    case "bold":
      return wrapSelection(textarea, "**", "**", onChange);

    case "italic":
      return wrapSelection(textarea, "*", "*", onChange);

    case "underline":
      return wrapSelection(textarea, "<u>", "</u>", onChange);

    case "strikethrough":
      return wrapSelection(textarea, "~~", "~~", onChange);

    case "highlight":
      return wrapSelection(textarea, "<mark>", "</mark>", onChange);

    case "color": {
      const color = window.prompt("Màu chữ (hex hoặc tên, vd: #2563eb hoặc red):", "#2563eb");
      if (!color?.trim()) {
        return;
      }
      return wrapSelection(
        textarea,
        `<span style="color: ${color.trim()}">`,
        "</span>",
        onChange,
      );
    }

    case "code": {
      const { selected } = getTextareaSelection(textarea);
      if (selected.includes("\n")) {
        return wrapSelection(textarea, "```\n", "\n```", onChange, "");
      }
      return wrapSelection(textarea, "`", "`", onChange, "mã");
    }

    case "link": {
      const url = window.prompt("Nhập URL liên kết:", "https://");
      if (!url?.trim()) {
        return;
      }
      const { start, end, selected } = getTextareaSelection(textarea);
      const label = selected || "liên kết";
      return replaceTextareaRange(
        textarea,
        start,
        end,
        `[${label}](${url.trim()})`,
        onChange,
      );
    }

    case "unlink": {
      const { start, end, selected } = getTextareaSelection(textarea);
      const stripped = selected.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      return replaceTextareaRange(textarea, start, end, stripped, onChange);
    }

    case "image": {
      const url = window.prompt("URL hình ảnh:", "https://");
      if (!url?.trim()) {
        return;
      }
      const alt = window.prompt("Mô tả ảnh (alt):", "hình ảnh") || "hình ảnh";
      return insertText(textarea, `![${alt}](${url.trim()})`, onChange);
    }

    case "attach": {
      const url = window.prompt("URL file đính kèm:", "https://");
      if (!url?.trim()) {
        return;
      }
      const name = window.prompt("Tên hiển thị file:", "file") || "file";
      return insertText(textarea, `[📎 ${name}](${url.trim()})`, onChange);
    }

    case "table":
      return insertText(
        textarea,
        "\n| Cột 1 | Cột 2 | Cột 3 |\n| --- | --- | --- |\n| | | |\n",
        onChange,
      );

    case "bulletList":
      return prefixLines(textarea, "- ", onChange);

    case "orderedList": {
      const { start, end, value } = getTextareaSelection(textarea);
      const selected = value.slice(start, end);
      const lines = selected.split("\n");
      const numbered = lines
        .map((line, index) => {
          if (!line.trim()) {
            return line;
          }
          const cleaned = line.replace(/^(-|\d+\.|>)\s+/, "");
          return `${index + 1}. ${cleaned}`;
        })
        .join("\n");
      return replaceTextareaRange(textarea, start, end, numbered, onChange);
    }

    case "quote":
      return prefixLines(textarea, "> ", onChange);

    case "horizontalRule":
      return insertText(textarea, "\n---\n", onChange);

    case "alignLeft":
      return wrapSelection(textarea, '<div style="text-align: left">\n', "\n</div>", onChange);

    case "alignCenter":
      return wrapSelection(textarea, '<div style="text-align: center">\n', "\n</div>", onChange);

    case "alignRight":
      return wrapSelection(textarea, '<div style="text-align: right">\n', "\n</div>", onChange);

    case "formula":
      return wrapSelection(textarea, "$", "$", onChange, "x^2");

    default:
      return undefined;
  }
}
