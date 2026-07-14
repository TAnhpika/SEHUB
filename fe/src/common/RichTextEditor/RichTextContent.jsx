import DOMPurify from "dompurify";
import { resolveAssetUrl } from "@/api/assetUrl";
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
  ALLOWED_ATTR: [
    "href",
    "src",
    "alt",
    "title",
    "target",
    "rel",
    "style",
    "width",
    "height",
    "loading",
    "decoding",
  ],
  ALLOW_DATA_ATTR: false,
};

/**
 * Prefix relative image/asset paths with the API base URL so `<img>` loads
 * correctly from the Vite origin (e.g. localhost:5173).
 *
 * @param {string} html
 * @returns {string}
 */
function rewriteAssetUrlsInHtml(html) {
  return html.replace(
    /(<img\b[^>]*?\bsrc\s*=\s*["'])([^"']+)(["'])/gi,
    (match, prefix, src, suffix) => {
      const resolved = resolveAssetUrl(src);
      return resolved ? `${prefix}${resolved}${suffix}` : match;
    },
  );
}

function RichTextContent({ value, className = "", emptyFallback = null }) {
  if (!value?.trim()) {
    return emptyFallback;
  }

  const rawHtml = richTextToDisplayHtml(value);
  if (!rawHtml) {
    return emptyFallback;
  }

  const html = DOMPurify.sanitize(rewriteAssetUrlsInHtml(rawHtml), PURIFY_CONFIG);
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
