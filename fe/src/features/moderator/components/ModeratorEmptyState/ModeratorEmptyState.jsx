/**
 * @fileoverview Trạng thái rỗng (empty state) dùng chung trong khu vực Moderator SEHUB.
 *
 * Hiển thị thông báo khi danh sách, bảng hoặc panel không có dữ liệu,
 * kèm slot tùy chọn cho nút hành động hoặc nội dung bổ sung.
 *
 * @module features/moderator/components/ModeratorEmptyState
 */

import styles from "./ModeratorEmptyState.module.css";

/**
 * @typedef {Object} ModeratorEmptyStateProps
 * @property {string} message - Thông báo chính hiển thị cho người dùng (ví dụ: "Không có báo cáo nào").
 * @property {import('react').ReactNode} [children] - Nội dung phụ tùy chọn (nút, link, hướng dẫn) render bên dưới message.
 */

/**
 * Khối empty state căn giữa với message và nội dung con tùy chọn.
 *
 * @param {ModeratorEmptyStateProps} props - Props của component.
 * @returns {import('react').ReactElement} Container empty state với đoạn văn message.
 *
 * @example
 * <ModeratorEmptyState message="Chưa có bài nộp nào">
 *   <button type="button">Làm mới</button>
 * </ModeratorEmptyState>
 */
function ModeratorEmptyState({ message, children }) {
  return (
    <div className={styles.empty}>
      <p className={styles.message}>{message}</p>
      {children}
    </div>
  );
}

export default ModeratorEmptyState;
