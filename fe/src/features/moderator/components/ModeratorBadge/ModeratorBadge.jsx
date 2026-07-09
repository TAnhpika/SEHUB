/**
 * @fileoverview Badge nhãn dùng chung trong khu vực Moderator SEHUB.
 *
 * Component hiển thị nhãn trạng thái, loại nội dung hoặc phân loại với màu sắc
 * (tone) và kích thước thống nhất trên các trang kiểm duyệt.
 *
 * @module features/moderator/components/ModeratorBadge
 */

import styles from "./ModeratorBadge.module.css";

/**
 * @typedef {Object} ModeratorBadgeProps
 * @property {string} label - Nội dung văn bản hiển thị trên badge.
 * @property {'primary' | 'muted' | 'danger' | 'warning' | 'success' | 'bronze' | 'silver' | 'gold'} [tone='muted'] - Bảng màu CSS module (`tone-*`); mặc định `muted`.
 * @property {'sm' | 'md'} [size='sm'] - Kích thước badge (`size-sm` hoặc `size-md`).
 * @property {boolean} [dot=false] - Hiển thị chấm tròn nhỏ phía trước nhãn (thường dùng cho trạng thái).
 */

/**
 * Badge nhãn có thể tùy chỉnh tone, kích thước và chấm trạng thái.
 *
 * Dùng xuyên suốt các trang Moderator để thể hiện trạng thái tài khoản, loại bài viết,
 * hạng thành viên, v.v. với giao diện đồng nhất.
 *
 * @param {ModeratorBadgeProps} props - Props của component.
 * @returns {import('react').ReactElement} Thẻ `<span>` badge với class tone và size tương ứng.
 *
 * @example
 * <ModeratorBadge label="Chờ duyệt" tone="warning" dot />
 *
 * @example
 * <ModeratorBadge label="Đã đăng" tone="success" size="md" />
 */
function ModeratorBadge({ label, tone = "muted", size = "sm", dot = false }) {
  return (
    <span
      className={`${styles.badge} ${styles[`tone-${tone}`]} ${styles[`size-${size}`]}`}
    >
      {dot ? <span className={styles.dot} aria-hidden /> : null}
      {label}
    </span>
  );
}

export default ModeratorBadge;
