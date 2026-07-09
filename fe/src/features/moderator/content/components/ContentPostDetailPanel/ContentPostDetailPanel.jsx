/**
 * @fileoverview Panel chi tiết bài viết dùng chung cho kiểm duyệt, lịch sử và bài nổi bật.
 *
 * Hiển thị đầy đủ: tiêu đề, nội dung rich text, ảnh bìa/inline, file đính kèm, metadata tác giả,
 * bản ghi quyết định kiểm duyệt, và footer hành động (duyệt/từ chối/ghim) tùy `mode`.
 *
 * @module features/moderator/content/components/ContentPostDetailPanel
 */

import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faComment,
  faCommentSlash,
  faDownload,
  faFile,
  faFileArchive,
  faFilePdf,
  faHeart,
  faImage,
  faMousePointer,
  faRotateRight,
  faThumbtack,
  faUserSecret,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import ModeratorBadge from "@/features/moderator/components/ModeratorBadge/ModeratorBadge";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import { STATUS_META, TYPE_META } from "@/features/moderator/content/contentModerationData";
import styles from "./ContentPostDetailPanel.module.css";

/**
 * @typedef {Object} AttachmentIconProps
 * @property {string} type - Loại file: `pdf` | `zip` | khác.
 */

/**
 * Chọn icon FontAwesome phù hợp theo loại file đính kèm.
 *
 * @param {AttachmentIconProps} props - Props component.
 * @returns {import('@fortawesome/fontawesome-svg-core').IconDefinition} Icon definition.
 */
function AttachmentIcon({ type }) {
  if (type === "pdf") return faFilePdf;
  if (type === "zip") return faFileArchive;
  return faFile;
}

/**
 * @typedef {Object} DetailStatusBadgeProps
 * @property {string} status - Trạng thái kiểm duyệt bài viết.
 */

/**
 * Badge trạng thái trong header panel chi tiết.
 *
 * @param {DetailStatusBadgeProps} props - Props component.
 * @returns {import('react').ReactElement}
 */
function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return <ModeratorBadge label={meta.label} tone={meta.tone} dot />;
}

/**
 * @typedef {Object} ModerationRecordProps
 * @property {Object} item - Bài viết có thể chứa `moderation`, `resubmission`, `status`.
 */

/**
 * Hiển thị khối ghi nhận quyết định kiểm duyệt hoặc banner "Gửi duyệt lại".
 *
 * - `pending` + `resubmission`: banner vàng gửi lại sau reject.
 * - `approved` / `rejected`: box xanh/đỏ với tên mod, thời gian, ghi chú/lý do.
 *
 * @param {ModerationRecordProps} props - Props component.
 * @returns {import('react').ReactElement|null} Khối moderation hoặc `null` nếu pending thường.
 */
function ModerationRecord({ item }) {
  if (item.status === "pending") {
    if (item.resubmission) {
      return (
        <div className={`${styles.moderationBox} ${styles.moderationResubmit}`}>
          <p className={styles.moderationTitle}>
            <FontAwesomeIcon icon={faRotateRight} />
            Gửi duyệt lại
          </p>
          <p className={styles.moderationText}>
            Sinh viên đã chỉnh sửa và gửi lại sau khi bị từ chối (nghiệp vụ Rejected → Pending).
          </p>
        </div>
      );
    }
    return null;
  }

  if (!item.moderation) return null;

  const isApproved = item.status === "approved";
  const boxClass = isApproved ? styles.moderationApproved : styles.moderationRejected;

  return (
    <div className={`${styles.moderationBox} ${boxClass}`}>
      <p className={styles.moderationTitle}>
        <FontAwesomeIcon icon={isApproved ? faCheck : faXmark} />
        {isApproved ? "Quyết định duyệt" : "Quyết định từ chối"}
      </p>
      <dl className={styles.moderationGrid}>
        <div>
          <dt>Kiểm duyệt viên</dt>
          <dd>{item.moderation.moderatorName}</dd>
        </div>
        <div>
          <dt>Thời gian</dt>
          <dd>{item.moderation.actionAtLabel}</dd>
        </div>
      </dl>
      {item.moderation.note ? <p className={styles.moderationText}>{item.moderation.note}</p> : null}
      {item.moderation.reason ? (
        <p className={styles.moderationReason}>
          <strong>Lý do:</strong> {item.moderation.reason}
        </p>
      ) : null}
      {item.moderation.resubmitHint ? (
        <p className={styles.moderationHint}>{item.moderation.resubmitHint}</p>
      ) : null}
    </div>
  );
}

/**
 * @typedef {Object} ContentPostDetailPanelProps
 * @property {Object|null} item - Bài viết chi tiết; `null` hiển thị empty state.
 * @property {'queue'|'history'|'featured'} [mode='queue'] - Chế độ UI và hành động footer.
 * @property {boolean} [isPinned=false] - Bài đang ghim (mode `featured`).
 * @property {boolean} [canPin=true] - Còn slot ghim (mode `featured`).
 * @property {(id: string) => void} [onApprove] - Callback duyệt bài (mode `queue`).
 * @property {(id: string) => void} [onReject] - Callback từ chối bài (mode `queue`).
 * @property {boolean} [isApproving=false] - Đang gọi API duyệt.
 * @property {boolean} [isRejecting=false] - Đang gọi API từ chối.
 * @property {(id: string) => void} [onPin] - Callback ghim bài (mode `featured`).
 * @property {(id: string) => void} [onUnpin] - Callback bỏ ghim (mode `featured`).
 */

/**
 * Panel xem chi tiết bài viết — dùng trong hàng đợi, lịch sử và quản lý bài nổi bật.
 *
 * @param {ContentPostDetailPanelProps} props - Props panel.
 * @returns {import('react').ReactElement} Panel chi tiết hoặc empty state hướng dẫn chọn bài.
 *
 * @example
 * <ContentPostDetailPanel
 *   item={focusedItem}
 *   mode="queue"
 *   onApprove={(id) => handleApprove([id])}
 *   onReject={(id) => handleReject([id])}
 * />
 *
 * @example
 * <ContentPostDetailPanel item={post} mode="featured" isPinned canPin onPin={handlePin} />
 */
function ContentPostDetailPanel({
  item,
  mode = "queue",
  isPinned = false,
  canPin = true,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
  onPin,
  onUnpin,
}) {
  if (!item) {
    const emptyTitle =
      mode === "featured" ? "Chọn một bài viết để xem chi tiết" : "Chọn một bài viết để xem trước";
    const emptyDesc =
      mode === "featured"
        ? "Nhấp bài đang ghim hoặc kết quả tìm kiếm để xem nội dung trước khi ghim lên sidebar."
        : "Xem đầy đủ tiêu đề, nội dung, ảnh bìa, ảnh trong bài và file đính kèm.";

    return (
      <div className={styles.detailEmpty}>
        <FontAwesomeIcon icon={faMousePointer} className={styles.detailEmptyIcon} />
        <p className={styles.detailEmptyTitle}>{emptyTitle}</p>
        <p className={styles.detailEmptyDesc}>{emptyDesc}</p>
      </div>
    );
  }

  const bodyText = item.content ?? item.excerpt;
  const hasAttachments = item.attachments?.length > 0;
  const hasInlineImages = item.inlineImages?.length > 0;
  const showModerationActions = mode === "queue" && item.status === "pending";
  const isFeaturedMode = mode === "featured";

  return (
    <>
      <header className={styles.detailHead}>
        <div className={styles.detailHeadTop}>
          <ModeratorBadge label={TYPE_META.post.label} tone={TYPE_META.post.tone} />
          {isFeaturedMode ? (
            <>
              <ModeratorBadge label="Đã đăng" tone="success" dot />
              {isPinned ? <ModeratorBadge label="Đang ghim" tone="primary" /> : null}
              {item.categoryLabel ? (
                <ModeratorBadge label={item.categoryLabel} tone="muted" />
              ) : null}
            </>
          ) : (
            <StatusBadge status={item.status} />
          )}
          {!isFeaturedMode && item.resubmission ? (
            <span className={styles.detailFlagResubmit}>
              <FontAwesomeIcon icon={faRotateRight} />
              Gửi lại
            </span>
          ) : null}
          {item.anonymous ? (
            <span className={styles.detailFlag}>
              <FontAwesomeIcon icon={faUserSecret} />
              Ẩn danh
            </span>
          ) : null}
        </div>
        <h2 className={styles.detailTitle}>{item.title}</h2>
        <p className={styles.detailMeta}>
          {isFeaturedMode ? "Đăng" : "Gửi"} {item.submittedAtLabel ?? item.timeLabel}
          {item.semester ? ` · ${item.semester}` : ""}
          {item.major && item.major !== "—" ? ` · ${item.major}` : ""}
        </p>
      </header>

      <div className={styles.detailBody}>
        {!isFeaturedMode ? <ModerationRecord item={item} /> : null}

        {item.coverImage?.url ? (
          <figure className={styles.coverFigure}>
            <img
              src={item.coverImage.url}
              alt={item.coverImage.alt ?? item.title}
              className={styles.coverImage}
              loading="lazy"
              decoding="async"
            />
            <figcaption className={styles.mediaCaption}>
              <FontAwesomeIcon icon={faImage} />
              Ảnh bìa
              {item.coverImage.alt ? ` — ${item.coverImage.alt}` : ""}
            </figcaption>
          </figure>
        ) : null}

        <div className={styles.detailPreview}>
          <p className={styles.detailPreviewLabel}>Nội dung bài viết</p>
          <RichTextContent value={bodyText} className={styles.detailText} />
        </div>

        {hasInlineImages ? (
          <section className={styles.mediaSection}>
            <p className={styles.detailPreviewLabel}>Ảnh trong bài ({item.inlineImages.length})</p>
            <div className={styles.inlineGrid}>
              {item.inlineImages.map((image) => (
                <figure key={image.url} className={styles.inlineFigure}>
                  <img
                    src={image.url}
                    alt={image.caption ?? "Ảnh trong bài"}
                    className={styles.inlineImage}
                    loading="lazy"
                    decoding="async"
                  />
                  {image.caption ? (
                    <figcaption className={styles.mediaCaption}>{image.caption}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {hasAttachments ? (
          <section className={styles.mediaSection}>
            <p className={styles.detailPreviewLabel}>File đính kèm ({item.attachments.length})</p>
            <ul className={styles.attachmentList}>
              {item.attachments.map((file) => (
                <li key={file.id} className={styles.attachmentItem}>
                  <span className={styles.attachmentIcon} aria-hidden>
                    <FontAwesomeIcon icon={AttachmentIcon({ type: file.type })} />
                  </span>
                  <div className={styles.attachmentMeta}>
                    <p className={styles.attachmentName}>{file.name}</p>
                    <p className={styles.attachmentSize}>{file.sizeLabel}</p>
                  </div>
                  {file.url ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.attachmentBtn}
                      download={file.name}
                      aria-label={`Tải ${file.name}`}
                    >
                      <FontAwesomeIcon icon={faDownload} />
                      Xem / tải
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {item.tags?.length ? (
          <div className={styles.detailTags}>
            {item.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <dl className={styles.detailGrid}>
          <div className={styles.detailGridItem}>
            <dt>Tác giả</dt>
            <dd>{item.authorName}</dd>
          </div>
          <div className={styles.detailGridItem}>
            <dt>Mã sinh viên</dt>
            <dd>{item.studentId}</dd>
          </div>
          <div className={styles.detailGridItem}>
            <dt>Học kỳ</dt>
            <dd>{item.semester ?? "—"}</dd>
          </div>
          <div className={styles.detailGridItem}>
            <dt>Chuyên ngành</dt>
            <dd>{item.major ?? "—"}</dd>
          </div>
          {isFeaturedMode ? (
            <>
              <div className={styles.detailGridItem}>
                <dt>Lượt thích</dt>
                <dd className={styles.detailSetting}>
                  <FontAwesomeIcon icon={faHeart} />
                  {item.likes ?? 0}
                </dd>
              </div>
              <div className={styles.detailGridItem}>
                <dt>Số bình luận</dt>
                <dd>{item.comments ?? 0}</dd>
              </div>
            </>
          ) : (
            <div className={styles.detailGridItem}>
              <dt>Bình luận</dt>
              <dd className={styles.detailSetting}>
                <FontAwesomeIcon icon={item.allowComments ? faComment : faCommentSlash} />
                {item.allowComments ? "Cho phép" : "Tắt"}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {showModerationActions ? (
        <footer className={styles.detailActions}>
          <button
            type="button"
            className={styles.detailReject}
            disabled={isApproving || isRejecting}
            onClick={() => onReject?.(item.id)}
          >
            <FontAwesomeIcon icon={faXmark} />
            {isRejecting ? "Đang từ chối..." : "Từ chối"}
          </button>
          <button
            type="button"
            className={styles.detailApprove}
            disabled={isApproving || isRejecting}
            onClick={() => onApprove?.(item.id)}
          >
            <FontAwesomeIcon icon={faCheck} />
            {isApproving ? "Đang duyệt..." : "Duyệt"}
          </button>
        </footer>
      ) : isFeaturedMode ? (
        <footer className={styles.detailActions}>
          {isPinned ? (
            <button type="button" className={styles.detailReject} onClick={() => onUnpin?.(item.id)}>
              Bỏ ghim
            </button>
          ) : (
            <button
              type="button"
              className={styles.detailApprove}
              disabled={!canPin}
              onClick={() => onPin?.(item.id)}
            >
              <FontAwesomeIcon icon={faThumbtack} />
              Ghim bài
            </button>
          )}
        </footer>
      ) : mode === "history" && item.status === "pending" ? (
        <footer className={styles.detailActions}>
          <Link to="/moderator/content" className={styles.detailQueueLink}>
            Mở hàng đợi duyệt
          </Link>
        </footer>
      ) : null}
    </>
  );
}

/**
 * Export mặc định panel chi tiết bài viết kiểm duyệt.
 *
 * @type {typeof ContentPostDetailPanel}
 * @default
 */
export default ContentPostDetailPanel;
