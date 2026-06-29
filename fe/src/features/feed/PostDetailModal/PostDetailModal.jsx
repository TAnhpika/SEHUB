import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faEye,
  faHeart,
  faReply,
  faShareNodes,
  faUserSlash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { Modal } from "@/common/Modal/Modal";
import { useToast } from "@/common/Toast/ToastProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import * as postsApi from "@/api/postsApi";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import {
  loadPostById,
  savePost,
  toggleLike,
} from "@/features/feed/feedData";
import { usePostDetail } from "@/features/feed/hooks/usePostDetail";
import PostOwnerMenu from "@/features/feed/PostOwnerMenu/PostOwnerMenu";
import PostReportButton from "@/features/feed/PostReportButton/PostReportButton";
import CommentReportButton from "@/features/reports/CommentReportButton/CommentReportButton";
import UserReportButton from "@/features/reports/UserReportButton/UserReportButton";
import { copyPostLink, isOwnComment, isOwnPost } from "@/features/feed/postUtils";
import CommentMentionPicker from "@/features/feed/CommentMentionPicker/CommentMentionPicker";
import PinnedBadge from "@/features/feed/shared/PinnedBadge/PinnedBadge";
import { filterDisplayTags } from "@/features/feed/shared/postDisplayUtils";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import styles from "./PostDetailModal.module.css";

const LazyRichTextEditor = lazy(() => import("@/common/RichTextEditor/RichTextEditor"));

function RichTextEditorField(props) {
  return (
    <Suspense fallback={<p>Đang tải trình soạn thảo...</p>}>
      <LazyRichTextEditor {...props} />
    </Suspense>
  );
}

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
  const { needsLoginPrompt, requireAuth } = useRequireAuth();
  const [commentSeed, setCommentSeed] = useState(undefined);
  const [commentCount, setCommentCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayBody, setDisplayBody] = useState("");
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [savingPost, setSavingPost] = useState(false);
  const onPostChangeRef = useRef(onPostChange);
  const commentsRef = useRef(null);

  useEffect(() => {
    onPostChangeRef.current = onPostChange;
  }, [onPostChange]);

  const handleCommentsChange = useCallback(
    (nextComments) => {
      if (!post?.id) return;
      setCommentCount(nextComments.length);
      onPostChangeRef.current?.({
        id: post.id,
        comments: nextComments.length,
        commentsList: nextComments,
      });
    },
    [post?.id],
  );

  const {
    comments,
    draft,
    setDraft,
    editingCommentId,
    editCommentDraft,
    setEditCommentDraft,
    replyTarget,
    setReplyTarget,
    hasDraft,
    handleSubmitComment,
    handleReply,
    handleInsertMention,
    handleStartEditComment,
    handleCancelEditComment,
    handleSaveEditComment,
    handleDeleteComment,
  } = usePostDetail(post?.id, {
    initialComments: commentSeed,
    onCommentsChange: handleCommentsChange,
  });

  function emitPostChange(patch) {
    onPostChangeRef.current?.(patch);
  }

  const handleImageUpload = useCallback(async (file) => {
    const result = await postsApi.uploadPostContentImage(file);
    return result?.url ?? result?.Url ?? null;
  }, []);

  useEffect(() => {
    if (!post || !open) return undefined;

    let cancelled = false;

    async function fetchDetail() {
      setCommentSeed(undefined);
      setIsEditing(initialEditMode);
      setDisplayTitle(post.title);
      setDisplayBody(post.body ?? post.excerpt);
      setEditTitle(post.title);
      setEditBody(post.body ?? post.excerpt);
      setLikeCount(post.likes ?? 0);
      setLiked(Boolean(post.isLiked));
      setViewCount(post.views ?? 0);
      setCommentSeed(post.commentsList ?? []);
      setCommentCount(post.comments ?? 0);

      try {
        const detail = await loadPostById(post.id);
        if (cancelled || !detail) return;

        setCommentSeed(detail.commentsList ?? []);
        setCommentCount(detail.comments ?? 0);
        setDisplayTitle(detail.title);
        setDisplayBody(detail.body ?? detail.excerpt);
        setEditTitle(detail.title);
        setEditBody(detail.body ?? detail.excerpt);
        setLikeCount(detail.likes ?? 0);
        setLiked(Boolean(detail.isLiked));
        setViewCount(detail.views ?? 0);
        emitPostChange({
          id: post.id,
          comments: detail.comments ?? 0,
          commentsList: detail.commentsList ?? [],
          likes: detail.likes ?? 0,
          views: detail.views ?? 0,
          isLiked: detail.isLiked,
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
  const displayTags = filterDisplayTags(post.tags);

  function openProfile(username) {
    if (!username) return;
    navigate(`/profile/${username}`);
  }

  function handleCancelDraft() {
    setDraft("");
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

  function handleScrollToComments() {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleLike() {
    if (needsLoginPrompt) {
      requireAuth("Vui lòng đăng nhập để thích bài viết.");
      return;
    }
    if (liking) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => (liked ? Math.max(0, count - 1) : count + 1));
    setLiking(true);

    try {
      const result = await toggleLike(post.id, liked);
      setLiked(result.isLiked);
      setLikeCount(result.likeCount);
      emitPostChange({
        id: post.id,
        likes: result.likeCount,
        isLiked: result.isLiked,
      });
    } catch {
      setLiked(liked);
      setLikeCount(post.likes ?? 0);
    } finally {
      setLiking(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={styles.overlay}
      panelClassName={styles.dialog}
      closeOnOverlay
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
                  <RichTextEditorField
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
                <div className={styles.titleRow}>
                  {post.isPinned ? <PinnedBadge /> : null}
                  <h3 className={styles.title}>{displayTitle}</h3>
                </div>
                <RichTextContent value={displayBody} className={styles.content} />
                {displayTags.length > 0 ? (
                  <ul className={styles.tags} aria-label="Thẻ bài viết">
                    {displayTags.map((tag) => (
                      <li key={tag} className={styles.tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}

            <div className={styles.stats}>
              <button
                type="button"
                className={`${styles.stat} ${liked ? styles.statActive : ""}`}
                aria-label="Thích bài viết"
                aria-pressed={liked}
                disabled={liking}
                onClick={handleLike}
              >
                <FontAwesomeIcon icon={faHeart} />
                {likeCount}
              </button>
              <button
                type="button"
                className={styles.stat}
                aria-label="Bình luận"
                onClick={handleScrollToComments}
              >
                <FontAwesomeIcon icon={faComment} />
                {commentCount}
              </button>
              <span className={styles.stat} aria-label="Lượt xem">
                <FontAwesomeIcon icon={faEye} />
                {viewCount}
              </span>
              <div className={styles["footer-actions"]}>
                {!isOwner && (
                  <>
                    <PostReportButton
                      postId={post.id}
                      postTitle={post.title}
                      className={`${styles.share} ${styles.report}`}
                    />
                    {post.author?.id ? (
                      <UserReportButton
                        userId={post.author.id}
                        username={post.author.username}
                        source="post"
                        postId={post.id}
                        className={`${styles.share} ${styles.report}`}
                        label="Báo cáo tác giả"
                        icon={faUserSlash}
                      />
                    ) : null}
                  </>
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
                  {commentIsOwner && !isEditingComment ? (
                    <PostOwnerMenu
                      horizontal
                      showDivider
                      editLabel="Sửa"
                      deleteLabel="Xóa"
                      menuAriaLabel="Tùy chọn bình luận"
                      onEdit={() => handleStartEditComment(comment)}
                      onDelete={() => handleDeleteComment(comment.id)}
                    />
                  ) : !commentIsOwner ? (
                    <CommentReportButton
                      postId={post.id}
                      commentId={comment.id}
                      commentPreview={comment.content}
                      className={`${styles.share} ${styles.report}`}
                    />
                  ) : null}
                </div>

                {isEditingComment ? (
                  <div className={styles["comment-edit"]}>
                    <RichTextEditorField
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
                <RichTextEditorField
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
    </Modal>
  );
}

export default PostDetailModal;
