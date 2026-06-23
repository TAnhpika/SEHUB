import { richTextToDisplayHtml } from "./richTextPreviewHtml";
import styles from "./RichTextEditor.module.css";

function RichTextContent({ value, className = "", emptyFallback = null }) {
  if (!value?.trim()) {
    return emptyFallback;
  }

  const html = richTextToDisplayHtml(value);
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
