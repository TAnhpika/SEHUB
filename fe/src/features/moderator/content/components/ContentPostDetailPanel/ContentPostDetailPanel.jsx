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
  faImage,
  faMousePointer,
  faRotateRight,
  faUserSecret,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import ModeratorBadge from "@/features/moderator/components/ModeratorBadge/ModeratorBadge";
import { STATUS_META, TYPE_META } from "@/features/moderator/content/contentModerationData";
import styles from "./ContentPostDetailPanel.module.css";

function AttachmentIcon({ type }) {
  if (type === "pdf") return faFilePdf;
  if (type === "zip") return faFileArchive;
  return faFile;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return <ModeratorBadge label={meta.label} tone={meta.tone} dot />;
}

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
 * @param {{
 *   item: object | null,
 *   mode?: 'queue' | 'history',
 *   onApprove?: (id: string) => void,
 *   onReject?: (id: string) => void,
 * }} props
 */
function ContentPostDetailPanel({ item, mode = "queue", onApprove, onReject }) {
  if (!item) {
    return (
      <div className={styles.detailEmpty}>
        <FontAwesomeIcon icon={faMousePointer} className={styles.detailEmptyIcon} />
        <p className={styles.detailEmptyTitle}>Chọn một bài viết để xem trước</p>
        <p className={styles.detailEmptyDesc}>
          Xem đầy đủ tiêu đề, nội dung, ảnh bìa, ảnh trong bài và file đính kèm.
        </p>
      </div>
    );
  }

  const bodyText = item.content ?? item.excerpt;
  const hasAttachments = item.attachments?.length > 0;
  const hasInlineImages = item.inlineImages?.length > 0;
  const showActions = mode === "queue" && item.status === "pending";

  return (
    <>
      <header className={styles.detailHead}>
        <div className={styles.detailHeadTop}>
          <ModeratorBadge label={TYPE_META.post.label} tone={TYPE_META.post.tone} />
          <StatusBadge status={item.status} />
          {item.resubmission ? (
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
          Gửi {item.submittedAtLabel ?? item.timeLabel}
          {item.semester ? ` · ${item.semester}` : ""}
          {item.major ? ` · ${item.major}` : ""}
        </p>
      </header>

      <div className={styles.detailBody}>
        <ModerationRecord item={item} />

        {item.coverImage?.url ? (
          <figure className={styles.coverFigure}>
            <img
              src={item.coverImage.url}
              alt={item.coverImage.alt ?? item.title}
              className={styles.coverImage}
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
          <div className={styles.detailText}>{bodyText}</div>
        </div>

        {hasInlineImages ? (
          <section className={styles.mediaSection}>
            <p className={styles.detailPreviewLabel}>Ảnh trong bài ({item.inlineImages.length})</p>
            <div className={styles.inlineGrid}>
              {item.inlineImages.map((image) => (
                <figure key={image.url} className={styles.inlineFigure}>
                  <img src={image.url} alt={image.caption ?? "Ảnh trong bài"} className={styles.inlineImage} />
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
                  <button type="button" className={styles.attachmentBtn} aria-label={`Tải ${file.name}`}>
                    <FontAwesomeIcon icon={faDownload} />
                    Xem / tải
                  </button>
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
          <div className={styles.detailGridItem}>
            <dt>Bình luận</dt>
            <dd className={styles.detailSetting}>
              <FontAwesomeIcon icon={item.allowComments ? faComment : faCommentSlash} />
              {item.allowComments ? "Cho phép" : "Tắt"}
            </dd>
          </div>
        </dl>
      </div>

      {showActions ? (
        <footer className={styles.detailActions}>
          <button type="button" className={styles.detailReject} onClick={() => onReject?.(item.id)}>
            <FontAwesomeIcon icon={faXmark} />
            Từ chối
          </button>
          <button type="button" className={styles.detailApprove} onClick={() => onApprove?.(item.id)}>
            <FontAwesomeIcon icon={faCheck} />
            Duyệt
          </button>
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

export default ContentPostDetailPanel;
