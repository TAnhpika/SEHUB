import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faEye,
  faHeart,
  faReply,
  faShareNodes,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import * as postsApi from "@/api/postsApi";
import RichTextEditor from "@/common/RichTextEditor/RichTextEditor";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import {
  loadPostById,
  removeComment,
  savePost,
  submitComment,
} from "@/features/feed/feedData";
import PostOwnerMenu from "@/features/feed/PostOwnerMenu/PostOwnerMenu";
import PostReportButton from "@/features/feed/PostReportButton/PostReportButton";
import { copyPostLink, isOwnComment, isOwnPost } from "@/features/feed/postUtils";
import CommentMentionPicker, { insertMention } from "@/features/feed/CommentMentionPicker/CommentMentionPicker";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import styles from "./PostDetailModal.module.css";

function PostDetailModal({
  post,
  open,
  onClose,
  onUpdate,
  onPostChange,
  onViewed,
  onDelete,
  initialEditMode = false,
  focusCommentsOnOpen = false,
}) {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { showCopyToast, showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayBody, setDisplayBody] = useState("");
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [savingPost, setSavingPost] = useState(false);
  const onPostChangeRef = useRef(onPostChange);
  const commentsRef = useRef(null);

  useEffect(() => {
    onPostChangeRef.current = onPostChange;
  }, [onPostChange]);

  function emitPostChange(patch) {
    onPostChangeRef.current?.(patch);
  }

  const handleImageUpload = useCallback(async (file) => {
    const result = await postsApi.uploadPostContentImage(file);
    return result?.url ?? result?.Url ?? null;
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!post || !open) return undefined;

    let cancelled = false;

    async function fetchDetail() {
      setDraft("");
      setIsEditing(initialEditMode);
      setEditingCommentId(null);
      setEditCommentDraft("");
      setDisplayTitle(post.title);
      setDisplayBody(post.body ?? post.excerpt);
      setEditTitle(post.title);
      setEditBody(post.body ?? post.excerpt);
      setLikeCount(post.likes ?? 0);
      setViewCount(post.views ?? 0);
      setComments(post.commentsList ?? []);
      setCommentCount(post.comments ?? 0);

      try {
        const detail = await loadPostById(post.id);
        if (cancelled || !detail) return;

        setComments(detail.commentsList ?? []);
        setCommentCount(detail.comments ?? 0);
        setDisplayTitle(detail.title);
        setDisplayBody(detail.body ?? detail.excerpt);
        setEditTitle(detail.title);
        setEditBody(detail.body ?? detail.excerpt);
        setLikeCount(detail.likes ?? 0);
        setViewCount(detail.views ?? 0);
        emitPostChange({
          id: post.id,
          comments: detail.comments ?? 0,
          commentsList: detail.commentsList ?? [],
          likes: detail.likes ?? 0,
          views: detail.views ?? 0,
        });
        onViewed?.(detail);
      } catch {
        // Giữ dữ liệu từ danh sách nếu không tải được chi tiết.
      }
    }

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [post?.id, open, initialEditMode]);

  useEffect(() => {
    if (!open || !focusCommentsOnOpen) {
      return;
    }

    const timer = setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => clearTimeout(timer);
  }, [open, focusCommentsOnOpen, post?.id]);

  if (!open || !post) return null;

  const isOwner = isOwnPost(post, user);
  const hasDraft = draft.trim().length > 0;

  function openProfile(username) {
    if (!username) return;
    navigate(`/profile/${username}`);
  }

  function handleCancelDraft() {
    setDraft("");
  }

  async function handleSubmitComment() {
    const content = draft.trim();
    if (!content || submittingComment) return;

    setSubmittingComment(true);
    try {
      const newComment = await submitComment(post.id, content, replyTarget?.id ?? null);
      const nextComments = [...comments, newComment];
      const nextCount = commentCount + 1;
      setComments(nextComments);
      setCommentCount(nextCount);
      emitPostChange({
        id: post.id,
        comments: nextCount,
        commentsList: nextComments,
      });
      setDraft("");
      setReplyTarget(null);
    } catch (err) {
      showToast(err.message ?? "Không gửi được bình luận.");
    } finally {
      setSubmittingComment(false);
    }
  }

  function handleReply(comment) {
    setReplyTarget({
      id: comment.id,
      username: comment.author?.username,
      name: comment.author?.name ?? comment.author?.displayName,
    });
    if (comment.author?.username) {
      setDraft((prev) => insertMention(prev, comment.author.username));
    }
  }

  function handleInsertMention(username) {
    setDraft((prev) => insertMention(prev, username));
  }

  function handleDraftKeyDown(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmitComment();
    }
  }

  function handleStartEdit() {
    setEditTitle(displayTitle);
    setEditBody(displayBody);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setEditTitle(displayTitle);
    setEditBody(displayBody);
    setIsEditing(false);
  }

  async function handleSaveEdit() {
    const title = editTitle.trim();
    const body = editBody.trim();
    if (!title || !body || savingPost) return;

    setSavingPost(true);
    try {
      const updatedPost = await savePost(post.id, {
        title,
        content: body,
        tags: post.tags,
      });

      const mergedPost = { ...post, ...updatedPost, title, body, excerpt: body };
      setDisplayTitle(title);
      setDisplayBody(body);
      setIsEditing(false);
      onUpdate?.(mergedPost);
      showToast("Đã cập nhật bài viết.");
    } catch (err) {
      showToast(err.message ?? "Không cập nhật được bài viết.");
    } finally {
      setSavingPost(false);
    }
  }

  function handleDeletePost() {
    onDelete?.(post);
    onClose();
  }

  async function handleShare() {
    try {
      await copyPostLink(post.id);
      showCopyToast();
    } catch {
      showCopyToast();
    }
  }

  function handleStartEditComment(comment) {
    setEditingCommentId(comment.id);
    setEditCommentDraft(comment.content);
  }

  function handleCancelEditComment() {
    setEditingCommentId(null);
    setEditCommentDraft("");
  }

  function handleSaveEditComment(commentId) {
    const content = editCommentDraft.trim();
    if (!content) return;

    setComments((prev) =>
      prev.map((item) => (item.id === commentId ? { ...item, content } : item)),
    );
    setEditingCommentId(null);
    setEditCommentDraft("");
  }

  async function handleDeleteComment(commentId) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa bình luận này?");
    if (!confirmed) return;

    try {
      await removeComment(post.id, commentId);
      const nextComments = comments.filter((item) => item.id !== commentId);
      const nextCount = Math.max(0, commentCount - 1);
      setComments(nextComments);
      setCommentCount(nextCount);
      emitPostChange({
        id: post.id,
        comments: nextCount,
        commentsList: nextComments,
      });
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditCommentDraft("");
      }
    } catch (err) {
      showToast(err.message ?? "Không xóa được bình luận.");
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="post-detail-title" className={styles["header-title"]}>
            Bài viết của {post.author.username}
          </h2>
          <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className={styles.body}>
          <article className={styles.post}>
            <div className={styles["author-row"]}>
              <div className={styles.author}>
                <button
                  type="button"
                  className={styles["profile-trigger"]}
                  onClick={() => openProfile(post.author.username)}
                >
                  <span className={styles.avatar} aria-hidden="true">
                    {post.author.initial}
                  </span>
                  <div>
                    <p
                      className={withPremiumUsernameClass(
                        styles.username,
                        isOwner && isPremium,
                      )}
                    >
                      {post.author.username}
                    </p>
                    <p className={styles.date}>{post.publishedAt}</p>
                  </div>
                </button>
              </div>

              {isOwner && !isEditing && (
                <PostOwnerMenu onEdit={handleStartEdit} onDelete={handleDeletePost} />
              )}
            </div>

            {isEditing ? (
              <div className={styles["edit-form"]}>
                <label className={styles.field}>
                  <span className={styles.label}>Tiêu đề</span>
                  <input
                    type="text"
                    className={styles["edit-input"]}
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Nội dung</span>
                  <RichTextEditor
                    value={editBody}
                    onChange={setEditBody}
                    variant="full"
                    rows={5}
                    toolbarAriaLabel="Định dạng nội dung"
                    aria-label="Chỉnh sửa nội dung bài viết"
                    onImageUpload={handleImageUpload}
                    onImageUploadError={(message) => showToast(message)}
                  />
                </label>
                <div className={styles["edit-actions"]}>
                  <button type="button" className={styles["edit-save"]} onClick={handleSaveEdit}>
                    Lưu thay đổi
                  </button>
                  <button type="button" className={styles["edit-cancel"]} onClick={handleCancelEdit}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className={styles.title}>
                  <span className={styles.hash}>#</span> <strong>{displayTitle}</strong>
                </h3>
                <RichTextContent value={displayBody} className={styles.content} />
              </>
            )}

            <div className={styles.stats}>
              <span className={styles.stat}>
                <FontAwesomeIcon icon={faHeart} className={styles["stat-liked"]} />
                {likeCount}
              </span>
              <span className={styles.stat}>
                <FontAwesomeIcon icon={faComment} />
                {commentCount}
              </span>
              <span className={styles.stat}>
                <FontAwesomeIcon icon={faEye} />
                {viewCount}
              </span>
              <div className={styles["footer-actions"]}>
                {!isOwner && (
                  <PostReportButton
                    postId={post.id}
                    postTitle={post.title}
                    className={`${styles.share} ${styles.report}`}
                  />
                )}
                <button type="button" className={styles.share} aria-label="Chia sẻ" onClick={handleShare}>
                  <FontAwesomeIcon icon={faShareNodes} />
                </button>
              </div>
            </div>
          </article>

          <section ref={commentsRef} className={styles.comments} aria-label="Bình luận">
            {comments.map((comment) => {
              const commentIsOwner = isOwnComment(comment, user);
              const isEditingComment = editingCommentId === comment.id;

              return (
              <article key={comment.id} className={styles.comment}>
                <div className={styles["comment-head"]}>
                  <button
                    type="button"
                    className={`${styles["comment-author"]} ${styles["profile-trigger"]}`}
                    onClick={() => openProfile(comment.author.username)}
                  >
                    <span className={styles["comment-avatar"]} aria-hidden="true">
                      {comment.author.initial}
                    </span>
                    <div>
                      <p className={styles["comment-name"]}>{comment.author.name}</p>
                      <p className={styles["comment-time"]}>{comment.time}</p>
                    </div>
                  </button>
                  {commentIsOwner && !isEditingComment && (
                    <PostOwnerMenu
                      horizontal
                      showDivider
                      editLabel="Sửa"
                      deleteLabel="Xóa"
                      menuAriaLabel="Tùy chọn bình luận"
                      onEdit={() => handleStartEditComment(comment)}
                      onDelete={() => handleDeleteComment(comment.id)}
                    />
                  )}
                </div>

                {isEditingComment ? (
                  <div className={styles["comment-edit"]}>
                    <RichTextEditor
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
                        onClick={() => handleSaveEditComment(comment.id)}
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        className={styles["comment-edit-cancel"]}
                        onClick={handleCancelEditComment}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <RichTextContent value={comment.content} className={styles["comment-content"]} />
                )}

                {!isEditingComment && (
                  <button type="button" className={styles.reply} onClick={() => handleReply(comment)}>
                    <FontAwesomeIcon icon={faReply} />
                    Trả lời
                  </button>
                )}
              </article>
              );
            })}

            <div className={styles.editor}>
              <div className={styles["editor-panel"]}>
                {replyTarget ? (
                  <div className={styles["reply-banner"]}>
                    <span>
                      Đang trả lời <strong>@{replyTarget.username ?? replyTarget.name}</strong>
                    </span>
                    <button type="button" onClick={() => setReplyTarget(null)}>
                      Hủy
                    </button>
                  </div>
                ) : null}
                <RichTextEditor
                  value={draft}
                  onChange={setDraft}
                  placeholder="Viết bình luận công khai"
                  variant="comment"
                  rows={4}
                  bordered={false}
                  textareaClassName={styles.input}
                  toolbarAriaLabel="Định dạng bình luận"
                  aria-label="Viết bình luận công khai"
                  onKeyDown={handleDraftKeyDown}
                />
                <CommentMentionPicker value={draft} onInsert={handleInsertMention} />

                <div className={styles["editor-footer"]}>
                  {hasDraft && (
                    <button type="button" className={styles.submit} onClick={handleSubmitComment}>
                      Bình luận
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={handleCancelDraft}
                    disabled={!hasDraft}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PostDetailModal;
