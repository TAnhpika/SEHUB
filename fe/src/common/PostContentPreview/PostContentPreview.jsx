import { linkifyText } from "@/utils/linkifyText";
import styles from "./PostContentPreview.module.css";

/**
 * Hiển thị nội dung bài viết / bình luận: giữ xuống dòng, tự nhận diện link.
 * @param {{ text?: string, className?: string, emptyLabel?: string }} props
 */
function PostContentPreview({ text, className = "", emptyLabel = "—" }) {
  const normalized = text?.trim();

  if (!normalized) {
    return <p className={`${styles.empty} ${className}`.trim()}>{emptyLabel}</p>;
  }

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      {linkifyText(normalized)}
    </div>
  );
}

export default PostContentPreview;
