import DOMPurify from "dompurify";
import { richTextToDisplayHtml } from "./richTextPreviewHtml";
import styles from "./RichTextEditor.module.css";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "mark",
    "ul",
    "ol",
    "li",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "img",
    "code",
    "pre",
    "span",
    "div",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "hr",
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
  ALLOW_DATA_ATTR: false,
};

function RichTextContent({ value, className = "", emptyFallback = null }) {
  if (!value?.trim()) {
    return emptyFallback;
  }

  const rawHtml = richTextToDisplayHtml(value);
  if (!rawHtml) {
    return emptyFallback;
  }

  const html = DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);
  if (!html) {
    return emptyFallback;
  }

  return (
    <div
      className={`${styles.richTextContent} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default RichTextContent;
