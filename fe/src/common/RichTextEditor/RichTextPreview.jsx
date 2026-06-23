import { richTextToDisplayHtml } from "./richTextPreviewHtml";
import styles from "./RichTextEditor.module.css";

function RichTextPreview({ value, emptyText = "Chưa có nội dung để xem trước.", className = "" }) {
  const html = richTextToDisplayHtml(value);

  if (!html) {
    return <p className={`${styles.previewEmpty} ${className}`.trim()}>{emptyText}</p>;
  }

  return (
    <div
      className={`${styles.previewContent} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default RichTextPreview;
