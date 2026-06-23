const HTML_SLOT = "\uE000";
const HTML_TAG_PATTERN =
  /<(p|br|strong|b|em|i|u|mark|del|s|strike|ul|ol|li|blockquote|h[1-6]|div|span|a|img|table|pre|code)\b/i;

export function isHtmlContent(source) {
  return Boolean(source && HTML_TAG_PATTERN.test(source));
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function protectHtml(text) {
  const blocks = [];
  const protectedText = text.replace(
    /<(u|mark|span|div)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (match) => {
      blocks.push(match);
      return `${HTML_SLOT}${blocks.length - 1}${HTML_SLOT}`;
    },
  );

  return { protectedText, blocks };
}

function restoreHtml(text, blocks) {
  return blocks.reduce(
    (html, block, index) => html.replace(`${HTML_SLOT}${index}${HTML_SLOT}`, block),
    text,
  );
}

function formatInline(text) {
  const { protectedText, blocks } = protectHtml(text);
  let html = escapeHtml(protectedText);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  return restoreHtml(html, blocks);
}

export function stripRichTextMarkup(source) {
  if (!source) {
    return "";
  }

  if (isHtmlContent(source)) {
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = source;
      return (div.textContent ?? "").replace(/\s+/g, " ").trim();
    }

    return source
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return source
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<\/?(?:u|mark|strong|em|del|code|span|div|p|br)\b[^>]*>/gi, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^(-|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function restoreAllowedHtml(text) {
  return text
    .replace(/&lt;(\/?(?:mark|u|strong|em|del|code|span|div|a|img)\b[^&]*?)&gt;/gi, "<$1>")
    .replace(/&lt;img src=&quot;([^&]+)&quot; alt=&quot;([^&]*)&quot; \/?&gt;/gi, '<img src="$1" alt="$2" />');
}

export function richTextToPreviewHtml(source) {
  if (!source?.trim()) {
    return "";
  }

  const blocks = source.split(/\n{2,}/);
  const htmlBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) {
      return "";
    }

    if (/^```[\s\S]*```$/m.test(trimmed)) {
      const code = trimmed.replace(/^```\n?/, "").replace(/\n?```$/, "");
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }

    if (/^---+$/.test(trimmed)) {
      return "<hr />";
    }

    const lines = trimmed.split("\n");
    if (lines.every((line) => /^>\s?/.test(line))) {
      const quote = lines.map((line) => line.replace(/^>\s?/, "")).join("\n");
      return `<blockquote>${formatInline(quote)}</blockquote>`;
    }

    if (lines.every((line) => /^-\s+/.test(line))) {
      return `<ul>${lines
        .map((line) => `<li>${formatInline(line.replace(/^-\s+/, ""))}</li>`)
        .join("")}</ul>`;
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      return `<ol>${lines
        .map((line) => `<li>${formatInline(line.replace(/^\d+\.\s+/, ""))}</li>`)
        .join("")}</ol>`;
    }

    if (lines[0]?.includes("|") && lines[1]?.includes("---")) {
      const [header, , ...rows] = lines;
      const headerCells = header
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      const bodyRows = rows
        .map((row) =>
          row
            .split("|")
            .map((cell) => cell.trim())
            .filter(Boolean),
        )
        .filter((row) => row.length > 0);

      return `<table><thead><tr>${headerCells
        .map((cell) => `<th>${formatInline(cell)}</th>`)
        .join("")}</tr></thead><tbody>${bodyRows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${formatInline(cell)}</td>`).join("")}</tr>`,
        )
        .join("")}</tbody></table>`;
    }

    if (/^##\s+/.test(trimmed)) {
      return `<h3>${formatInline(trimmed.replace(/^##\s+/, ""))}</h3>`;
    }

    const withBreaks = lines.map((line) => formatInline(line)).join("<br />");
    return `<p>${withBreaks}</p>`;
  });

  return restoreAllowedHtml(htmlBlocks.filter(Boolean).join(""));
}

export function richTextToDisplayHtml(source) {
  if (!source?.trim()) {
    return "";
  }

  if (isHtmlContent(source)) {
    return source;
  }

  return richTextToPreviewHtml(source);
}
