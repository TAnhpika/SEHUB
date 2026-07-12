import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReply } from "@fortawesome/free-solid-svg-icons";
import CommentReportButton from "@/features/reports/CommentReportButton/CommentReportButton";
import PostOwnerMenu from "@/features/feed/PostOwnerMenu/PostOwnerMenu";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import { isOwnComment } from "@/features/feed/postUtils";

/**
 * @param {{
 *   comment: object;
 *   depth?: number;
 *   postId: string;
 *   user: object | null;
 *   styles: Record<string, string>;
 *   editingCommentId: string | null;
 *   editCommentDraft: string;
 *   setEditCommentDraft: (value: string) => void;
 *   onOpenProfile: (username: string) => void;
 *   onStartEdit: (comment: object) => void;
 *   onCancelEdit: () => void;
 *   onSaveEdit: (commentId: string) => void;
 *   onDelete: (commentId: string) => void;
 *   onReply: (comment: object) => void;
 *   EditorComponent: import('react').ComponentType<any>;
 * }} props
 */
function CommentThread({
  comment,
  depth = 0,
  postId,
  user,
  styles,
  editingCommentId,
  editCommentDraft,
  setEditCommentDraft,
  onOpenProfile,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onReply,
  EditorComponent,
}) {
  const commentIsOwner = isOwnComment(comment, user);
  const isEditingComment = editingCommentId === comment.id;
  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  const canReply = depth === 0;

  return (
    <>
      <article
        className={`${styles.comment}${depth > 0 && styles.commentReply ? ` ${styles.commentReply}` : ""}`}
        style={depth > 0 ? { marginLeft: `${Math.min(depth, 3) * 1.25}rem` } : undefined}
      >
        <div className={styles["comment-head"]}>
          <button
            type="button"
            className={`${styles["comment-author"]} ${styles["profile-trigger"]}`}
            onClick={() => onOpenProfile(comment.author?.username)}
          >
            <span className={styles["comment-avatar"]} aria-hidden="true">
              {comment.author?.initial}
            </span>
            <div>
              <p className={styles["comment-name"]}>{comment.author?.name}</p>
              <p className={styles["comment-time"]}>{comment.time}</p>
            </div>
          </button>

          {commentIsOwner && !isEditingComment ? (
            <PostOwnerMenu
              horizontal
              showDivider
              editLabel="Sửa"
              deleteLabel="Xóa"
              menuAriaLabel="Tùy chọn bình luận"
              onEdit={() => onStartEdit(comment)}
              onDelete={() => onDelete(comment.id)}
            />
          ) : !commentIsOwner ? (
            <CommentReportButton
              postId={postId}
              commentId={comment.id}
              commentPreview={comment.content}
              className={`${styles.share} ${styles.report}`}
            />
          ) : null}
        </div>

        {isEditingComment ? (
          <div className={styles["comment-edit"]}>
            <EditorComponent
              value={editCommentDraft}
              onChange={setEditCommentDraft}
              variant="comment"
              rows={3}
              bordered={false}
              textareaClassName={styles["comment-edit-input"]}
              toolbarAriaLabel="Định dạng bình luận"
              aria-label="Chỉnh sửa bình luận"
            />
            <div className={styles["comment-edit-actions"]}>
              <button
                type="button"
                className={styles["comment-edit-save"]}
                onClick={() => onSaveEdit(comment.id)}
              >
                Lưu
              </button>
              <button type="button" className={styles["comment-edit-cancel"]} onClick={onCancelEdit}>
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <RichTextContent value={comment.content} className={styles["comment-content"]} />
        )}

        {!isEditingComment && canReply ? (
          <button type="button" className={styles.reply} onClick={() => onReply(comment)}>
            <FontAwesomeIcon icon={faReply} />
            Trả lời
          </button>
        ) : null}
      </article>

      {replies.map((reply) => (
        <CommentThread
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          postId={postId}
          user={user}
          styles={styles}
          editingCommentId={editingCommentId}
          editCommentDraft={editCommentDraft}
          setEditCommentDraft={setEditCommentDraft}
          onOpenProfile={onOpenProfile}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSaveEdit={onSaveEdit}
          onDelete={onDelete}
          onReply={onReply}
          EditorComponent={EditorComponent}
        />
      ))}
    </>
  );
}

export default CommentThread;
